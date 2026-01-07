import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import { requireAuth } from "@/lib/auth";
import { UserRole } from "@/lib/constants";
import { getAssignableUserIds } from "@/lib/hierarchy";
import mongoose from "mongoose";

async function handleGet(req: NextRequest, user: any) {
  await connectDB();

  // Only Manager and TL can access reports
  if (![UserRole.MANAGER, UserRole.TEAM_LEADER].includes(user.role)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const assignableUserIds = await getAssignableUserIds(user._id.toString());
  const assignableObjectIds = assignableUserIds.map((id) => new mongoose.Types.ObjectId(id));

  // Get leads by status per user
  const leadsByStatusPerUser = await Lead.aggregate([
    {
      $match: {
        assignedUser: { $in: assignableObjectIds },
        isDeleted: false,
      },
    },
    {
      $group: {
        _id: {
          assignedUser: "$assignedUser",
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "_id.assignedUser",
        foreignField: "_id",
        as: "user",
      },
    },
    { $unwind: "$user" },
    {
      $group: {
        _id: "$_id.assignedUser",
        userName: { $first: "$user.name" },
        userEmail: { $first: "$user.email" },
        userRole: { $first: "$user.role" },
        statuses: {
          $push: {
            status: "$_id.status",
            count: "$count",
          },
        },
        totalLeads: { $sum: "$count" },
      },
    },
    {
      $project: {
        userId: "$_id",
        userName: 1,
        userEmail: 1,
        userRole: 1,
        totalLeads: 1,
        statuses: 1,
      },
    },
    { $sort: { totalLeads: -1 } },
  ]);

  return Response.json({
    teamMembers: leadsByStatusPerUser.map((member: any) => ({
      userId: member.userId.toString(),
      userName: member.userName,
      userEmail: member.userEmail,
      userRole: member.userRole,
      totalLeads: member.totalLeads,
      statuses: member.statuses,
    })),
  });
}

export const GET = requireAuth(handleGet);
