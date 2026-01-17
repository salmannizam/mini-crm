import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import { createLeadSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";
import { UserRole, LeadStatus, LeadSource } from "@/lib/constants";
import { getManageableUsers, canAssignToUser, getAssignableUserIds } from "@/lib/hierarchy";

async function handleGet(req: NextRequest, user: any) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  
  // Legacy filters (for backward compatibility)
  const status = searchParams.get("status");
  const assignedUser = searchParams.get("assignedUser");
  const search = searchParams.get("search");

  // Advanced filters
  const name = searchParams.get("name");
  const email = searchParams.get("email");
  const phone = searchParams.get("phone");
  const address = searchParams.get("address");
  const statuses = searchParams.get("statuses")?.split(",").filter(Boolean) || [];
  const sources = searchParams.get("sources")?.split(",").filter(Boolean) || [];
  const assignedUsers = searchParams.get("assignedUsers")?.split(",").filter(Boolean) || [];
  const createdFrom = searchParams.get("createdFrom");
  const createdTo = searchParams.get("createdTo");
  const updatedFrom = searchParams.get("updatedFrom");
  const updatedTo = searchParams.get("updatedTo");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const query: any = { isDeleted: false };

  // Determine which leads the user can see based on role
  let userScope: mongoose.Types.ObjectId[] = [];
  
  if (user.role === UserRole.USER) {
    // Users can only see their own leads
    userScope = [user._id];
  } else if (user.role === UserRole.ADMIN) {
    // Admin can see all leads
    // No restriction needed
  } else {
    // Manager and TL can see leads assigned to their team
    const assignableUserIds = await getAssignableUserIds(user._id.toString());
    userScope = assignableUserIds.map(id => new mongoose.Types.ObjectId(id));
  }

  // Apply user scope restriction
  if (user.role === UserRole.USER) {
    query.assignedUser = user._id;
  } else if (user.role !== UserRole.ADMIN && userScope.length > 0) {
    query.assignedUser = { $in: userScope };
  }

  // Advanced assigned user filter (multiple selection)
  if (assignedUsers.length > 0) {
    // Validate all assigned users are in scope
    const validUserIds = assignedUsers
      .filter(id => /^[0-9a-fA-F]{24}$/.test(id))
      .map(id => new mongoose.Types.ObjectId(id));
    
    if (user.role !== UserRole.ADMIN) {
      // For non-admin, validate users are in scope
      const validScopeIds = validUserIds.filter(id => 
        userScope.some(scopeId => scopeId.equals(id))
      );
      if (validScopeIds.length > 0) {
        query.assignedUser = { $in: validScopeIds };
      } else {
        // No valid users in scope, return empty
        return Response.json({
          leads: [],
          pagination: { page, limit, total: 0, pages: 0 },
        });
      }
    } else {
      query.assignedUser = { $in: validUserIds };
    }
  } else if (assignedUser) {
    // Legacy single assigned user filter
    if (/^[0-9a-fA-F]{24}$/.test(assignedUser)) {
      const userId = new mongoose.Types.ObjectId(assignedUser);
      if (user.role === UserRole.ADMIN || userScope.some(id => id.equals(userId))) {
        query.assignedUser = userId;
      } else {
        return Response.json({
          leads: [],
          pagination: { page, limit, total: 0, pages: 0 },
        });
      }
    }
  }

  // Field-specific search
  const searchConditions: any[] = [];
  if (name) {
    searchConditions.push({ name: { $regex: name, $options: "i" } });
  }
  if (email) {
    searchConditions.push({ email: { $regex: email, $options: "i" } });
  }
  if (phone) {
    searchConditions.push({ phone: { $regex: phone, $options: "i" } });
  }
  if (address) {
    searchConditions.push({ address: { $regex: address, $options: "i" } });
  }
  
  // Legacy general search (searches all text fields)
  if (search && !name && !email && !phone && !address) {
    searchConditions.push(
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } }
    );
  }

  if (searchConditions.length > 0) {
    query.$or = searchConditions;
  }

  // Status filter (multiple selection)
  if (statuses.length > 0) {
    query.status = { $in: statuses };
  } else if (status) {
    // Legacy single status filter
    query.status = status;
  }

  // Source filter (multiple selection)
  if (sources.length > 0) {
    query.source = { $in: sources };
  }

  // Date range filters
  if (createdFrom || createdTo) {
    query.createdAt = {};
    if (createdFrom) {
      query.createdAt.$gte = new Date(createdFrom);
    }
    if (createdTo) {
      const toDate = new Date(createdTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      query.createdAt.$lte = toDate;
    }
  }

  if (updatedFrom || updatedTo) {
    query.updatedAt = {};
    if (updatedFrom) {
      query.updatedAt.$gte = new Date(updatedFrom);
    }
    if (updatedTo) {
      const toDate = new Date(updatedTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      query.updatedAt.$lte = toDate;
    }
  }

  const skip = (page - 1) * limit;

  // Build sort object
  const sort: any = {};
  sort[sortBy] = sortOrder === "asc" ? 1 : -1;

  const [leads, total] = await Promise.all([
    Lead.find(query)
      .populate("assignedUser", "name email")
      .populate("createdBy", "name email")
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    Lead.countDocuments(query),
  ]);

  return Response.json({
    leads,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

async function handlePost(req: NextRequest, user: any) {
  const body = await req.json();
  const validatedData = createLeadSchema.parse(body);

  await connectDB();

  let assignedUserId: mongoose.Types.ObjectId;

  if (user.role === UserRole.USER) {
    // Users can only assign leads to themselves
    assignedUserId = user._id;
  } else {
    // Admin, Manager, and TL can assign to others
    if (!validatedData.assignedUser) {
      return Response.json(
        { error: "Assigned user is required" },
        { status: 400 }
      );
    }
    
    // Validate ObjectId format
    if (!/^[0-9a-fA-F]{24}$/.test(validatedData.assignedUser)) {
      return Response.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }

    // Check if user can assign to this user
    const canAssign = await canAssignToUser(user._id.toString(), validatedData.assignedUser);
    if (!canAssign) {
      return Response.json(
        { error: "You cannot assign leads to this user" },
        { status: 403 }
      );
    }

    assignedUserId = new mongoose.Types.ObjectId(validatedData.assignedUser);
  }

  const leadData: any = {
    ...validatedData,
    assignedUser: assignedUserId,
    createdBy: user._id,
    source: validatedData.source || LeadSource.OTHER,
    businessType: validatedData.businessType || undefined,
    status: validatedData.status || LeadStatus.NEW,
  };

  const lead = await Lead.create(leadData);

  lead.activityLogs.push({
    action: "created",
    description: `Lead "${leadData.name}" created by ${user.name}`,
    performedBy: user._id,
    performedByName: user.name,
    createdAt: new Date(),
    metadata: {
      status: leadData.status,
      source: leadData.source,
    },
  });

  await lead.save();

  const populatedLead = await Lead.findById(lead._id)
    .populate("assignedUser", "name email")
    .populate("createdBy", "name email");

  return Response.json(
    {
      success: true,
      lead: populatedLead,
    },
    { status: 201 }
  );
}

export const GET = requireAuth(handleGet);
export const POST = requireAuth(handlePost);
