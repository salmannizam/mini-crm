"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import { LeadStatus, UserRole, LeadSource, BusinessType } from "@/lib/constants";
import { useToast } from "@/components/ui/toast";
import { ActivityTimeline } from "./ActivityTimeline";
import dayjs from "dayjs";

interface LeadDetailProps {
  leadId: string;
  userRole: string;
  userId: string;
}

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address: string;
  source: LeadSource;
  businessType?: BusinessType;
  status: LeadStatus;
  assignedUser: { _id: string; name: string; email: string };
  createdBy: { name: string; email: string };
  followUps: Array<{
    _id: string;
    date: string;
    time: string;
    comment: string;
    createdBy: { name: string; email: string };
    createdAt: string;
  }>;
  comments: Array<{
    _id: string;
    text: string;
    author: { name: string; email: string; role: string };
    createdAt: string;
  }>;
  activityLogs: Array<{
    _id: string;
    action: string;
    description: string;
    performedBy: { name: string; email: string };
    createdAt: string;
    metadata?: {
      field?: string;
      oldValue?: string;
      newValue?: string;
      [key: string]: any;
    };
  }>;
  createdAt: string;
  updatedAt: string;
}

export function LeadDetail({ leadId, userRole, userId }: LeadDetailProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [users, setUsers] = useState<Array<{ id: string; name: string }>>([]);
  const [commentText, setCommentText] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpTime, setFollowUpTime] = useState("");
  const [followUpComment, setFollowUpComment] = useState("");
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringInterval, setRecurringInterval] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [recurringEndDate, setRecurringEndDate] = useState("");

  useEffect(() => {
    fetchLead();
    if (userRole === UserRole.ADMIN) {
      fetchUsers();
    }
  }, [leadId, userRole]);

  const fetchLead = async () => {
    setLoading(true);
    const res = await fetch(`/api/leads/${leadId}`);
    if (res.ok) {
      const data = await res.json();
      setLead(data.lead);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data.users || []);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const data = Object.fromEntries(formData.entries());

    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      addToast({ title: "Success", description: "Lead updated successfully", variant: "success" });
      setEditing(false);
      fetchLead();
    } else {
      const error = await res.json();
      addToast({ title: "Error", description: error.error || "Failed to update lead", variant: "error" });
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/leads/${leadId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: commentText }),
    });

    if (res.ok) {
      addToast({ title: "Success", description: "Comment added", variant: "success" });
      setCommentText("");
      fetchLead();
    } else {
      addToast({ title: "Error", description: "Failed to add comment", variant: "error" });
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const followUpData: any = {
      date: followUpDate,
      time: followUpTime,
      comment: followUpComment,
    };

    if (isRecurring) {
      followUpData.isRecurring = true;
      followUpData.recurringInterval = recurringInterval;
      if (recurringEndDate) {
        followUpData.recurringEndDate = recurringEndDate;
      }
    }

    const res = await fetch(`/api/leads/${leadId}/followups`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(followUpData),
    });

    if (res.ok) {
      addToast({ 
        title: "Success", 
        description: isRecurring ? "Recurring follow-up added" : "Follow-up added", 
        variant: "success" 
      });
      setFollowUpDate("");
      setFollowUpTime("");
      setFollowUpComment("");
      setIsRecurring(false);
      setRecurringInterval("weekly");
      setRecurringEndDate("");
      fetchLead();
    } else {
      addToast({ title: "Error", description: "Failed to add follow-up", variant: "error" });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!lead) {
    return <div>Lead not found</div>;
  }

  const canEdit = userRole === UserRole.ADMIN || lead.assignedUser._id === userId;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="details" className="w-full">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="followups">Follow-Ups</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Lead Information</CardTitle>
                {canEdit && (
                  <Button
                    variant="outline"
                    onClick={() => setEditing(!editing)}
                  >
                    {editing ? "Cancel" : "Edit"}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {editing ? (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={lead.name}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={lead.email}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        defaultValue={lead.phone || ""}
                      />
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        id="status"
                        name="status"
                        defaultValue={lead.status}
                        required
                      >
                        {Object.values(LeadStatus).map((status) => (
                          <option key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      defaultValue={lead.address}
                      required
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="source">Source</Label>
                      <Select
                        id="source"
                        name="source"
                        defaultValue={lead.source}
                      >
                        {Object.values(LeadSource).map((source) => (
                          <option key={source} value={source}>
                            {source.charAt(0).toUpperCase() + source.slice(1).replace("-", " ")}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="businessType">Business Type</Label>
                      <Select
                        id="businessType"
                        name="businessType"
                        defaultValue={lead.businessType || ""}
                      >
                        <option value="">Select business type</option>
                        {Object.values(BusinessType).map((type) => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ")}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>
                  {userRole === UserRole.ADMIN && (
                    <div>
                      <Label htmlFor="assignedUser">Assigned User</Label>
                      <Select
                        id="assignedUser"
                        name="assignedUser"
                        defaultValue={lead.assignedUser._id}
                        required
                      >
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </Select>
                    </div>
                  )}
                  <Button type="submit">Save Changes</Button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Name</Label>
                      <p className="text-sm font-medium">{lead.name}</p>
                    </div>
                    <div>
                      <Label>Email</Label>
                      <p className="text-sm font-medium">{lead.email}</p>
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <p className="text-sm font-medium">{lead.phone || "N/A"}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">
                        <StatusBadge status={lead.status} />
                      </div>
                    </div>
                    <div>
                      <Label>Assigned To</Label>
                      <p className="text-sm font-medium">{lead.assignedUser.name}</p>
                    </div>
                    <div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>Source</Label>
                          <p className="text-sm font-medium capitalize">
                            {lead.source.replace("-", " ")}
                          </p>
                        </div>
                        {lead.businessType && (
                          <div>
                            <Label>Business Type</Label>
                            <p className="text-sm font-medium capitalize">
                              {lead.businessType.replace("-", " ")}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Label>Address</Label>
                    <p className="text-sm font-medium">{lead.address}</p>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label>Created By</Label>
                      <p className="text-sm font-medium">{lead.createdBy.name}</p>
                    </div>
                    <div>
                      <Label>Created At</Label>
                      <p className="text-sm font-medium">
                        {dayjs(lead.createdAt).format("MMM D, YYYY h:mm A")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="followups">
          <Card>
            <CardHeader>
              <CardTitle>Follow-Ups</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddFollowUp} className="mb-6 space-y-4 border-b pb-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="followUpDate">Date</Label>
                    <Input
                      id="followUpDate"
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="followUpTime">Time</Label>
                    <Input
                      id="followUpTime"
                      type="time"
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="followUpComment">Comment</Label>
                  <Textarea
                    id="followUpComment"
                    value={followUpComment}
                    onChange={(e) => setFollowUpComment(e.target.value)}
                    required
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-700"
                  />
                  <Label htmlFor="isRecurring" className="cursor-pointer">
                    Make this recurring
                  </Label>
                </div>
                {isRecurring && (
                  <div className="space-y-3 p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-900/50">
                    <div>
                      <Label htmlFor="recurringInterval">Repeat Every</Label>
                      <Select
                        id="recurringInterval"
                        value={recurringInterval}
                        onChange={(e) => setRecurringInterval(e.target.value as "daily" | "weekly" | "monthly")}
                      >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="recurringEndDate">End Date (Optional)</Label>
                      <Input
                        id="recurringEndDate"
                        type="date"
                        value={recurringEndDate}
                        onChange={(e) => setRecurringEndDate(e.target.value)}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Leave empty to repeat indefinitely
                      </p>
                    </div>
                  </div>
                )}
                <Button type="submit">Add Follow-Up</Button>
              </form>
              <div className="space-y-4">
                {lead.followUps.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No follow-ups yet</p>
                ) : (
                  lead.followUps
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                    .map((fu) => {
                      const isOverdue = dayjs(fu.date).isBefore(dayjs(), "day");
                      const isRecurring = (fu as any).isRecurring;
                      return (
                        <div
                          key={fu._id}
                          className={`rounded-lg border p-4 ${
                            isOverdue 
                              ? "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50" 
                              : "border-gray-200 dark:border-gray-800"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900 dark:text-gray-100">
                                  {dayjs(fu.date).format("MMM D, YYYY")} at {fu.time}
                                </p>
                                {isRecurring && (
                                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200">
                                    Recurring
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300">{fu.comment}</p>
                              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Created by {fu.createdBy.name}
                              </p>
                            </div>
                            {isOverdue && (
                              <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                                Overdue
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comments">
          <Card>
            <CardHeader>
              <CardTitle>Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddComment} className="mb-6 space-y-4 border-b pb-6">
                <div>
                  <Label htmlFor="comment">Add Comment</Label>
                  <Textarea
                    id="comment"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    required
                  />
                </div>
                <Button type="submit">Add Comment</Button>
              </form>
              <div className="space-y-4">
                {lead.comments.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">No comments yet</p>
                ) : (
                  lead.comments
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                    .map((comment) => (
                      <div
                        key={comment._id}
                        className={`rounded-lg border p-4 ${
                          comment.author.role === UserRole.ADMIN
                            ? "border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/50"
                            : "border-gray-200 dark:border-gray-800"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900 dark:text-gray-100">{comment.author.name}</p>
                              {comment.author.role === UserRole.ADMIN && (
                                <span className="rounded-full bg-blue-600 dark:bg-blue-500 px-2 py-0.5 text-xs text-white">
                                  Admin
                                </span>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{comment.text}</p>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {dayjs(comment.createdAt).format("MMM D, YYYY h:mm A")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <ActivityTimeline activities={lead.activityLogs} leadName={lead.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
