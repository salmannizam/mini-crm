export enum UserRole {
  ADMIN = "admin",
  EMPLOYEE = "employee",
}

// Role hierarchy: higher number = higher authority
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  [UserRole.ADMIN]: 2,
  [UserRole.EMPLOYEE]: 1,
};

// Get roles that can be created by a given role
export function getCreatableRoles(role: UserRole): UserRole[] {
  switch (role) {
    case UserRole.ADMIN:
      return [UserRole.EMPLOYEE];
    default:
      return [];
  }
}

// Get the reporting role for a given role
export function getReportingRole(role: UserRole): UserRole | null {
  switch (role) {
    case UserRole.EMPLOYEE:
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
    case UserRole.EMPLOYEE:
      return "Employee";
    default:
      return role;
  }
}

export enum LeadStatus {
  NEW = "new",
  CONTACTED = "contacted",
  FOLLOW_UP = "follow-up",
  INTERESTED = "interested",
  NOT_INTERESTED = "not-interested",
  QUALIFIED = "qualified",
  PROPOSAL_SENT = "proposal-sent",
  NEGOTIATION = "negotiation",
  NO_RESPONSE = "no-response",
  CONVERTED = "converted",
  LOST = "lost",
  INVALID_DUPLICATE = "invalid-duplicate",
}

export enum LeadSource {
  INSTAGRAM = "instagram",
  FACEBOOK = "facebook",
  OFFLINE_WALKIN = "offline-walkin",
  TELECALLING = "telecalling",
  GOOGLE_SEARCH = "google-search",
  REFERRAL = "referral",
  GOOGLE_ADS = "google-ads",
  WEBSITE = "website",
  WHATSAPP = "whatsapp",
  EMAIL_CAMPAIGN = "email-campaign",
  EVENT_EXHIBITION = "event-exhibition",
  PARTNER = "partner",
  OTHER = "other",
}

export enum BusinessType {
  SCHOOL = "school",
  COLLEGE_UNIVERSITY = "college-university",
  HOSPITAL = "hospital",
  CLINIC = "clinic",
  PHARMACY = "pharmacy",
  E_COMMERCE = "e-commerce",
  RETAIL_STORE = "retail-store",
  WHOLESALE = "wholesale",
  MANUFACTURING = "manufacturing",
  SERVICE_BUSINESS = "service-business",
  IT_SOFTWARE = "it-software",
  DIGITAL_MARKETING_AGENCY = "digital-marketing-agency",
  REAL_ESTATE = "real-estate",
  RESTAURANT_CAFE = "restaurant-cafe",
  HOTEL_HOSPITALITY = "hotel-hospitality",
  LOGISTICS_TRANSPORT = "logistics-transport",
  CORPORATE_ENTERPRISE = "corporate-enterprise",
  OTHER = "other",
}

export const STATUS_COLORS: Record<LeadStatus, string> = {
  [LeadStatus.NEW]: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  [LeadStatus.CONTACTED]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  [LeadStatus.FOLLOW_UP]: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  [LeadStatus.INTERESTED]: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  [LeadStatus.NOT_INTERESTED]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  [LeadStatus.QUALIFIED]: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
  [LeadStatus.PROPOSAL_SENT]: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300",
  [LeadStatus.NEGOTIATION]: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  [LeadStatus.NO_RESPONSE]: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  [LeadStatus.CONVERTED]: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  [LeadStatus.LOST]: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  [LeadStatus.INVALID_DUPLICATE]: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
};