"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Calendar, AlertCircle } from "lucide-react";
import { LeadStatus } from "@/lib/constants";
import dayjs from "dayjs";
import Link from "next/link";

interface DashboardData {
  myLeadsCount: number;
  myLeadsByStatus: Record<string, number>;
  followUpsToday: Array<{
    _id: string;
    name: string;
    followUps: Array<{ date: string; time: string; comment: string }>;
  }>;
  overdueFollowUps: Array<{
    _id: string;
    name: string;
    followUps: Array<{ date: string; time: string; comment: string }>;
  }>;
}

interface UserDashboardProps {
  userId: string;
}

export function UserDashboard({ userId }: UserDashboardProps) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((res) => res.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 dark:text-red-400">Error loading dashboard</div>
      </div>
    );
  }

  const todayFollowUps = data.followUpsToday.flatMap((lead) =>
    lead.followUps
      .filter((fu) => dayjs(fu.date).isSame(dayjs(), "day"))
      .map((fu) => ({ ...fu, leadName: lead.name, leadId: lead._id }))
  );

  const overdueFollowUps = data.overdueFollowUps.flatMap((lead) =>
    lead.followUps
      .filter((fu) => dayjs(fu.date).isBefore(dayjs(), "day"))
      .map((fu) => ({ ...fu, leadName: lead.name, leadId: lead._id }))
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Leads</CardTitle>
            <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.myLeadsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Follow-ups Today</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayFollowUps.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Follow-ups</CardTitle>
            <AlertCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {overdueFollowUps.length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Leads by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.myLeadsByStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <span className="text-sm capitalize">
                    {status.replace("-", " ")}
                  </span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayFollowUps.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No follow-ups scheduled for today</p>
              ) : (
                todayFollowUps.map((fu, idx) => (
                  <Link
                    key={idx}
                    href={`/leads/${fu.leadId}`}
                    className="block rounded-lg border border-gray-200 dark:border-gray-800 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <p className="font-medium">{fu.leadName}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{fu.comment}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {dayjs(fu.date).format("MMM D")} at {fu.time}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {overdueFollowUps.length > 0 && (
        <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50">
          <CardHeader>
            <CardTitle className="text-red-900 dark:text-red-200">Overdue Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {overdueFollowUps.map((fu, idx) => (
                <Link
                  key={idx}
                  href={`/leads/${fu.leadId}`}
                  className="block rounded-lg border border-red-200 dark:border-red-900 bg-white dark:bg-gray-900 p-3 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                >
                  <p className="font-medium">{fu.leadName}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{fu.comment}</p>
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {dayjs(fu.date).format("MMM D, YYYY")} at {fu.time}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
