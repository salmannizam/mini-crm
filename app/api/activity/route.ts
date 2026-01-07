import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import { requireAuth } from "@/lib/auth";
import { UserRole } from "@/lib/constants";
import { getAssignableUserIds } from "@/lib/hierarchy";
import mongoose from "mongoose";
import dayjs from "dayjs";

async function handleGet(req: NextRequest, user: any) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const actionFilter = searchParams.get("action");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const leadId = searchParams.get("leadId");

  // Get user scope based on role
  let userScope: mongoose.Types.ObjectId[] = [];

  if (user.role === UserRole.ADMIN) {
    // Admin sees all leads
    const allLeads = await Lead.find({ isDeleted: false }).select("_id");
    userScope = allLeads.map((l) => l._id);
  } else if (user.role === UserRole.USER) {
    // Users see only their own leads
    const userLeads = await Lead.find({
      assignedUser: user._id,
      isDeleted: false,
    }).select("_id");
    userScope = userLeads.map((l) => l._id);
  } else {
    // Manager and TL see their team's leads
    const assignableUserIds = await getAssignableUserIds(user._id.toString());
    const teamLeads = await Lead.find({
      assignedUser: { $in: assignableUserIds.map((id) => new mongoose.Types.ObjectId(id)) },
      isDeleted: false,
    }).select("_id");
    userScope = teamLeads.map((l) => l._id);
  }

  // Build query
  const query: any = {
    _id: { $in: userScope },
    isDeleted: false,
    "activityLogs.0": { $exists: true }, // Has at least one activity
  };

  if (leadId) {
    // Validate lead is in scope
    if (userScope.some((id) => id.toString() === leadId)) {
      query._id = new mongoose.Types.ObjectId(leadId);
    } else {
      return Response.json({
        activities: [],
        pagination: { page, limit, total: 0, pages: 0 },
      });
    }
  }

  // Get leads with activities
  const leads = await Lead.find(query)
    .populate("activityLogs.performedBy", "name email")
    .select("name activityLogs")
    .lean();

  // Extract and flatten activities
  let allActivities: any[] = [];

  leads.forEach((lead: any) => {
    if (lead.activityLogs && Array.isArray(lead.activityLogs)) {
      lead.activityLogs.forEach((activity: any) => {
        allActivities.push({
          ...activity,
          leadId: lead._id.toString(),
          leadName: lead.name,
        });
      });
    }
  });

  // Apply filters
  if (actionFilter) {
    allActivities = allActivities.filter((a) => a.action.includes(actionFilter));
  }

  if (dateFrom || dateTo) {
    allActivities = allActivities.filter((a) => {
      const activityDate = dayjs(a.createdAt);
      if (dateFrom && activityDate.isBefore(dayjs(dateFrom), "day")) return false;
      if (dateTo && activityDate.isAfter(dayjs(dateTo), "day")) return false;
      return true;
    });
  }

  // Sort by date (newest first)
  allActivities.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Paginate
  const total = allActivities.length;
  const skip = (page - 1) * limit;
  const paginatedActivities = allActivities.slice(skip, skip + limit);

  return Response.json({
    activities: paginatedActivities,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}

export const GET = requireAuth(handleGet);
