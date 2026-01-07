import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { updateUserSchema } from "@/lib/validations";
import { requireAuth, requireRole } from "@/lib/auth";
import { UserRole } from "@/lib/constants";

async function handleGet(
  req: NextRequest,
  user: any,
  params: { id: string }
) {
  await connectDB();

  const targetUserId = params.id;

  if (user.role !== UserRole.ADMIN && user._id.toString() !== targetUserId) {
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

  if (user.role !== UserRole.ADMIN && user._id.toString() !== params.id) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  if (user.role !== UserRole.ADMIN && validatedData.role) {
    return Response.json(
      { error: "Cannot change role" },
      { status: 403 }
    );
  }

  if (user.role !== UserRole.ADMIN && validatedData.isActive !== undefined) {
    return Response.json(
      { error: "Cannot change active status" },
      { status: 403 }
    );
  }

  Object.assign(targetUser, validatedData);
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
