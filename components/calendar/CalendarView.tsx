"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, AlertCircle, Clock } from "lucide-react";
import dayjs from "dayjs";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  comment: string;
  leadId: string;
  leadName: string;
  assignedUser: string;
  isOverdue: boolean;
  isToday: boolean;
}

interface UpcomingEvent {
  id: string;
  leadName: string;
  date: string;
  time: string;
  comment: string;
  leadId: string;
  daysUntil: number;
}

interface OverdueEvent {
  id: string;
  leadName: string;
  date: string;
  time: string;
  comment: string;
  leadId: string;
  daysOverdue: number;
}

interface CalendarData {
  eventsByDate: Record<string, CalendarEvent[]>;
  upcomingEvents: UpcomingEvent[];
  overdueEvents: OverdueEvent[];
  totalEvents: number;
}

interface CalendarViewProps {
  userRole: string;
}

export function CalendarView({ userRole }: CalendarViewProps) {
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchCalendarData();
  }, [currentMonth]);

  const fetchCalendarData = async () => {
    setLoading(true);
    try {
      const month = dayjs(currentMonth).format("YYYY-MM");
      const res = await fetch(`/api/calendar?month=${month}`);
      if (res.ok) {
        const calendarData = await res.json();
        setData(calendarData);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const previousMonth = () => {
    setCurrentMonth((prev) => {
      const newMonth = dayjs(prev);
      return newMonth.subtract(1, "month");
    });
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => {
      const newMonth = dayjs(prev);
      return newMonth.add(1, "month");
    });
  };

  const goToToday = () => {
    const today = dayjs();
    setCurrentMonth(today);
    setSelectedDate(today.format("YYYY-MM-DD"));
  };

  // Generate calendar days
  const monthObj = dayjs(currentMonth);
  const startOfMonth = monthObj.startOf("month");
  const endOfMonth = monthObj.endOf("month");
  const startOfCalendar = startOfMonth.startOf("week");
  const endOfCalendar = endOfMonth.endOf("week");

  const calendarDays: Array<{
    date: dayjs.Dayjs;
    isCurrentMonth: boolean;
    isToday: boolean;
    events: CalendarEvent[];
  }> = [];

  let currentDay = startOfCalendar;
  while (currentDay.isBefore(endOfCalendar) || currentDay.isSame(endOfCalendar)) {
    const dateStr = currentDay.format("YYYY-MM-DD");
    const events = data?.eventsByDate[dateStr] || [];
    calendarDays.push({
      date: currentDay,
      isCurrentMonth: currentDay.month() === monthObj.month(),
      isToday: currentDay.isSame(dayjs(), "day"),
      events,
    });
    currentDay = currentDay.add(1, "day");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400">Loading calendar...</div>
      </div>
    );
  }

  const selectedDateEvents = selectedDate ? data?.eventsByDate[selectedDate] || [] : [];

  return (
    <div className="space-y-6">
      {/* Calendar Header */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm" onClick={previousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 min-w-[200px] text-center">
                {monthObj.format("MMMM YYYY")}
              </h2>
              <Button variant="outline" size="sm" onClick={nextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendar Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1">
                {/* Day headers */}
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-sm font-semibold text-gray-700 dark:text-gray-300"
                  >
                    {day}
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day, idx) => {
                  const dateStr = day.date.format("YYYY-MM-DD");
                  const hasEvents = day.events.length > 0;
                  const hasOverdue = day.events.some((e) => e.isOverdue);
                  const isSelected = selectedDate === dateStr;

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`
                        min-h-[80px] p-1 border border-gray-200 dark:border-gray-800
                        ${!day.isCurrentMonth ? "bg-gray-50 dark:bg-gray-900/50 opacity-50" : ""}
                        ${day.isToday ? "ring-2 ring-blue-500 dark:ring-blue-400" : ""}
                        ${isSelected ? "bg-blue-50 dark:bg-blue-950/50" : ""}
                        ${hasEvents ? "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50" : ""}
                        transition-colors
                      `}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`
                            text-sm font-medium
                            ${day.isToday ? "text-blue-600 dark:text-blue-400" : ""}
                            ${!day.isCurrentMonth ? "text-gray-400" : "text-gray-900 dark:text-gray-100"}
                          `}
                        >
                          {day.date.date()}
                        </span>
                        {hasOverdue && (
                          <AlertCircle className="h-3 w-3 text-red-600 dark:text-red-400" />
                        )}
                      </div>
                      <div className="space-y-0.5">
                        {day.events.slice(0, 2).map((event) => (
                          <div
                            key={event.id}
                            className={`
                              text-xs px-1 py-0.5 rounded truncate
                              ${event.isOverdue
                                ? "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200"
                                : event.isToday
                                ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                              }
                            `}
                            title={`${event.leadName}: ${event.comment}`}
                          >
                            {event.time} - {event.leadName}
                          </div>
                        ))}
                        {day.events.length > 2 && (
                          <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
                            +{day.events.length - 2} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Upcoming & Overdue */}
        <div className="space-y-4">
          {/* Overdue Follow-ups */}
          {data && data.overdueEvents.length > 0 && (
            <Card className="border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/50">
              <CardHeader>
                <CardTitle className="text-red-900 dark:text-red-200 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Overdue ({data.overdueEvents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                  {data.overdueEvents.slice(0, 5).map((event) => (
                    <Link
                      key={event.id}
                      href={`/leads/${event.leadId}`}
                      className="block rounded-lg border border-red-200 dark:border-red-900 bg-white dark:bg-gray-900 p-3 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {event.leadName}
                        </p>
                        <Badge variant="red" className="text-xs">
                          {event.daysOverdue}d
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                        {event.comment}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {dayjs(event.date).format("MMM D, YYYY")} at {event.time}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Follow-ups */}
          {data && data.upcomingEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming (Next 7 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {data.upcomingEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/leads/${event.leadId}`}
                      className="block rounded-lg border border-gray-200 dark:border-gray-800 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-1">
                        <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                          {event.leadName}
                        </p>
                        <Badge variant="default" className="text-xs">
                          {event.daysUntil === 0
                            ? "Today"
                            : event.daysUntil === 1
                            ? "Tomorrow"
                            : `In ${event.daysUntil}d`}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                        {event.comment}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {dayjs(event.date).format("MMM D")} at {event.time}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Date Events */}
          {selectedDate && selectedDateEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {dayjs(selectedDate).format("MMMM D, YYYY")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedDateEvents.map((event) => (
                    <Link
                      key={event.id}
                      href={`/leads/${event.leadId}`}
                      className="block rounded-lg border border-gray-200 dark:border-gray-800 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                        {event.leadName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300">
                        {event.comment}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {event.time}
                      </p>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
