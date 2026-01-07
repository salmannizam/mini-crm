import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { UserRole, LeadStatus } from "@/lib/constants";
import { getManageableUsers, getAssignableUserIds } from "@/lib/hierarchy";
import dayjs from "dayjs";
import mongoose from "mongoose";

async function handleGet(req: NextRequest, user: any) {
  await connectDB();

  if (user.role === UserRole.ADMIN || user.role === UserRole.MANAGER || user.role === UserRole.TEAM_LEADER) {
    // Admin, Manager, and TL see team-wide stats
    const assignableUserIds = await getAssignableUserIds(user._id.toString());
    const assignableObjectIds = assignableUserIds.map(id => new mongoose.Types.ObjectId(id));
    
    const manageableUsers = await getManageableUsers(user._id.toString());
    
    const [
      totalLeads,
      leadsByStatus,
      leadsPerUser,
      activeUsers,
      inactiveUsers,
      recentActivity,
    ] = await Promise.all([
      Lead.countDocuments({ 
        assignedUser: { $in: assignableObjectIds },
        isDeleted: false 
      }),
      Lead.aggregate([
        { 
          $match: { 
            assignedUser: { $in: assignableObjectIds },
            isDeleted: false 
          } 
        },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Lead.aggregate([
        { 
          $match: { 
            assignedUser: { $in: assignableObjectIds },
            isDeleted: false 
          } 
        },
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
      User.countDocuments({ 
        _id: { $in: assignableObjectIds },
        isDeleted: false, 
        isActive: true 
      }),
      User.countDocuments({ 
        _id: { $in: assignableObjectIds },
        isDeleted: false, 
        isActive: false 
      }),
      Lead.find({ 
        assignedUser: { $in: assignableObjectIds },
        isDeleted: false 
      })
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
      teamUsers: manageableUsers.map((u: any) => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role,
      })),
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
