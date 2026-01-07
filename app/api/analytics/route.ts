import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { UserRole, LeadStatus } from "@/lib/constants";
import { getAssignableUserIds } from "@/lib/hierarchy";
import dayjs from "dayjs";
import mongoose from "mongoose";

async function handleGet(req: NextRequest, user: any) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "30"; // days
  const days = parseInt(period);

  // Determine date range
  const startDate = dayjs().subtract(days, "days").startOf("day").toDate();
  const endDate = dayjs().endOf("day").toDate();

  // Get user scope based on role
  let userScope: mongoose.Types.ObjectId[] = [];
  let isAdmin = false;

  if (user.role === UserRole.ADMIN) {
    isAdmin = true;
    // Admin sees all users
    const allUsers = await User.find({ isDeleted: false }).select("_id");
    userScope = allUsers.map((u) => u._id);
  } else if (user.role === UserRole.USER) {
    // Users see only their own data
    userScope = [user._id];
  } else {
    // Manager and TL see their team
    const assignableUserIds = await getAssignableUserIds(user._id.toString());
    userScope = assignableUserIds.map((id) => new mongoose.Types.ObjectId(id));
  }

  // Lead trends over time (daily)
  const leadTrends = await Lead.aggregate([
    {
      $match: {
        assignedUser: { $in: userScope },
        isDeleted: false,
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Status distribution
  const statusDistribution = await Lead.aggregate([
    {
      $match: {
        assignedUser: { $in: userScope },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  // Conversion rate
  const totalLeads = await Lead.countDocuments({
    assignedUser: { $in: userScope },
    isDeleted: false,
  });
  const convertedLeads = await Lead.countDocuments({
    assignedUser: { $in: userScope },
    status: LeadStatus.CONVERTED,
    isDeleted: false,
  });
  const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

  // Status changes over time
  const statusChanges = await Lead.aggregate([
    {
      $match: {
        assignedUser: { $in: userScope },
        isDeleted: false,
        updatedAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.date": 1 } },
  ]);

  // User performance (top performers)
  const userPerformance = await Lead.aggregate([
    {
      $match: {
        assignedUser: { $in: userScope },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: "$assignedUser",
        totalLeads: { $sum: 1 },
        converted: {
          $sum: { $cond: [{ $eq: ["$status", LeadStatus.CONVERTED] }, 1, 0] },
        },
        lost: {
          $sum: { $cond: [{ $eq: ["$status", LeadStatus.LOST] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $project: {
        userId: "$_id",
        userName: "$user.name",
        userEmail: "$user.email",
        totalLeads: 1,
        converted: 1,
        lost: 1,
        conversionRate: {
          $cond: [
            { $gt: ["$totalLeads", 0] },
            { $multiply: [{ $divide: ["$converted", "$totalLeads"] }, 100] },
            0,
          ],
        },
      },
    },
    { $sort: { conversionRate: -1, totalLeads: -1 } },
    { $limit: 10 },
  ]);

  // Monthly comparison
  const monthlyData = await Lead.aggregate([
    {
      $match: {
        assignedUser: { $in: userScope },
        isDeleted: false,
        createdAt: { $gte: dayjs().subtract(6, "months").startOf("month").toDate() },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m", date: "$createdAt" },
        },
        total: { $sum: 1 },
        converted: {
          $sum: { $cond: [{ $eq: ["$status", LeadStatus.CONVERTED] }, 1, 0] },
        },
        lost: {
          $sum: { $cond: [{ $eq: ["$status", LeadStatus.LOST] }, 1, 0] },
        },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Format lead trends data
  const formattedTrends = leadTrends.map((item: any) => ({
    date: item._id,
    leads: item.count,
  }));

  // Format status distribution
  const formattedStatus = statusDistribution.map((item: any) => ({
    status: item._id,
    count: item.count,
  }));

  // Format status changes
  const statusChangesByDate: Record<string, Record<string, number>> = {};
  statusChanges.forEach((item: any) => {
    const date = item._id.date;
    const status = item._id.status;
    if (!statusChangesByDate[date]) {
      statusChangesByDate[date] = {};
    }
    statusChangesByDate[date][status] = item.count;
  });

  return Response.json({
    leadTrends: formattedTrends,
    statusDistribution: formattedStatus,
    conversionRate: Math.round(conversionRate * 100) / 100,
    totalLeads,
    convertedLeads,
    userPerformance: userPerformance.map((p: any) => ({
      userId: p.userId.toString(),
      userName: p.userName,
      userEmail: p.userEmail,
      totalLeads: p.totalLeads,
      converted: p.converted,
      lost: p.lost,
      conversionRate: Math.round(p.conversionRate * 100) / 100,
    })),
    monthlyData: monthlyData.map((m: any) => ({
      month: m._id,
      total: m.total,
      converted: m.converted,
      lost: m.lost,
    })),
    statusChangesByDate,
  });
}

export const GET = requireAuth(handleGet);
