import { IUser } from "@/models/User";
import { UserRole, ROLE_HIERARCHY, getReportingRole, getRoleDisplayName } from "@/lib/constants";
import User from "@/models/User";
import mongoose from "mongoose";

/**
 * Get all users that a given user can manage (direct and indirect reports)
 */
export async function getManageableUsers(userId: string): Promise<IUser[]> {
  const user = await User.findById(userId);
  if (!user) return [];

  // Admin can see everyone
  if (user.role === UserRole.ADMIN) {
    return await User.find({ isDeleted: false }).sort({ name: 1 });
  }

  // Get all direct and indirect reports recursively
  const manageableUserIds = await getSubordinateIds(userId);
  return await User.find({
    _id: { $in: manageableUserIds },
    isDeleted: false,
  }).sort({ name: 1 });
}

/**
 * Recursively get all subordinate user IDs
 */
async function getSubordinateIds(userId: string): Promise<string[]> {
  const directReports = await User.find({
    reportingTo: userId,
    isDeleted: false,
  }).select("_id");

  const subordinateIds: string[] = directReports.map((u) => u._id.toString());

  // Recursively get subordinates of subordinates
  for (const report of directReports) {
    const nestedSubordinates = await getSubordinateIds(report._id.toString());
    subordinateIds.push(...nestedSubordinates);
  }

  return subordinateIds;
}

/**
 * Get all user IDs that a user can assign leads to
 */
export async function getAssignableUserIds(userId: string): Promise<string[]> {
  const user = await User.findById(userId);
  if (!user) return [];

  // Admin can assign to anyone
  if (user.role === UserRole.ADMIN) {
    const allUsers = await User.find({ isDeleted: false, isActive: true }).select("_id");
    return allUsers.map((u) => u._id.toString());
  }

  // Get all manageable users
  const manageableUsers = await getManageableUsers(userId);
  return manageableUsers
    .filter((u) => u.isActive)
    .map((u) => u._id.toString());
}

/**
 * Check if a user can manage another user
 */
export async function canManageUser(
  managerId: string,
  targetUserId: string
): Promise<boolean> {
  if (managerId === targetUserId) return false;

  const manager = await User.findById(managerId);
  if (!manager) return false;

  // Admin can manage everyone
  if (manager.role === UserRole.ADMIN) return true;

  const manageableUserIds = await getSubordinateIds(managerId);
  return manageableUserIds.includes(targetUserId);
}

/**
 * Check if a user can assign a lead to a target user
 */
export async function canAssignToUser(
  assignerId: string,
  targetUserId: string
): Promise<boolean> {
  const assigner = await User.findById(assignerId);
  if (!assigner) return false;

  // Admin can assign to anyone
  if (assigner.role === UserRole.ADMIN) return true;

  // Check if target is in manageable users
  const assignableIds = await getAssignableUserIds(assignerId);
  return assignableIds.includes(targetUserId);
}

/**
 * Get users that can be set as reportingTo for a given role
 */
export async function getValidReportingToOptions(
  role: UserRole,
  excludeUserId?: string
): Promise<IUser[]> {
  const reportingRole = getReportingRoleForRole(role);
  if (!reportingRole) return [];

  const query: any = {
    role: reportingRole,
    isDeleted: false,
    isActive: true,
  };

  if (excludeUserId) {
    query._id = { $ne: new mongoose.Types.ObjectId(excludeUserId) };
  }

  return await User.find(query).sort({ name: 1 });
}

/**
 * Get the role that should be the reportingTo for a given role
 */
function getReportingRoleForRole(role: UserRole): UserRole | null {
  return getReportingRole(role);
}

/**
 * Validate hierarchy: ensure reportingTo has correct role
 * @param userRole - The role of the user (or role being created)
 * @param reportingToId - The ID of the reporting manager
 * @param userId - Optional: existing user ID (for updates), or null for new users
 */
export async function validateHierarchy(
  userRole: UserRole,
  reportingToId: string | null,
  userId?: string | null
): Promise<{ valid: boolean; error?: string }> {
  if (!reportingToId) {
    // Only admin can have no reportingTo
    if (userRole !== UserRole.ADMIN) {
      return { valid: false, error: "User must have a manager" };
    }
    return { valid: true };
  }

  const reportingTo = await User.findById(reportingToId);

  if (!reportingTo) {
    return { valid: false, error: "Invalid manager" };
  }

  const expectedRole = getReportingRoleForRole(userRole);
  if (expectedRole && reportingTo.role !== expectedRole) {
    return {
      valid: false,
      error: `${userRole} must report to ${expectedRole}, not ${reportingTo.role}`,
    };
  }

  // Prevent circular references (only if userId is provided)
  if (userId && userId === reportingToId) {
    return { valid: false, error: "User cannot report to themselves" };
  }

  // Check if reportingTo is a subordinate (would create circular reference)
  if (userId) {
    const isSubordinate = await canManageUser(userId, reportingToId);
    if (isSubordinate) {
      return { valid: false, error: "Cannot create circular reporting structure" };
    }
  }

  return { valid: true };
}

/**
 * Get all users in a user's team (for TL and Manager views)
 */
export async function getTeamUsers(userId: string): Promise<IUser[]> {
  const user = await User.findById(userId);
  if (!user) return [];

  // Get direct reports
  const directReports = await User.find({
    reportingTo: userId,
    isDeleted: false,
  }).sort({ name: 1 });

  return directReports;
}

// getRoleDisplayName is now in constants.ts
