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
  const status = searchParams.get("status");
  const assignedUser = searchParams.get("assignedUser");
  const search = searchParams.get("search");

  const query: any = { isDeleted: false };

  // Determine which leads the user can see based on role
  if (user.role === UserRole.USER) {
    // Users can only see their own leads
    query.assignedUser = user._id;
  } else if (user.role === UserRole.ADMIN) {
    // Admin can see all leads, optionally filtered by assignedUser
    if (assignedUser) {
      // Validate and convert to ObjectId
      if (/^[0-9a-fA-F]{24}$/.test(assignedUser)) {
        query.assignedUser = new mongoose.Types.ObjectId(assignedUser);
      } else {
        return Response.json(
          { error: "Invalid assigned user ID format" },
          { status: 400 }
        );
      }
    }
  } else {
    // Manager and TL can see leads assigned to their team
    const assignableUserIds = await getAssignableUserIds(user._id.toString());
    
    if (assignedUser) {
      // If filtering by specific user, validate they're in the team
      if (!assignableUserIds.includes(assignedUser)) {
        return Response.json(
          { error: "You can only view leads assigned to your team" },
          { status: 403 }
        );
      }
      query.assignedUser = new mongoose.Types.ObjectId(assignedUser);
    } else {
      // Show all leads for team members
      query.assignedUser = { $in: assignableUserIds.map(id => new mongoose.Types.ObjectId(id)) };
    }
  }

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$text = { $search: search };
  }

  const skip = (page - 1) * limit;

  const [leads, total] = await Promise.all([
    Lead.find(query)
      .populate("assignedUser", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
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
    source:
      user.role === UserRole.ADMIN
        ? validatedData.source || LeadSource.ADMIN_ASSIGNED
        : LeadSource.MANUAL,
    status: validatedData.status || LeadStatus.NEW,
  };

  const lead = await Lead.create(leadData);

  lead.activityLogs.push({
    action: "created",
    description: `Lead created by ${user.name}`,
    performedBy: user._id,
    performedByName: user.name,
    createdAt: new Date(),
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
