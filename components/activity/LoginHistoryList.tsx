"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import dayjs from "dayjs";

interface LoginHistoryListProps {
  userRole: string;
  userId: string;
}

interface Activity {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  };
  action: "login" | "logout";
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export function LoginHistoryList({ userRole, userId }: LoginHistoryListProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Local filter state that only gets applied when Apply is clicked
  const [appliedFilters, setAppliedFilters] = useState({
    searchQuery: "",
    startDate: "",
    endDate: ""
  });
  useEffect(() => {
    fetchLoginHistory();
  }, [page, appliedFilters]);

  const applyFilters = () => {
    setAppliedFilters({
      searchQuery,
      startDate,
      endDate
    });
    setPage(1);
  };

  const fetchLoginHistory = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "50",
    });
    if (appliedFilters.searchQuery) params.append("search", appliedFilters.searchQuery);
    if (appliedFilters.startDate) params.append("startDate", appliedFilters.startDate);
    if (appliedFilters.endDate) params.append("endDate", appliedFilters.endDate);

    const res = await fetch(`/api/activity/login-history?${params}`);
    const data = await res.json();
    setActivities(data.activities || []);
    setTotalPages(data.pagination?.pages || 1);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col space-y-4">
          <CardTitle>Login/Logout History</CardTitle>
          <div className="flex flex-col lg:flex-row gap-4 flex-wrap">
            <Input
              placeholder="Search by name, email, or user ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="max-w-xs"
            />
            <div className="flex items-center gap-2">
              <Input
                type="date"
                placeholder="Start Date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="w-40"
              />
              <span className="text-gray-500">to</span>
              <Input
                type="date"
                placeholder="End Date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="w-40"
              />
            </div>

            <Button onClick={applyFilters}>
              Apply Filters
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStartDate("");
                setEndDate("");
                setAppliedFilters({
                  searchQuery: "",
                  startDate: "",
                  endDate: ""
                });
                setPage(1);
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : activities.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No activity found</p>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b dark:border-gray-800">
                    <th className="text-left p-2">User</th>
                    <th className="text-left p-2">Action</th>
                    <th className="text-left p-2">Date & Time</th>
                    <th className="text-left p-2">IP Address</th>
                    <th className="text-left p-2 hidden lg:table-cell">Browser</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((activity) => {
                    const browser = activity.userAgent.includes("Chrome") ? "Chrome" :
                                    activity.userAgent.includes("Firefox") ? "Firefox" :
                                    activity.userAgent.includes("Safari") ? "Safari" :
                                    activity.userAgent.includes("Edge") ? "Edge" : "Unknown";
                    
                    return (
                      <tr key={activity._id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                        <td className="p-2">
                          <div>
                            <p className="font-medium">{activity.user?.name || "Unknown"}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{activity.user?.email || ""}</p>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            activity.action === "login" 
                              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                          }`}>
                            {activity.action.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-2">
                          {dayjs(activity.createdAt).format("MMM D, YYYY h:mm A")}
                        </td>
                        <td className="p-2 text-sm">{activity.ipAddress}</td>
                        <td className="p-2 text-sm hidden lg:table-cell">{browser}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}