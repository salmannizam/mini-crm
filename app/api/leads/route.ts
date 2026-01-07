import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import { createLeadSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";
import { UserRole, LeadStatus, LeadSource } from "@/lib/constants";

async function handleGet(req: NextRequest, user: any) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const status = searchParams.get("status");
  const assignedUser = searchParams.get("assignedUser");
  const search = searchParams.get("search");

  const query: any = { isDeleted: false };

  if (user.role !== UserRole.ADMIN) {
    query.assignedUser = user._id;
  } else if (assignedUser) {
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

  // Validate assignedUser for admin users
  if (user.role === UserRole.ADMIN) {
    if (!validatedData.assignedUser) {
      return Response.json(
        { error: "Assigned user is required for admin users" },
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
  }

  const leadData: any = {
    ...validatedData,
    createdBy: user._id,
    source:
      user.role === UserRole.ADMIN
        ? validatedData.source || LeadSource.ADMIN_ASSIGNED
        : LeadSource.MANUAL,
    status: validatedData.status || LeadStatus.NEW,
  };

  if (user.role !== UserRole.ADMIN) {
    leadData.assignedUser = user._id;
  } else {
    // Convert string to ObjectId for admin-assigned users
    leadData.assignedUser = new mongoose.Types.ObjectId(validatedData.assignedUser);
  }

  const lead = await Lead.create(leadData);

  lead.activityLogs.push({
    action: "created",
    description: `Lead created by ${user.name}`,
    performedBy: user._id,
    performedByName: user.name,
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
