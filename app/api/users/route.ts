import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { createUserSchema } from "@/lib/validations";
import { requireAuth, requireRole, getCurrentUser } from "@/lib/auth";
import { UserRole } from "@/lib/constants";

async function handleGet(req: NextRequest, user: any) {
  await connectDB();

  if (user.role === UserRole.ADMIN) {
    const users = await User.find({ isDeleted: false })
      .select("-password")
      .populate("createdBy", "name email")
      .sort({ createdAt: -1 });

    const usersWithLeadCount = await Promise.all(
      users.map(async (u: any) => {
        const leadCount = await import("@/models/Lead").then((m) =>
          m.default.countDocuments({
            assignedUser: u._id,
            isDeleted: false,
          })
        );
        const userObj = u.toObject();
        return {
          ...userObj,
          id: userObj._id.toString(),
          leadCount,
        };
      })
    );

    return Response.json({ users: usersWithLeadCount });
  } else {
    return Response.json({
      users: [
        {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
        },
      ],
    });
  }
}

async function handlePost(req: NextRequest, user: any) {
  const body = await req.json();
  const validatedData = createUserSchema.parse(body);

  await connectDB();

  const existingUser = await User.findOne({
    email: validatedData.email,
    isDeleted: false,
  });

  if (existingUser) {
    return Response.json(
      { error: "User with this email already exists" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(validatedData.password, 10);

  const newUser = await User.create({
    ...validatedData,
    password: hashedPassword,
    createdBy: user._id,
  });

  return Response.json(
    {
      success: true,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isActive: newUser.isActive,
      },
    },
    { status: 201 }
  );
}

export const GET = requireAuth(handleGet);
export const POST = requireRole([UserRole.ADMIN], handlePost);
