import mongoose, { Schema, Document, Model } from "mongoose";
import { LeadStatus, LeadSource } from "@/lib/constants";

export interface IFollowUp {
  date: Date;
  time: string;
  comment: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  isRecurring?: boolean;
  recurringInterval?: "daily" | "weekly" | "monthly";
  recurringEndDate?: Date;
  reminderSent?: boolean;
}

export interface IComment {
  text: string;
  author: mongoose.Types.ObjectId;
  authorName: string;
  authorRole: string;
  createdAt: Date;
}

export interface IActivityLog {
  action: string;
  description: string;
  performedBy: mongoose.Types.ObjectId;
  performedByName: string;
  createdAt: Date;
  metadata?: {
    field?: string;
    oldValue?: string;
    newValue?: string;
    [key: string]: any;
  };
}

export interface ILead extends Document {
  name: string;
  email?: string;
  phone: string;
  address: string;
  source: LeadSource;
  status: LeadStatus;
  assignedUser: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  followUps: IFollowUp[];
  comments: IComment[];
  activityLogs: IActivityLog[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FollowUpSchema = new Schema(
  {
    date: {
      type: Date,
      required: true,
    },
    time: {
      type: String,
      required: true,
    },
    comment: {
      type: String,
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringInterval: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
    },
    recurringEndDate: {
      type: Date,
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const CommentSchema = new Schema(
  {
    text: {
      type: String,
      required: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    authorRole: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ActivityLogSchema = new Schema(
  {
    action: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    performedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    performedByName: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

const LeadSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: false,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    source: {
      type: String,
      enum: Object.values(LeadSource),
      default: LeadSource.MANUAL,
    },
    status: {
      type: String,
      enum: Object.values(LeadStatus),
      default: LeadStatus.NEW,
    },
    assignedUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    followUps: [FollowUpSchema],
    comments: [CommentSchema],
    activityLogs: [ActivityLogSchema],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

LeadSchema.index({ assignedUser: 1, isDeleted: 1 });
LeadSchema.index({ status: 1, isDeleted: 1 });
LeadSchema.index({ email: 1 });
LeadSchema.index({ phone: 1 });
LeadSchema.index({ name: "text", email: "text", phone: "text" });

const Lead: Model<ILead> =
  mongoose.models.Lead || mongoose.model<ILead>("Lead", LeadSchema);

export default Lead;
