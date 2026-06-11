import { NextRequest } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import Customer from "@/models/Customer";
import { requireAuth } from "@/lib/auth";
import { UserRole, LeadStatus } from "@/lib/constants";

export async function handlePost(req: NextRequest, user: any, params: { id: string }) {
  await connectDB();

  // Both admin and employees can convert leads to customers
  const query: any = {
    _id: params.id,
    isDeleted: false,
  };

  // Employees can only convert their own leads
  if (user.role === UserRole.EMPLOYEE) {
    query.assignedUser = user._id;
  }

  const lead = await Lead.findOne(query);

  if (!lead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  // Check if lead is already converted
  if (lead.status === LeadStatus.CONVERTED) {
    return Response.json({ error: "Lead is already converted to customer" }, { status: 400 });
  }

  // Create customer from lead data
  const customer = await Customer.create({
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    address: lead.address,
    businessType: lead.businessType,
    assignedUser: lead.assignedUser,
    createdBy: user._id,
    convertedFromLead: lead._id,
  });

  // Update lead status to converted
  lead.status = LeadStatus.CONVERTED;
  lead.updatedBy = user._id;
  await lead.save();

  await customer.populate("assignedUser", "name email");
  await customer.populate("createdBy", "name email");

  return Response.json({ 
    success: true, 
    customer,
    message: "Lead successfully converted to customer"
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