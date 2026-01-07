"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { LeadStatus, UserRole } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import dayjs from "dayjs";

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  status: LeadStatus;
  assignedUser: { name: string; email: string };
  createdAt: string;
  updatedAt: string;
}

interface LeadsListProps {
  userRole: string;
  userId: string;
}

export function LeadsList({ userRole, userId }: LeadsListProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [assignedUserFilter, setAssignedUserFilter] = useState("");
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchUsers();
  }, [userRole]);

  useEffect(() => {
    fetchLeads();
  }, [search, statusFilter, assignedUserFilter, page]);

  const fetchUsers = async () => {
    // All roles that can assign leads should fetch their assignable users
    if ([UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEADER].includes(userRole as UserRole)) {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.users || []);
    }
  };

  const fetchLeads = async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      limit: "10",
    });
    if (search) params.append("search", search);
    if (statusFilter) params.append("status", statusFilter);
    if (assignedUserFilter && [UserRole.ADMIN, UserRole.MANAGER, UserRole.TEAM_LEADER].includes(userRole as UserRole)) {
      params.append("assignedUser", assignedUserFilter);
    }

    const res = await fetch(`/api/leads?${params}`);
    const data = await res.json();
    setLeads(data.leads || []);
    setTotalPages(data.pagination?.pages || 1);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                placeholder="Search leads..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              {Object.values(LeadStatus).map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ")}
                </option>
              ))}
            </Select>
            {userRole === UserRole.ADMIN && (
              <Select
                value={assignedUserFilter}
                onChange={(e) => {
                  setAssignedUserFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            )}
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">No leads found</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Name
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 hidden sm:table-cell">
                    Email
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 hidden md:table-cell">
                    Phone
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Status
                  </th>
                  {userRole === UserRole.ADMIN && (
                    <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 hidden lg:table-cell">
                      Assigned To
                    </th>
                  )}
                  <th className="px-3 sm:px-4 py-3 text-left text-xs sm:text-sm font-semibold text-gray-900 dark:text-gray-100 hidden md:table-cell">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr
                    key={lead._id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-3 sm:px-4 py-3">
                      <Link
                        href={`/leads/${lead._id}`}
                        className="font-medium text-blue-600 dark:text-blue-400 hover:underline text-sm"
                      >
                        {lead.name}
                      </Link>
                      <div className="sm:hidden mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {lead.email}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden sm:table-cell">
                      {lead.email}
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden md:table-cell">
                      {lead.phone}
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <StatusBadge status={lead.status} />
                    </td>
                    {userRole === UserRole.ADMIN && (
                      <td className="px-3 sm:px-4 py-3 text-sm text-gray-600 dark:text-gray-300 hidden lg:table-cell">
                        {lead.assignedUser.name}
                      </td>
                    )}
                    <td className="px-3 sm:px-4 py-3 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {dayjs(lead.updatedAt).format("MMM D, YYYY")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1 text-sm disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
