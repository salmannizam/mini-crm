import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import { requireAuth } from "@/lib/auth";
import { UserRole } from "@/lib/constants";
import { getAssignableUserIds } from "@/lib/hierarchy";
import dayjs from "dayjs";
import mongoose from "mongoose";

async function handleGet(req: NextRequest, user: any) {
  await connectDB();

  const now = dayjs();
  const tomorrow = now.add(1, "day").endOf("day").toDate();
  const todayStart = now.startOf("day").toDate();
  const todayEnd = now.endOf("day").toDate();

  // Get user scope based on role
  let userScope: mongoose.Types.ObjectId[] = [];

  if (user.role === UserRole.ADMIN) {
    const allLeads = await Lead.find({ isDeleted: false }).distinct("assignedUser");
    userScope = allLeads;
  } else if (user.role === UserRole.USER) {
    userScope = [user._id];
  } else {
    const assignableUserIds = await getAssignableUserIds(user._id.toString());
    userScope = assignableUserIds.map((id) => new mongoose.Types.ObjectId(id));
  }

  // Get today's follow-ups
  const todayLeads = await Lead.find({
    assignedUser: { $in: userScope },
    isDeleted: false,
    "followUps.date": {
      $gte: todayStart,
      $lte: todayEnd,
    },
  })
    .populate("assignedUser", "name email")
    .select("name followUps assignedUser")
    .lean();

  // Get tomorrow's follow-ups
  const tomorrowLeads = await Lead.find({
    assignedUser: { $in: userScope },
    isDeleted: false,
    "followUps.date": {
      $gte: dayjs().add(1, "day").startOf("day").toDate(),
      $lte: tomorrow,
    },
  })
    .populate("assignedUser", "name email")
    .select("name followUps assignedUser")
    .lean();

  // Get overdue follow-ups
  const overdueLeads = await Lead.find({
    assignedUser: { $in: userScope },
    isDeleted: false,
    "followUps.date": { $lt: todayStart },
  })
    .populate("assignedUser", "name email")
    .select("name followUps assignedUser")
    .lean();

  const formatReminders = (leads: any[], filterDate: Date | null = null) => {
    const reminders: Array<{
      id: string;
      leadId: string;
      leadName: string;
      date: string;
      time: string;
      comment: string;
      assignedUser: string;
    }> = [];

    leads.forEach((lead: any) => {
      lead.followUps.forEach((followUp: any) => {
        const followUpDate = dayjs(followUp.date);
        if (
          !filterDate ||
          (filterDate && followUpDate.isSame(dayjs(filterDate), "day"))
        ) {
          reminders.push({
            id: followUp._id.toString(),
            leadId: lead._id.toString(),
            leadName: lead.name,
            date: followUpDate.format("YYYY-MM-DD"),
            time: followUp.time,
            comment: followUp.comment,
            assignedUser: lead.assignedUser?.name || "Unknown",
          });
        }
      });
    });

    return reminders;
  };

  const todayReminders = formatReminders(todayLeads, todayStart);
  const tomorrowReminders = formatReminders(tomorrowLeads, dayjs().add(1, "day").toDate());
  const overdueReminders = formatReminders(overdueLeads);

  return Response.json({
    today: todayReminders,
    tomorrow: tomorrowReminders,
    overdue: overdueReminders,
    total: todayReminders.length + tomorrowReminders.length + overdueReminders.length,
  });
}

export const GET = requireAuth(handleGet);
