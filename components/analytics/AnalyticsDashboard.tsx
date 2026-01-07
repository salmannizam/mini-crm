"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { UserRole, LeadStatus, getRoleDisplayName } from "@/lib/constants";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, TrendingDown, Target, Users } from "lucide-react";

interface AnalyticsData {
  leadTrends: Array<{ date: string; leads: number }>;
  statusDistribution: Array<{ status: string; count: number }>;
  conversionRate: number;
  totalLeads: number;
  convertedLeads: number;
  userPerformance: Array<{
    userId: string;
    userName: string;
    userEmail: string;
    totalLeads: number;
    converted: number;
    lost: number;
    conversionRate: number;
  }>;
  monthlyData: Array<{
    month: string;
    total: number;
    converted: number;
    lost: number;
  }>;
}

interface AnalyticsDashboardProps {
  userRole: string;
}

const COLORS = {
  new: "#3b82f6", // blue
  contacted: "#eab308", // yellow
  "follow-up": "#a855f7", // purple
  converted: "#22c55e", // green
  lost: "#ef4444", // red
};

const STATUS_COLORS = [
  COLORS.new,
  COLORS.contacted,
  COLORS["follow-up"],
  COLORS.converted,
  COLORS.lost,
];

export function AnalyticsDashboard({ userRole }: AnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics?period=${period}`);
      if (res.ok) {
        const analyticsData = await res.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-500 dark:text-red-400">Error loading analytics</div>
      </div>
    );
  }

  // Check if there's any data
  const hasData = data.totalLeads > 0;

  // Format status distribution for pie chart
  const pieData = data.statusDistribution.map((item) => ({
    name: item.status.charAt(0).toUpperCase() + item.status.slice(1).replace("-", " "),
    value: item.count,
    color: COLORS[item.status as keyof typeof COLORS] || "#gray",
  }));

  // Format monthly data
  const monthlyChartData = data.monthlyData.map((item) => ({
    month: item.month,
    Total: item.total,
    Converted: item.converted,
    Lost: item.lost,
  }));

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Period:
            </label>
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="180">Last 6 months</option>
              <option value="365">Last year</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Target className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalLeads}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted Leads</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.convertedLeads}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Successful conversions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.conversionRate}%
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Success rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Performers</CardTitle>
            <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.userPerformance.length}</div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Active users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      {hasData ? (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Lead Trends Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Trends Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {data.leadTrends.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.leadTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke="currentColor"
                />
                <YAxis tick={{ fontSize: 12, fill: "currentColor" }} stroke="currentColor" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="leads"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Leads Created"
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                  No data available for the selected period
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name}: ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    color: "hsl(var(--foreground))",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                  No status data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              {monthlyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  stroke="currentColor"
                />
                <YAxis tick={{ fontSize: 12, fill: "currentColor" }} stroke="currentColor" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Bar dataKey="Total" fill="#3b82f6" />
                <Bar dataKey="Converted" fill="#22c55e" />
                <Bar dataKey="Lost" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                  No monthly data available
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performers</CardTitle>
            </CardHeader>
            <CardContent>
              {data.userPerformance.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={data.userPerformance.slice(0, 5)}
                    layout="vertical"
                  >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "currentColor" }} stroke="currentColor" />
                <YAxis
                  dataKey="userName"
                  type="category"
                  tick={{ fontSize: 12, fill: "currentColor" }}
                  width={100}
                  stroke="currentColor"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "6px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Bar dataKey="converted" fill="#22c55e" name="Converted" />
                <Bar dataKey="lost" fill="#ef4444" name="Lost" />
              </BarChart>
            </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
                  No performance data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No analytics data available yet. Start creating leads to see insights!
            </p>
          </CardContent>
        </Card>
      )}

      {/* User Performance Table */}
      {userRole !== UserRole.USER && hasData && data.userPerformance.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>User Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      User
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Total Leads
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Converted
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Lost
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Conversion Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.userPerformance.map((user) => (
                    <tr
                      key={user.userId}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {user.userName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user.userEmail}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {user.totalLeads}
                      </td>
                      <td className="px-4 py-3 text-center text-green-600 dark:text-green-400 font-semibold">
                        {user.converted}
                      </td>
                      <td className="px-4 py-3 text-center text-red-600 dark:text-red-400">
                        {user.lost}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`font-semibold ${
                            user.conversionRate >= 30
                              ? "text-green-600 dark:text-green-400"
                              : user.conversionRate >= 15
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {user.conversionRate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
