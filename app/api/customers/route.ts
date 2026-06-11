import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Customer from "@/models/Customer";
import { requireAuth } from "@/lib/auth";
import { UserRole } from "@/lib/constants";

 async function handleGet(req: NextRequest, user: any) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const assignedUser = searchParams.get("assignedUser") || "";

  // Build query
  const query: any = { isDeleted: false };

  // Filter by assigned user - employees can only see their own customers
  if (user.role === UserRole.EMPLOYEE) {
    query.assignedUser = user._id;
  } else if (assignedUser) {
    query.assignedUser = new mongoose.Types.ObjectId(assignedUser);
  }

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phone: { $regex: search, $options: "i" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [customers, total] = await Promise.all([
    Customer.find(query)
      .populate("assignedUser", "name email")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Customer.countDocuments(query),
  ]);

  return Response.json({
    customers,
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
  await connectDB();

  // Only admin can manually create customers
  if (user.role !== UserRole.ADMIN) {
    return Response.json(
      { error: "Only admin can create customers manually" },
      { status: 403 }
    );
  }

  if (!body.assignedUser) {
    return Response.json(
      { error: "Assigned user is required" },
      { status: 400 }
    );
  }

  const customerData: any = {
    ...body,
    assignedUser: new mongoose.Types.ObjectId(body.assignedUser),
    createdBy: user._id,
  };

  const customer = await Customer.create(customerData);
  await customer.populate("assignedUser", "name email");
  await customer.populate("createdBy", "name email");

  return Response.json({ customer });
}

export const GET = requireAuth(handleGet);
export const POST = requireAuth(handlePost);