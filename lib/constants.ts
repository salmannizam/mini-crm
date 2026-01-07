export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  TEAM_LEADER = "team-leader",
  USER = "user",
}

// Role hierarchy: higher number = higher authority
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 4,
  [UserRole.MANAGER]: 3,
  [UserRole.TEAM_LEADER]: 2,
  [UserRole.USER]: 1,
};

// Get roles that can be created by a given role
export function getCreatableRoles(role: UserRole): UserRole[] {
  switch (role) {
    case UserRole.ADMIN:
      return [UserRole.MANAGER, UserRole.TEAM_LEADER, UserRole.USER];
    case UserRole.MANAGER:
      return [UserRole.TEAM_LEADER, UserRole.USER];
    case UserRole.TEAM_LEADER:
      return [UserRole.USER];
    default:
      return [];
  }
}

// Get the reporting role for a given role
export function getReportingRole(role: UserRole): UserRole | null {
  switch (role) {
    case UserRole.USER:
      return UserRole.TEAM_LEADER;
    case UserRole.TEAM_LEADER:
      return UserRole.MANAGER;
    case UserRole.MANAGER:
      return UserRole.ADMIN;
    default:
      return null;
  }
}

// Get display name for role
export function getRoleDisplayName(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return "Admin";
    case UserRole.MANAGER:
      return "Manager";
    case UserRole.TEAM_LEADER:
      return "Team Leader";
    case UserRole.USER:
      return "User";
    default:
      return role;
  }
}

export enum LeadStatus {
  NEW = "new",
  CONTACTED = "contacted",
  FOLLOW_UP = "follow-up",
  CONVERTED = "converted",
  LOST = "lost",
}

export enum LeadSource {
  MANUAL = "manual",
  ADMIN_ASSIGNED = "admin-assigned",
}

export const STATUS_COLORS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: "bg-blue-100 text-blue-800",
  [LeadStatus.CONTACTED]: "bg-yellow-100 text-yellow-800",
  [LeadStatus.FOLLOW_UP]: "bg-purple-100 text-purple-800",
  [LeadStatus.CONVERTED]: "bg-green-100 text-green-800",
  [LeadStatus.LOST]: "bg-red-100 text-red-800",
};
