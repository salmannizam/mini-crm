import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";

async function handleGet(req: NextRequest, user: any) {
  return Response.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
  });
}

export const GET = requireAuth(handleGet);
