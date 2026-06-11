import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Customer from "@/models/Customer";
import { requireAuth } from "@/lib/auth";
import { UserRole } from "@/lib/constants";

export async function handleGet(req: NextRequest, user: any, params: { id: string }) {
  await connectDB();

  const query: any = {
    _id: params.id,
    isDeleted: false,
  };

  // Employees can only access their own customers
  if (user.role === UserRole.EMPLOYEE) {
    query.assignedUser = user._id;
  }

  const customer = await Customer.findOne(query)
    .populate("assignedUser", "name email")
    .populate("createdBy", "name email")
    .populate("notes.createdBy", "name email")
    .populate("documents.uploadedBy", "name email")
    .populate("communicationHistory.createdBy", "name email");

  if (!customer) {
    return Response.json({ error: "Customer not found" }, { status: 404 });
  }

  return Response.json({ customer });
}

export async function handlePatch(req: NextRequest, user: any, params: { id: string }) {
  const body = await req.json();
  await connectDB();

  const query: any = {
    _id: params.id,
    isDeleted: false,
  };

  // Employees can only update their own customers
  if (user.role === UserRole.EMPLOYEE) {
    query.assignedUser = user._id;
  }

  const customer = await Customer.findOne(query);

  if (!customer) {
    return Response.json({ error: "Customer not found" }, { status: 404 });
  }

  // Update basic fields
  if (body.name) customer.name = body.name;
  if (body.email) customer.email = body.email;
  if (body.phone) customer.phone = body.phone;
  if (body.address) customer.address = body.address;
  if (body.businessType) customer.businessType = body.businessType;
  
  // Only admin can reassign customers
  if (user.role === UserRole.ADMIN && body.assignedUser) {
    customer.assignedUser = new mongoose.Types.ObjectId(body.assignedUser);
  }

  customer.updatedBy = user._id;
  await customer.save();

  await customer.populate("assignedUser", "name email");
  await customer.populate("createdBy", "name email");

  return Response.json({ customer });
}

export async function handleDelete(req: NextRequest, user: any, params: { id: string }) {
  await connectDB();

  // Only admin can delete customers
  if (user.role !== UserRole.ADMIN) {
    return Response.json(
      { error: "Only admin can delete customers" },
      { status: 403 }
    );
  }

  const customer = await Customer.findOne({
    _id: params.id,
    isDeleted: false,
  });

  if (!customer) {
    return Response.json({ error: "Customer not found" }, { status: 404 });
  }

  customer.isDeleted = true;
  await customer.save();

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
