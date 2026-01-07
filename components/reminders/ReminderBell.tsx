"use client";

import { useEffect, useState } from "react";
import { Bell, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import dayjs from "dayjs";

interface Reminder {
  id: string;
  leadId: string;
  leadName: string;
  date: string;
  time: string;
  comment: string;
  assignedUser: string;
}

interface RemindersData {
  today: Reminder[];
  tomorrow: Reminder[];
  overdue: Reminder[];
  total: number;
}

export function ReminderBell() {
  const [reminders, setReminders] = useState<RemindersData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReminders();
    // Refresh every 5 minutes
    const interval = setInterval(fetchReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchReminders = async () => {
    try {
      const res = await fetch("/api/reminders");
      if (res.ok) {
        const data = await res.json();
        setReminders(data);
      }
    } catch (error) {
      console.error("Error fetching reminders:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !reminders) {
    return (
      <Button variant="ghost" size="sm" className="h-9 w-9 px-0 relative">
        <Bell className="h-5 w-5" />
      </Button>
    );
  }

  const hasReminders = reminders.total > 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 w-9 px-0 relative">
          <Bell className="h-5 w-5" />
          {hasReminders && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-600 dark:bg-red-500 text-white text-xs flex items-center justify-center">
              {reminders.total > 9 ? "9+" : reminders.total}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-[500px] overflow-y-auto">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Follow-up Reminders</span>
          {hasReminders && (
            <Badge variant="default">{reminders.total}</Badge>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {!hasReminders ? (
          <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">
            No reminders at this time
          </div>
        ) : (
          <>
            {/* Overdue */}
            {reminders.overdue.length > 0 && (
              <>
                <DropdownMenuLabel className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Overdue ({reminders.overdue.length})
                </DropdownMenuLabel>
                {reminders.overdue.slice(0, 5).map((reminder) => (
                  <DropdownMenuItem key={reminder.id} asChild>
                    <Link
                      href={`/leads/${reminder.leadId}`}
                      className="flex flex-col items-start p-3 cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-medium text-sm">{reminder.leadName}</span>
                        <Badge variant="red" className="text-xs">Overdue</Badge>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate w-full">
                        {reminder.comment}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {dayjs(reminder.date).format("MMM D")} at {reminder.time}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}

            {/* Today */}
            {reminders.today.length > 0 && (
              <>
                <DropdownMenuLabel>Today ({reminders.today.length})</DropdownMenuLabel>
                {reminders.today.map((reminder) => (
                  <DropdownMenuItem key={reminder.id} asChild>
                    <Link
                      href={`/leads/${reminder.leadId}`}
                      className="flex flex-col items-start p-3 cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-medium text-sm">{reminder.leadName}</span>
                        <Badge variant="default" className="text-xs">Today</Badge>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate w-full">
                        {reminder.comment}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {reminder.time}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}

            {/* Tomorrow */}
            {reminders.tomorrow.length > 0 && (
              <>
                <DropdownMenuLabel>Tomorrow ({reminders.tomorrow.length})</DropdownMenuLabel>
                {reminders.tomorrow.map((reminder) => (
                  <DropdownMenuItem key={reminder.id} asChild>
                    <Link
                      href={`/leads/${reminder.leadId}`}
                      className="flex flex-col items-start p-3 cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="font-medium text-sm">{reminder.leadName}</span>
                        <Badge variant="default" className="text-xs">Tomorrow</Badge>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-300 truncate w-full">
                        {reminder.comment}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {reminder.time}
                      </span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </>
            )}

            {reminders.total > 10 && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/calendar" className="w-full text-center text-sm text-blue-600 dark:text-blue-400">
                    View all reminders
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
