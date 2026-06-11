import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { Activity } from "@/models/Activity";
import { UserRole } from "@/lib/constants";
import { requireRole } from "@/lib/auth";


export async function handleGet(request: NextRequest, user: any) {
  try {
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  // Only Admin can delete users
  if (user.role !== UserRole.ADMIN) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const query: any = { action: { $in: ["login", "logout"] } };

    // Add date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Set endDate to end of day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    // Search user ID or email if search query exists
    if (search) {
      const User = mongoose.models.User;
      const matchingUsers = await User.find({
        $or: [
          { _id: mongoose.isValidObjectId(search) ? search : null },
          { email: { $regex: search, $options: "i" } },
          { name: { $regex: search, $options: "i" } },
        ].filter(Boolean),
      });
      
      if (matchingUsers.length > 0) {
        query.user = { $in: matchingUsers.map(u => u._id) };
      } else {
        // If no users match, return empty results
        return NextResponse.json({
          success: true,
          activities: [],
          pagination: { page, limit, total: 0, pages: 0 },
        });
      }
    }

    const activities = await Activity.find(query)
      .populate("user", "name email")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Activity.countDocuments(query);
    const pages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      activities,
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    });
  } catch (error) {
    console.error("Error fetching login history:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest
) {
  const handler = requireRole([UserRole.ADMIN], async (request, user) => {
    return handleGet(request, user);
  });
  return handler(req);
}