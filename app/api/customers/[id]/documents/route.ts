import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Customer from "@/models/Customer";
import { requireAuth } from "@/lib/auth";
import { UserRole } from "@/lib/constants";

export async function handlePost(req: NextRequest, user: any, params: { id: string }) {
  const body = await req.json();
  await connectDB();

  const query: any = {
    _id: params.id,
    isDeleted: false,
  };

  // Employees can only upload documents to their own customers
  if (user.role === UserRole.EMPLOYEE) {
    query.assignedUser = user._id;
  }

  const customer = await Customer.findOne(query);

  if (!customer) {
    return Response.json({ error: "Customer not found" }, { status: 404 });
  }

  if (!body.name || !body.url) {
    return Response.json({ error: "Document name and URL are required" }, { status: 400 });
  }

  customer.documents.push({
    name: body.name,
    url: body.url,
    uploadedBy: user._id,
    uploadedAt: new Date(),
  });

  customer.updatedBy = user._id;
  await customer.save();

  await customer.populate("documents.uploadedBy", "name email");

  return Response.json({ 
    success: true, 
    documents: customer.documents 
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const handler = requireAuth(async (request, user) => {
    return handlePost(request, user, { id });
  });
  return handler(req);
}