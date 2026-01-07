import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { UserRole, LeadStatus } from "@/lib/constants";
import dayjs from "dayjs";

async function handleGet(req: NextRequest, user: any) {
  await connectDB();

  if (user.role === UserRole.ADMIN) {
    const [
      totalLeads,
      leadsByStatus,
      leadsPerUser,
      activeUsers,
      inactiveUsers,
      recentActivity,
    ] = await Promise.all([
      Lead.countDocuments({ isDeleted: false }),
      Lead.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Lead.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: "$assignedUser",
            count: { $sum: 1 },
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
            leadCount: "$count",
          },
        },
      ]),
      User.countDocuments({ isDeleted: false, isActive: true }),
      User.countDocuments({ isDeleted: false, isActive: false }),
      Lead.find({ isDeleted: false })
        .populate("assignedUser", "name email")
        .populate("createdBy", "name email")
        .sort({ updatedAt: -1 })
        .limit(10)
        .select("name status updatedAt assignedUser createdBy")
        .lean(),
    ]);

    const statusCounts: Record<string, number> = {};
    leadsByStatus.forEach((item: any) => {
      statusCounts[item._id] = item.count;
    });

    return Response.json({
      totalLeads,
      leadsByStatus: statusCounts,
      leadsPerUser,
      activeUsers,
      inactiveUsers,
      recentActivity,
    });
  } else {
    const today = dayjs().startOf("day").toDate();
    const tomorrow = dayjs().endOf("day").toDate();

    const [
      myLeadsCount,
      myLeadsByStatus,
      followUpsToday,
      overdueFollowUps,
    ] = await Promise.all([
      Lead.countDocuments({
        assignedUser: user._id,
        isDeleted: false,
      }),
      Lead.aggregate([
        {
          $match: {
            assignedUser: user._id,
            isDeleted: false,
          },
        },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Lead.find({
        assignedUser: user._id,
        isDeleted: false,
        "followUps.date": {
          $gte: today,
          $lte: tomorrow,
        },
      })
        .select("name followUps")
        .lean(),
      Lead.find({
        assignedUser: user._id,
        isDeleted: false,
        "followUps.date": { $lt: today },
      })
        .select("name followUps")
        .lean(),
    ]);

    const statusCounts: Record<string, number> = {};
    myLeadsByStatus.forEach((item: any) => {
      statusCounts[item._id] = item.count;
    });

    return Response.json({
      myLeadsCount,
      myLeadsByStatus: statusCounts,
      followUpsToday,
      overdueFollowUps,
    });
  }
}

export const GET = requireAuth(handleGet);
