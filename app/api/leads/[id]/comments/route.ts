import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import { addCommentSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";
import { UserRole } from "@/lib/constants";

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

  if (user.role !== UserRole.ADMIN) {
    query.assignedUser = user._id;
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
  });

  lead.activityLogs.push({
    action: "comment_added",
    description: `Comment added by ${user.name}`,
    performedBy: user._id,
    performedByName: user.name,
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
