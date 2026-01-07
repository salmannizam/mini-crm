export enum UserRole {
  ADMIN = "admin",
  USER = "user",
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
