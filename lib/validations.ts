import { z } from "zod";
import { UserRole, LeadStatus, LeadSource } from "@/lib/constants";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.nativeEnum(UserRole),
  reportingTo: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid manager ID format")
    .optional()
    .nullable(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  reportingTo: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid manager ID format")
    .optional()
    .nullable(),
});

export const createLeadSchema = z.preprocess(
  (data: any) => {
    if (data && typeof data === "object") {
      const processed: any = { ...data };
      // Convert empty string or invalid ObjectId format to undefined for assignedUser
      if (data.assignedUser) {
        const objectIdRegex = /^[0-9a-fA-F]{24}$/;
        if (data.assignedUser === "" || !objectIdRegex.test(data.assignedUser)) {
          processed.assignedUser = undefined;
        }
      }
      // Convert empty string to undefined for email
      if (data.email === "") {
        processed.email = undefined;
      }
      return processed;
    }
    return data;
  },
  z.object({
    name: z.string().min(1, "Name is required"),
    email: z
      .string()
      .email("Invalid email address")
      .optional(),
    phone: z.string().min(1, "Phone is required"),
    address: z.string().min(1, "Address is required"),
    source: z.nativeEnum(LeadSource).optional(),
    status: z.nativeEnum(LeadStatus).optional(),
    assignedUser: z
      .string()
      .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format")
      .optional(),
  })
);

export const updateLeadSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().min(1, "Phone is required").optional(),
  address: z.string().min(1, "Address is required").optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  assignedUser: z
    .string()
    .min(1, "Assigned user is required")
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid user ID format")
    .optional(),
});

export const addCommentSchema = z.object({
  text: z.string().min(1, "Comment text is required"),
});

export const addFollowUpSchema = z.object({
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  comment: z.string().min(1, "Comment is required"),
});
