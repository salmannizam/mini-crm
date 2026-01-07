"use client";

import { useState } from "react";
import {
  UserPlus,
  Edit,
  MessageSquare,
  Calendar,
  User,
  FileText,
  ArrowRight,
  Filter,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

interface ActivityLog {
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
}

interface ActivityTimelineProps {
  activities: ActivityLog[];
  leadName?: string;
}

const activityIcons: Record<string, any> = {
  created: UserPlus,
  updated: Edit,
  status_changed: ArrowRight,
  assigned: User,
  comment_added: MessageSquare,
  followup_added: Calendar,
  followup_completed: Calendar,
  deleted: FileText,
  restored: FileText,
};

const activityColors: Record<string, string> = {
  created: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  updated: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  status_changed: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  assigned: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  comment_added: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  followup_added: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
  followup_completed: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
  deleted: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  restored: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
};

const getActivityIcon = (action: string) => {
  const iconKey = Object.keys(activityIcons).find((key) => action.includes(key));
  return iconKey ? activityIcons[iconKey] : FileText;
};

const getActivityColor = (action: string) => {
  const colorKey = Object.keys(activityColors).find((key) => action.includes(key));
  return colorKey ? activityColors[colorKey] : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
};

const formatActivityDescription = (activity: ActivityLog) => {
  const { action, description, metadata } = activity;

  // If metadata has field changes, show before/after
  if (metadata?.field && metadata?.oldValue !== undefined && metadata?.newValue !== undefined) {
    return (
      <div className="space-y-1">
        <p className="font-medium text-gray-900 dark:text-gray-100">{description}</p>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <span className="line-through text-gray-400 dark:text-gray-500">
            {metadata.oldValue}
          </span>
          <ArrowRight className="h-3 w-3" />
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {metadata.newValue}
          </span>
        </div>
      </div>
    );
  }

  // Show additional metadata if available
  if (metadata && Object.keys(metadata).length > 0) {
    return (
      <div className="space-y-1">
        <p className="font-medium text-gray-900 dark:text-gray-100">{description}</p>
        {metadata.status && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Status: {metadata.status}
          </p>
        )}
        {metadata.source && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Source: {metadata.source}
          </p>
        )}
      </div>
    );
  }

  return <p className="font-medium text-gray-900 dark:text-gray-100">{description}</p>;
};

export function ActivityTimeline({ activities, leadName }: ActivityTimelineProps) {
  const [filter, setFilter] = useState<string>("all");

  // Group activities by date
  const groupedActivities = activities.reduce((acc, activity) => {
    const date = dayjs(activity.createdAt).format("YYYY-MM-DD");
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(activity);
    return acc;
  }, {} as Record<string, ActivityLog[]>);

  // Sort dates descending
  const sortedDates = Object.keys(groupedActivities).sort((a, b) => {
    return dayjs(b).valueOf() - dayjs(a).valueOf();
  });

  // Filter activities
  const filteredDates = sortedDates.filter((date) => {
    if (filter === "all") return true;
    return groupedActivities[date].some((activity) => activity.action.includes(filter));
  });

  // Get unique activity types for filter
  const activityTypes = Array.from(
    new Set(activities.map((a) => a.action.split("_")[0] || a.action))
  ).sort();

  if (activities.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500 dark:text-gray-400">No activity recorded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="w-48">
          <option value="all">All Activities</option>
          {activityTypes.map((type) => (
            <option key={type} value={type}>
              {type.charAt(0).toUpperCase() + type.slice(1).replace("-", " ")}
            </option>
          ))}
        </Select>
        {filter !== "all" && (
          <Button variant="ghost" size="sm" onClick={() => setFilter("all")}>
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {filteredDates.map((date) => {
          const dateActivities = groupedActivities[date]
            .filter((activity) => {
              if (filter === "all") return true;
              return activity.action.includes(filter);
            })
            .sort((a, b) => {
              return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            });

          if (dateActivities.length === 0) return null;

          const isToday = dayjs(date).isSame(dayjs(), "day");
          const isYesterday = dayjs(date).isSame(dayjs().subtract(1, "day"), "day");

          let dateLabel = dayjs(date).format("MMMM D, YYYY");
          if (isToday) dateLabel = "Today";
          if (isYesterday) dateLabel = "Yesterday";

          return (
            <div key={date} className="space-y-4">
              {/* Date Header */}
              <div className="flex items-center gap-2">
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 px-2">
                  {dateLabel}
                </h3>
                <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
              </div>

              {/* Activities for this date */}
              <div className="relative pl-8 space-y-4">
                {/* Timeline line */}
                <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-800" />

                {dateActivities.map((activity, index) => {
                  const Icon = getActivityIcon(activity.action);
                  const colorClass = getActivityColor(activity.action);
                  const isLast = index === dateActivities.length - 1;

                  return (
                    <div key={activity._id} className="relative flex gap-4">
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center ${colorClass} border-2 border-white dark:border-gray-900`}
                        >
                          <Icon className="h-3 w-3" />
                        </div>
                      </div>

                      {/* Activity content */}
                      <div className="flex-1 pb-4">
                        <Card className="border-gray-200 dark:border-gray-800">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                {formatActivityDescription(activity)}
                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                  <span>{dayjs(activity.createdAt).format("h:mm A")}</span>
                                  <span>•</span>
                                  <span>{activity.performedBy.name}</span>
                                </div>
                              </div>
                              <Badge className={colorClass} variant="default">
                                {activity.action
                                  .split("_")
                                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(" ")}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
