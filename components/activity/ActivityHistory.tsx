"use client";

import { useEffect, useState } from "react";
import { ActivityTimeline } from "@/components/leads/ActivityTimeline";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Filter, Calendar } from "lucide-react";
import Link from "next/link";

interface Activity {
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
  leadId: string;
  leadName: string;
}

interface ActivityHistoryProps {
  userRole: string;
}

export function ActivityHistory({ userRole }: ActivityHistoryProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    fetchActivities();
  }, [page, actionFilter, dateFrom, dateTo]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });
      if (actionFilter) params.append("action", actionFilter);
      if (dateFrom) params.append("dateFrom", dateFrom);
      if (dateTo) params.append("dateTo", dateTo);

      const res = await fetch(`/api/activity?${params}`);
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
        setTotalPages(data.pagination?.pages || 1);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = () => {
    setPage(1);
    fetchActivities();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading activity history...</div>
      </div>
    );
  }

  // Transform activities to include lead name in description for timeline
  const transformedActivities = activities.map((activity) => ({
    ...activity,
    description: activity.description.includes(activity.leadName)
      ? activity.description
      : `${activity.description} on lead "${activity.leadName}"`,
  }));

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="action-filter" className="flex items-center gap-2 mb-2">
                <Filter className="h-4 w-4" />
                Action Type
              </Label>
              <Select
                id="action-filter"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value);
                  handleFilterChange();
                }}
              >
                <option value="">All Actions</option>
                <option value="created">Created</option>
                <option value="updated">Updated</option>
                <option value="status_changed">Status Changed</option>
                <option value="assigned">Assigned</option>
                <option value="comment_added">Comment Added</option>
                <option value="followup_added">Follow-up Added</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="date-from" className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                From Date
              </Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  handleFilterChange();
                }}
              />
            </div>
            <div>
              <Label htmlFor="date-to" className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4" />
                To Date
              </Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  handleFilterChange();
                }}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setActionFilter("");
                  setDateFrom("");
                  setDateTo("");
                  setPage(1);
                  fetchActivities();
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      {activities.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No activity found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {transformedActivities.map((activity) => (
              <Card key={activity._id} className="border-gray-200 dark:border-gray-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Link
                          href={`/leads/${activity.leadId}`}
                          className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          {activity.leadName}
                        </Link>
                      </div>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mb-1">
                        {activity.description}
                      </p>
                      {activity.metadata?.oldValue && activity.metadata?.newValue && (
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 mt-1">
                          <span className="line-through text-gray-400 dark:text-gray-500">
                            {activity.metadata.oldValue}
                          </span>
                          <span>→</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            {activity.metadata.newValue}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {new Date(activity.createdAt).toLocaleString()} by {activity.performedBy.name}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
