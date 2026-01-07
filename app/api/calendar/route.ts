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

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // YYYY-MM format
  const startDate = month
    ? dayjs(month).startOf("month").toDate()
    : dayjs().startOf("month").toDate();
  const endDate = month
    ? dayjs(month).endOf("month").toDate()
    : dayjs().endOf("month").toDate();

  // Get user scope based on role
  let userScope: mongoose.Types.ObjectId[] = [];

  if (user.role === UserRole.ADMIN) {
    // Admin sees all leads
    const allLeads = await Lead.find({ isDeleted: false }).distinct("assignedUser");
    userScope = allLeads;
  } else if (user.role === UserRole.USER) {
    // Users see only their own leads
    userScope = [user._id];
  } else {
    // Manager and TL see their team
    const assignableUserIds = await getAssignableUserIds(user._id.toString());
    userScope = assignableUserIds.map((id) => new mongoose.Types.ObjectId(id));
  }

  // Get all leads with follow-ups
  // We'll filter follow-ups by date range in JavaScript
  const leads = await Lead.find({
    assignedUser: { $in: userScope },
    isDeleted: false,
    followUps: { $exists: true, $ne: [] },
  })
    .populate("assignedUser", "name email")
    .select("name email phone followUps assignedUser")
    .lean();

  // Format follow-ups for calendar
  const calendarEvents: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    comment: string;
    leadId: string;
    leadName: string;
    assignedUser: string;
    isOverdue: boolean;
    isToday: boolean;
  }> = [];

  leads.forEach((lead: any) => {
    if (lead.followUps && Array.isArray(lead.followUps)) {
      lead.followUps.forEach((followUp: any) => {
        if (followUp.date) {
          const followUpDate = dayjs(followUp.date);
          if (followUpDate.isSameOrAfter(dayjs(startDate), "day") && followUpDate.isSameOrBefore(dayjs(endDate), "day")) {
            calendarEvents.push({
              id: followUp._id?.toString() || `${lead._id}-${followUpDate.format("YYYY-MM-DD")}`,
              title: followUp.comment || "Follow-up",
              date: followUpDate.format("YYYY-MM-DD"),
              time: followUp.time || "00:00",
              comment: followUp.comment || "",
              leadId: lead._id.toString(),
              leadName: lead.name,
              assignedUser: lead.assignedUser?.name || "Unknown",
              isOverdue: followUpDate.isBefore(dayjs(), "day"),
              isToday: followUpDate.isSame(dayjs(), "day"),
            });
          }
        }
      });
    }
  });

  // Group by date
  const eventsByDate: Record<string, typeof calendarEvents> = {};
  calendarEvents.forEach((event) => {
    if (!eventsByDate[event.date]) {
      eventsByDate[event.date] = [];
    }
    eventsByDate[event.date].push(event);
  });

  // Get upcoming follow-ups (next 7 days)
  const upcomingStart = dayjs().startOf("day");
  const upcomingEnd = dayjs().add(7, "days").endOf("day");

  const upcomingEvents: Array<{
    id: string;
    leadName: string;
    date: string;
    time: string;
    comment: string;
    leadId: string;
    daysUntil: number;
  }> = [];

  leads.forEach((lead: any) => {
    if (lead.followUps && Array.isArray(lead.followUps)) {
      lead.followUps.forEach((followUp: any) => {
        if (followUp.date) {
          const followUpDate = dayjs(followUp.date);
          if (followUpDate.isSameOrAfter(upcomingStart, "day") && followUpDate.isSameOrBefore(upcomingEnd, "day")) {
            upcomingEvents.push({
              id: followUp._id?.toString() || `${lead._id}-${followUpDate.format("YYYY-MM-DD")}`,
              leadName: lead.name,
              date: followUpDate.format("YYYY-MM-DD"),
              time: followUp.time || "00:00",
              comment: followUp.comment || "",
              leadId: lead._id.toString(),
              daysUntil: followUpDate.diff(dayjs(), "day"),
            });
          }
        }
      });
    }
  });

  // Sort upcoming by date
  upcomingEvents.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  // Get overdue follow-ups
  const todayStart = dayjs().startOf("day");
  const overdueEvents: Array<{
    id: string;
    leadName: string;
    date: string;
    time: string;
    comment: string;
    leadId: string;
    daysOverdue: number;
  }> = [];

  leads.forEach((lead: any) => {
    if (lead.followUps && Array.isArray(lead.followUps)) {
      lead.followUps.forEach((followUp: any) => {
        if (followUp.date) {
          const followUpDate = dayjs(followUp.date);
          if (followUpDate.isBefore(todayStart, "day")) {
            overdueEvents.push({
              id: followUp._id?.toString() || `${lead._id}-${followUpDate.format("YYYY-MM-DD")}`,
              leadName: lead.name,
              date: followUpDate.format("YYYY-MM-DD"),
              time: followUp.time || "00:00",
              comment: followUp.comment || "",
              leadId: lead._id.toString(),
              daysOverdue: todayStart.diff(followUpDate, "day"),
            });
          }
        }
      });
    }
  });

  // Sort overdue by most overdue first
  overdueEvents.sort((a, b) => b.daysOverdue - a.daysOverdue);

  return Response.json({
    eventsByDate,
    upcomingEvents,
    overdueEvents,
    totalEvents: calendarEvents.length,
  });
}

export const GET = requireAuth(handleGet);
