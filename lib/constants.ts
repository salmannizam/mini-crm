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
  NO_RESPONSE = "no-response",
  CONVERTED = "converted",
  LOST = "lost",
}

export enum LeadSource {
  MANUAL = "manual",
  ADMIN_ASSIGNED = "admin-assigned",
}

export const STATUS_COLORS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  [LeadStatus.CONTACTED]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  [LeadStatus.FOLLOW_UP]: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  [LeadStatus.NO_RESPONSE]: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  [LeadStatus.CONVERTED]: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  [LeadStatus.LOST]: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};
