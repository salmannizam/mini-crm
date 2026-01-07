"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, UserCheck, UserX, TrendingUp } from "lucide-react";
import { LeadStatus } from "@/lib/constants";
import dayjs from "dayjs";

interface DashboardData {
  totalLeads: number;
  leadsByStatus: Record<string, number>;
  leadsPerUser: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    leadCount: number;
  }>;
  activeUsers: number;
  inactiveUsers: number;
  recentActivity: Array<{
    _id: string;
    name: string;
    status: string;
    updatedAt: string;
    assignedUser: { name: string; email: string };
    createdBy: { name: string; email: string };
  }>;
  leadsByStatusPerUser?: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    userRole: string;
    totalLeads: number;
    statuses: Array<{ status: string; count: number }>;
  }>;
}

export function AdminDashboard() {
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

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalLeads}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.activeUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Users</CardTitle>
            <UserX className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.inactiveUsers}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.activeUsers + data.inactiveUsers}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Leads by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(data.leadsByStatus).map(([status, count]) => (
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
            <CardTitle>Leads per User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.leadsPerUser.map((user) => (
                <div key={user.userId} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{user.userName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.userEmail}</p>
                  </div>
                  <span className="font-semibold">{user.leadCount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {data.leadsByStatusPerUser && (
        <Card>
          <CardHeader>
            <CardTitle>Leads by Status per User</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">Role</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Total</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">New</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Contacted</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Follow-up</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Converted</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">Lost</th>
                  </tr>
                </thead>
                <tbody>
                  {data.leadsByStatusPerUser.map((user) => {
                    const statusMap: Record<string, number> = {};
                    user.statuses.forEach((s) => {
                      statusMap[s.status] = s.count;
                    });
                    return (
                      <tr
                        key={user.userId}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{user.userName}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.userEmail}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 capitalize">
                          {user.userRole.replace("-", " ")}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold">{user.totalLeads}</td>
                        <td className="px-4 py-3 text-center">{statusMap["new"] || 0}</td>
                        <td className="px-4 py-3 text-center">{statusMap["contacted"] || 0}</td>
                        <td className="px-4 py-3 text-center">{statusMap["follow-up"] || 0}</td>
                        <td className="px-4 py-3 text-center text-green-600 dark:text-green-400">
                          {statusMap["converted"] || 0}
                        </td>
                        <td className="px-4 py-3 text-center text-red-600 dark:text-red-400">
                          {statusMap["lost"] || 0}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.recentActivity.map((activity) => (
              <div
                key={activity._id}
                className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{activity.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Assigned to {activity.assignedUser.name} • Status:{" "}
                    {activity.status}
                  </p>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {dayjs(activity.updatedAt).format("MMM D, YYYY")}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
