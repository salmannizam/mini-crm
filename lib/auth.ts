import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import User, { IUser } from "@/models/User";
import connectDB from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function generateToken(user: IUser): Promise<string> {
  const payload: JWTPayload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUser(
  request: NextRequest
): Promise<IUser | null> {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return null;
    }

    const payload = await verifyToken(token);

    if (!payload) {
      return null;
    }

    await connectDB();
    const user = await User.findOne({
      _id: payload.userId,
      isDeleted: false,
      isActive: true,
    });

    return user;
  } catch (error) {
    return null;
  }
}

export function requireAuth(
  handler: (req: NextRequest, user: IUser) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const user = await getCurrentUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    return handler(req, user);
  };
}

export function requireRole(
  roles: string[],
  handler: (req: NextRequest, user: IUser) => Promise<Response>
) {
  return async (req: NextRequest) => {
    const user = await getCurrentUser(req);

    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!roles.includes(user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    return handler(req, user);
  };
}
