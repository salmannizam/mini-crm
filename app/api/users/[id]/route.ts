import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { updateUserSchema } from "@/lib/validations";
import { requireAuth, requireRole } from "@/lib/auth";
import { UserRole, getCreatableRoles } from "@/lib/constants";
import { validateHierarchy } from "@/lib/hierarchy";
import mongoose from "mongoose";

async function handleGet(
  req: NextRequest,
  user: any,
  params: { id: string }
) {
  await connectDB();

  const targetUserId = params.id;
  const isSelf = user._id.toString() === targetUserId;
  const isAdmin = user.role === UserRole.ADMIN;

  // Only Admin can view other users, or users can view themselves
  if (!isAdmin && !isSelf) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const targetUser = await User.findOne({
    _id: targetUserId,
    isDeleted: false,
  }).select("-password");

  if (!targetUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  return Response.json({ user: targetUser });
}

async function handlePatch(
  req: NextRequest,
  user: any,
  params: { id: string }
) {
  const body = await req.json();
  const validatedData = updateUserSchema.parse(body);

  await connectDB();

  const targetUser = await User.findOne({
    _id: params.id,
    isDeleted: false,
  });

  if (!targetUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  // Only Admin can edit users (except users can edit their own name/email)
  const isSelf = user._id.toString() === params.id;
  const isAdmin = user.role === UserRole.ADMIN;

  if (!isAdmin && !isSelf) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only Admin can change role, isActive, and reportingTo
  if (!isAdmin) {
    if (validatedData.role || validatedData.isActive !== undefined || validatedData.reportingTo !== undefined) {
      return Response.json(
        { error: "You can only edit your own name and email" },
        { status: 403 }
      );
    }
  } else {
    // If changing role, validate permissions
    if (validatedData.role) {
      const creatableRoles = getCreatableRoles(user.role);
      if (!creatableRoles.includes(validatedData.role)) {
        return Response.json(
          { error: `You cannot assign role ${validatedData.role}` },
          { status: 403 }
        );
      }
    }

    // Validate hierarchy if reportingTo is being changed
    if (validatedData.reportingTo !== undefined) {
      const newRole = validatedData.role || targetUser.role;
      const hierarchyValidation = await validateHierarchy(
        newRole,
        validatedData.reportingTo,
        params.id
      );
      if (!hierarchyValidation.valid) {
        return Response.json(
          { error: hierarchyValidation.error },
          { status: 400 }
        );
      }
    }
  }

  // Update user fields
  if (validatedData.name !== undefined) targetUser.name = validatedData.name;
  if (validatedData.email !== undefined) targetUser.email = validatedData.email;
  if (validatedData.role !== undefined) targetUser.role = validatedData.role;
  if (validatedData.isActive !== undefined) targetUser.isActive = validatedData.isActive;
  
  // Handle reportingTo separately
  if (validatedData.reportingTo !== undefined) {
    targetUser.reportingTo = validatedData.reportingTo 
      ? new mongoose.Types.ObjectId(validatedData.reportingTo)
      : undefined;
  }
  
  targetUser.updatedBy = user._id;
  await targetUser.save();

  return Response.json({
    success: true,
    user: {
      id: targetUser._id.toString(),
      name: targetUser.name,
      email: targetUser.email,
      role: targetUser.role,
      isActive: targetUser.isActive,
    },
  });
}

async function handleDelete(
  req: NextRequest,
  user: any,
  params: { id: string }
) {
  await connectDB();

  // Only Admin can delete users
  if (user.role !== UserRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const targetUser = await User.findOne({
    _id: params.id,
    isDeleted: false,
  });

  if (!targetUser) {
    return Response.json({ error: "User not found" }, { status: 404 });
  }

  targetUser.isDeleted = true;
  targetUser.updatedBy = user._id;
  await targetUser.save();

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
  const handler = requireRole([UserRole.ADMIN], async (request, user) => {
    return handleDelete(request, user, { id });
  });
  return handler(req);
}
