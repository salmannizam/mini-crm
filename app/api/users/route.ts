import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { createUserSchema } from "@/lib/validations";
import { requireAuth, requireRole, getCurrentUser } from "@/lib/auth";
import { UserRole, getCreatableRoles, getReportingRole } from "@/lib/constants";
import {
  validateHierarchy,
  getManageableUsers,
  canManageUser,
} from "@/lib/hierarchy";

async function handleGet(req: NextRequest, user: any) {
  await connectDB();

  const { searchParams } = new URL(req.url);
  const forReportingTo = searchParams.get("forReportingTo");

  // If requesting users for reportingTo selection
  if (forReportingTo) {
    const { getValidReportingToOptions } = await import("@/lib/hierarchy");
    const validOptions = await getValidReportingToOptions(forReportingTo as any);
    return Response.json({
      users: validOptions.map((u: any) => ({
        id: u._id.toString(),
        name: u.name,
        role: u.role,
      })),
    });
  }

  // Get users based on role hierarchy
  const manageableUsers = await getManageableUsers(user._id.toString());

  const usersWithLeadCount = await Promise.all(
    manageableUsers.map(async (u: any) => {
      const leadCount = await import("@/models/Lead").then((m) =>
        m.default.countDocuments({
          assignedUser: u._id,
          isDeleted: false,
        })
      );
      const userObj = u.toObject();
      
      // Populate reportingTo if exists
      let reportingToName = null;
      if (userObj.reportingTo) {
        const manager = await User.findById(userObj.reportingTo).select("name");
        reportingToName = manager?.name || null;
      }

      return {
        ...userObj,
        id: userObj._id.toString(),
        leadCount,
        reportingToName,
      };
    })
  );

  return Response.json({ users: usersWithLeadCount });
}

async function handlePost(req: NextRequest, user: any) {
  const body = await req.json();
  const validatedData = createUserSchema.parse(body);

  await connectDB();

  // Check if user can create this role
  const creatableRoles = getCreatableRoles(user.role);
  if (!creatableRoles.includes(validatedData.role)) {
    return Response.json(
      { error: `You cannot create users with role ${validatedData.role}` },
      { status: 403 }
    );
  }

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

  // Validate hierarchy if reportingTo is provided
  let reportingToId = validatedData.reportingTo || null;
  if (reportingToId) {
    // Check if the creator can manage the reportingTo user
    const canManage = await canManageUser(user._id.toString(), reportingToId);
    if (!canManage && user.role !== UserRole.ADMIN) {
      return Response.json(
        { error: "You cannot assign this manager" },
        { status: 403 }
      );
    }
  } else {
    // If no reportingTo provided, set it based on role
    // For non-admin roles, they should report to the creator if creator is appropriate role
    if (validatedData.role !== UserRole.ADMIN) {
      const creator = await User.findById(user._id);
      if (creator) {
        const expectedReportingRole = getReportingRole(validatedData.role);
        // If creator's role matches the expected reporting role, set as reportingTo
        if (expectedReportingRole && creator.role === expectedReportingRole) {
          reportingToId = creator._id.toString();
        }
      }
    }
  }

  // Validate the hierarchy structure
  const hierarchyValidation = await validateHierarchy(
    validatedData.role,
    reportingToId,
    null // new user, no userId yet
  );
  if (!hierarchyValidation.valid) {
    return Response.json(
      { error: hierarchyValidation.error },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(validatedData.password, 10);

  const newUser = await User.create({
    ...validatedData,
    password: hashedPassword,
    reportingTo: reportingToId || undefined,
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
        reportingTo: newUser.reportingTo?.toString() || null,
      },
    },
    { status: 201 }
  );
}

export const GET = requireAuth(handleGet);
export const POST = requireRole(
  [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEADER],
  handlePost
);
