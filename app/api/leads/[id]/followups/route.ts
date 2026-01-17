import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import { addFollowUpSchema } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";
import { UserRole } from "@/lib/constants";
import { getAssignableUserIds } from "@/lib/hierarchy";
import dayjs from "dayjs";
import mongoose from "mongoose";

async function handlePost(
  req: NextRequest,
  user: any,
  params: { id: string }
) {
  const body = await req.json();
  const validatedData = addFollowUpSchema.parse(body);

  await connectDB();

  const query: any = {
    _id: params.id,
    isDeleted: false,
  };

  // Determine access based on role
  if (user.role === UserRole.USER) {
    // Users can only add follow-ups to their own leads
    query.assignedUser = user._id;
  } else if (user.role === UserRole.ADMIN) {
    // Admin can add follow-ups to all leads - no restriction
  } else {
    // Manager and TL can add follow-ups to leads assigned to their team
    const assignableUserIds = await getAssignableUserIds(user._id.toString());
    query.assignedUser = { $in: assignableUserIds.map(id => new mongoose.Types.ObjectId(id)) };
  }

  const lead = await Lead.findOne(query);

  if (!lead) {
    return Response.json({ error: "Lead not found" }, { status: 404 });
  }

  let followUpCount = 1;

  // Handle recurring follow-ups
  if (validatedData.isRecurring && validatedData.recurringInterval) {
    const startDate = dayjs(validatedData.date);
    const endDate = validatedData.recurringEndDate
      ? dayjs(validatedData.recurringEndDate)
      : dayjs().add(1, "year"); // Default to 1 year if no end date

    let currentDate = startDate;
    const followUpsToAdd: any[] = [];
    let count = 0;
    const maxFollowUps = 100; // Safety limit

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
      if (count >= maxFollowUps) break;

      followUpsToAdd.push({
        date: currentDate.toDate(),
        time: validatedData.time,
        comment: validatedData.comment,
        createdBy: user._id,
        createdAt: new Date(),
        isRecurring: true,
        recurringInterval: validatedData.recurringInterval,
        recurringEndDate: validatedData.recurringEndDate
          ? new Date(validatedData.recurringEndDate)
          : undefined,
        reminderSent: false,
      });

      // Increment based on interval
      switch (validatedData.recurringInterval) {
        case "daily":
          currentDate = currentDate.add(1, "day");
          break;
        case "weekly":
          currentDate = currentDate.add(1, "week");
          break;
        case "monthly":
          currentDate = currentDate.add(1, "month");
          break;
      }
      count++;
    }

    followUpCount = followUpsToAdd.length;
    lead.followUps.push(...followUpsToAdd);
  } else {
    // Single follow-up
    lead.followUps.push({
      date: new Date(validatedData.date),
      time: validatedData.time,
      comment: validatedData.comment,
      createdBy: user._id,
      createdAt: new Date(),
      isRecurring: false,
      reminderSent: false,
    });
  }

  lead.activityLogs.push({
    action: "followup_added",
    description: validatedData.isRecurring
      ? `Recurring follow-up (${validatedData.recurringInterval}) scheduled by ${user.name} - ${followUpCount} instances created`
      : `Follow-up scheduled by ${user.name}`,
    performedBy: user._id,
    performedByName: user.name,
    createdAt: new Date(),
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
