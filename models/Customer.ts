import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDocument {
  name: string;
  url: string;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
}

export interface INote {
  text: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ICommunication {
  type: string;
  notes: string;
  date: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

export interface ICustomer extends Document {
  name: string;
  email?: string;
  phone?: string;
  address: string;
  businessType?: string;
  assignedUser: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  notes: INote[];
  documents: IDocument[];
  communicationHistory: ICommunication[];
  isDeleted: boolean;
  convertedFromLead?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema: Schema = new Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const NoteSchema: Schema = new Schema({
  text: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const CommunicationSchema: Schema = new Schema({
  type: { type: String, required: true },
  notes: { type: String, required: true },
  date: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const CustomerSchema: Schema = new Schema(
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
      lowercase: true,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    businessType: {
      type: String,
      required: false,
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
    notes: [NoteSchema],
    documents: [DocumentSchema],
    communicationHistory: [CommunicationSchema],
    isDeleted: {
      type: Boolean,
      default: false,
    },
    convertedFromLead: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

CustomerSchema.index({ assignedUser: 1, isDeleted: 1 });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ phone: 1 });
CustomerSchema.index({ name: "text", email: "text", phone: "text" });
CustomerSchema.index({ convertedFromLead: 1 });

const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>("Customer", CustomerSchema);

export default Customer;