"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { UserRole, LeadStatus, getRoleDisplayName } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

interface TeamMember {
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  totalLeads: number;
  statuses: Array<{ status: string; count: number }>;
}

interface TeamReportsProps {
  userRole: string;
  userId: string;
}

export function TeamReports({ userRole, userId }: TeamReportsProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allTeamMembers, setAllTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    filterReports();
  }, [roleFilter, statusFilter, allTeamMembers]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setAllTeamMembers(data.teamMembers || []);
        setTeamMembers(data.teamMembers || []);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterReports = () => {
    let filtered = [...allTeamMembers];

    // Filter by role
    if (roleFilter) {
      filtered = filtered.filter((member) => member.userRole === roleFilter);
    }

    // Filter by status (show only members with leads in that status)
    if (statusFilter) {
      filtered = filtered.filter((member) => {
        const statusCount = member.statuses.find((s) => s.status === statusFilter)?.count || 0;
        return statusCount > 0;
      });
    }

    setTeamMembers(filtered);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Role
              </label>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                {userRole === UserRole.MANAGER && (
                  <>
                    <option value={UserRole.TEAM_LEADER}>Team Leaders</option>
                    <option value={UserRole.USER}>Users</option>
                  </>
                )}
                {userRole === UserRole.TEAM_LEADER && (
                  <option value={UserRole.USER}>Users</option>
                )}
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filter by Status
              </label>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                {Object.values(LeadStatus).map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamMembers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {teamMembers.reduce((sum, member) => sum + member.totalLeads, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Converted Leads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {teamMembers.reduce(
                (sum, member) =>
                  sum + (member.statuses.find((s) => s.status === LeadStatus.CONVERTED)?.count || 0),
                0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {userRole === UserRole.MANAGER ? "Team Leaders & Users" : "Users"} Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {teamMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No team members found with the selected filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {userRole === UserRole.MANAGER ? "Team Leader / User" : "User"}
                    </th>
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
                  {teamMembers.map((member) => {
                    const statusMap: Record<string, number> = {};
                    member.statuses.forEach((s) => {
                      statusMap[s.status] = s.count;
                    });
                    return (
                      <tr
                        key={member.userId}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                              {member.userName}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {member.userEmail}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="default">
                            {getRoleDisplayName(member.userRole as UserRole)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-center font-semibold">
                          {member.totalLeads}
                        </td>
                        <td className="px-4 py-3 text-center">{statusMap["new"] || 0}</td>
                        <td className="px-4 py-3 text-center">{statusMap["contacted"] || 0}</td>
                        <td className="px-4 py-3 text-center">{statusMap["follow-up"] || 0}</td>
                        <td className="px-4 py-3 text-center text-green-600 dark:text-green-400 font-semibold">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
