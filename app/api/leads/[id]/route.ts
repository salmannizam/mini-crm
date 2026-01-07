import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import { updateLeadSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";
import { UserRole } from "@/lib/constants";

async function handleGet(
  req: NextRequest,
  user: any,
  params: { id: string }
) {
  await connectDB();

  const query: any = {
    _id: params.id,
    isDeleted: false,
  };

  if (user.role !== UserRole.ADMIN) {
    query.assignedUser = user._id;
  }

  const lead = await Lead.findOne(query)
    .populate("assignedUser", "name email")
    .populate("createdBy", "name email")
    .populate("followUps.createdBy", "name email")
    .populate("comments.author", "name email role")
    .populate("activityLogs.performedBy", "name email");

  if (!lead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  return Response.json({ lead });
}

async function handlePatch(
  req: NextRequest,
  user: any,
  params: { id: string }
) {
  const body = await req.json();
  const validatedData = updateLeadSchema.parse(body);

  await connectDB();

  const query: any = {
    _id: params.id,
    isDeleted: false,
  };

  if (user.role !== UserRole.ADMIN) {
    query.assignedUser = user._id;
  }

  const lead = await Lead.findOne(query);

  if (!lead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  const oldStatus = lead.status;
  const oldAssignedUser = lead.assignedUser.toString();
  const oldName = lead.name;
  const oldEmail = lead.email;
  const oldPhone = lead.phone;
  const oldAddress = lead.address;

  // Track field changes with metadata
  if (validatedData.status && validatedData.status !== oldStatus) {
    lead.activityLogs.push({
      action: "status_changed",
      description: `Status changed by ${user.name}`,
      performedBy: user._id,
      performedByName: user.name,
      createdAt: new Date(),
      metadata: {
        field: "status",
        oldValue: oldStatus,
        newValue: validatedData.status,
      },
    });
  }

  if (
    validatedData.assignedUser &&
    validatedData.assignedUser !== oldAssignedUser
  ) {
    const newUser = await import("@/models/User").then((m) =>
      m.default.findById(validatedData.assignedUser)
    );
    const oldUser = await import("@/models/User").then((m) =>
      m.default.findById(oldAssignedUser)
    );
    lead.activityLogs.push({
      action: "assigned",
      description: `Lead reassigned by ${user.name}`,
      performedBy: user._id,
      performedByName: user.name,
      createdAt: new Date(),
      metadata: {
        field: "assignedUser",
        oldValue: oldUser?.name || "Unknown",
        newValue: newUser?.name || "Unknown",
      },
    });
  }

  // Track other field changes
  if (validatedData.name && validatedData.name !== oldName) {
    lead.activityLogs.push({
      action: "updated",
      description: `Name updated by ${user.name}`,
      performedBy: user._id,
      performedByName: user.name,
      createdAt: new Date(),
      metadata: {
        field: "name",
        oldValue: oldName,
        newValue: validatedData.name,
      },
    });
  }

  if (validatedData.email && validatedData.email !== oldEmail) {
    lead.activityLogs.push({
      action: "updated",
      description: `Email updated by ${user.name}`,
      performedBy: user._id,
      performedByName: user.name,
      createdAt: new Date(),
      metadata: {
        field: "email",
        oldValue: oldEmail || "N/A",
        newValue: validatedData.email,
      },
    });
  }

  if (validatedData.phone && validatedData.phone !== oldPhone) {
    lead.activityLogs.push({
      action: "updated",
      description: `Phone updated by ${user.name}`,
      performedBy: user._id,
      performedByName: user.name,
      createdAt: new Date(),
      metadata: {
        field: "phone",
        oldValue: oldPhone,
        newValue: validatedData.phone,
      },
    });
  }

  if (validatedData.address && validatedData.address !== oldAddress) {
    lead.activityLogs.push({
      action: "updated",
      description: `Address updated by ${user.name}`,
      performedBy: user._id,
      performedByName: user.name,
      createdAt: new Date(),
      metadata: {
        field: "address",
        oldValue: oldAddress,
        newValue: validatedData.address,
      },
    });
  }

  // Convert assignedUser string to ObjectId if provided
  const updateData: any = { ...validatedData };
  if (updateData.assignedUser) {
    updateData.assignedUser = new mongoose.Types.ObjectId(updateData.assignedUser);
  }

  Object.assign(lead, updateData);
  lead.updatedBy = user._id;
  await lead.save();

  const populatedLead = await Lead.findById(lead._id)
    .populate("assignedUser", "name email")
    .populate("createdBy", "name email")
    .populate("followUps.createdBy", "name email")
    .populate("comments.author", "name email role")
    .populate("activityLogs.performedBy", "name email");

  return Response.json({
    success: true,
    lead: populatedLead,
  });
}

async function handleDelete(
  req: NextRequest,
  user: any,
  params: { id: string }
) {
  await connectDB();

  const query: any = {
    _id: params.id,
    isDeleted: false,
  };

  if (user.role !== UserRole.ADMIN) {
    query.assignedUser = user._id;
  }

  const lead = await Lead.findOne(query);

  if (!lead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  lead.isDeleted = true;
  lead.updatedBy = user._id;
  await lead.save();

  return Response.json({ success: true });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const handler = requireAuth(async (request, user) => {
    return handleGet(request, user, { id });
  });
  return handler(req);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const handler = requireAuth(async (request, user) => {
    return handlePatch(request, user, { id });
  });
  return handler(req);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const handler = requireAuth(async (request, user) => {
    return handleDelete(request, user, { id });
  });
  return handler(req);
}
