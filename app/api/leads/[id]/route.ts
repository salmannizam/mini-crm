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

  if (validatedData.status && validatedData.status !== oldStatus) {
    lead.activityLogs.push({
      action: "status_changed",
      description: `Status changed from ${oldStatus} to ${validatedData.status} by ${user.name}`,
      performedBy: user._id,
      performedByName: user.name,
      createdAt: new Date(),
    });
  }

  if (
    validatedData.assignedUser &&
    validatedData.assignedUser !== oldAssignedUser
  ) {
    const newUser = await import("@/models/User").then((m) =>
      m.default.findById(validatedData.assignedUser)
    );
    lead.activityLogs.push({
      action: "reassigned",
      description: `Lead reassigned from previous user to ${newUser?.name || "unknown"} by ${user.name}`,
      performedBy: user._id,
      performedByName: user.name,
      createdAt: new Date(),
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
