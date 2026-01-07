import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import User, { IUser } from "@/models/User";
import connectDB from "@/lib/db";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export async function getCurrentUserServer(): Promise<IUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;

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
