import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import { addCommentSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";
import { UserRole } from "@/lib/constants";
import { getAssignableUserIds } from "@/lib/hierarchy";
import mongoose from "mongoose";

async function handlePost(
  req: NextRequest,
  user: any,
  params: { id: string }
) {
  const body = await req.json();
  const validatedData = addCommentSchema.parse(body);

  await connectDB();

  const query: any = {
    _id: params.id,
    isDeleted: false,
  };

  // Determine access based on role
  if (user.role === UserRole.USER) {
    // Users can only comment on their own leads
    query.assignedUser = user._id;
  } else if (user.role === UserRole.ADMIN) {
    // Admin can comment on all leads - no restriction
  } else {
    // Manager and TL can comment on leads assigned to their team
    const assignableUserIds = await getAssignableUserIds(user._id.toString());
    query.assignedUser = { $in: assignableUserIds.map(id => new mongoose.Types.ObjectId(id)) };
  }

  const lead = await Lead.findOne(query);

  if (!lead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  lead.comments.push({
    text: validatedData.text,
    author: user._id,
    authorName: user.name,
    authorRole: user.role,
    createdAt: new Date(),
  });

  lead.activityLogs.push({
    action: "comment_added",
    description: `Comment added by ${user.name}`,
    performedBy: user._id,
    performedByName: user.name,
    createdAt: new Date(),
    metadata: {
      commentLength: validatedData.text.length,
    },
  });

  await lead.save();

  const populatedLead = await Lead.findById(lead._id)
    .populate("assignedUser", "name email")
    .populate("createdBy", "name email")
    .populate("followUps.createdBy", "name email")
    .populate("comments.author", "name email role")
    .populate("activityLogs.performedBy", "name email");

  return Response.json(
    {
      success: true,
      lead: populatedLead,
    },
    { status: 201 }
  );
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
