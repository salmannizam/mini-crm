import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import connectDB from "@/lib/db";
import { Activity } from "@/models/Activity";

export async function POST(request: NextRequest) {
  await connectDB();
  
  // Get user from token to log logout
  const token = request.cookies.get("token")?.value;
  if (token) {
    try {
      const decoded = await verifyToken(token);
      if (decoded?.userId) {
        // Track logout activity
        const ipAddress = request.headers.get("x-forwarded-for") || "unknown";
        const userAgent = request.headers.get("user-agent") || "unknown";
        
        await Activity.create({
          user: decoded.userId,
          action: "logout",
          ipAddress,
          userAgent,
        });
      }
    } catch (error) {
      console.error("Error tracking logout:", error);
    }
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}