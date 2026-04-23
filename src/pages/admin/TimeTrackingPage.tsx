import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { Id } from "../../../convex/_generated/dataModel";

const TimeTrackingPage = () => {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDialog, setShowDayDialog] = useState(false);

  // Fetch time entries
  const timeEntries = useQuery(api.timeEntries.getAll, {});
  const updateStatus = useMutation(api.timeEntries.updateStatus);

  // Get days for the calendar
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  // Generate calendar days
  const calendarDays: Date[] = [];
  let day = startDate;
  while (day <= endDate) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  // Group entries by date
  const entriesByDate = timeEntries?.reduce(
    (acc, entry) => {
      const dateKey = format(new Date(entry.clockInTime), "yyyy-MM-dd");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(entry);
      return acc;
    },
    {} as Record<string, typeof timeEntries>
  );

  const getDayEntries = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return entriesByDate?.[dateKey] || [];
  };

  const getDaySummary = (date: Date) => {
    const entries = getDayEntries(date);
    if (entries.length === 0) return null;

    const totalHours = entries.reduce(
      (sum, e) => sum + (e.hoursWorked || 0),
      0
    );
    const flagged = entries.filter((e) => e.status === "flagged").length;
    const pending = entries.filter((e) => e.status === "pending").length;

    return {
      count: entries.length,
      totalHours,
      flagged,
      pending,
    };
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setShowDayDialog(true);
  };

  const handleApprove = async (id: Id<"timeEntries">) => {
    try {
      await updateStatus({ id, status: "approved" });
      toast({
        title: "Entry Approved",
        description: "Time entry has been approved.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve entry.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (id: Id<"timeEntries">) => {
    try {
      await updateStatus({ id, status: "rejected" });
      toast({
        title: "Entry Rejected",
        description: "Time entry has been rejected.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject entry.",
        variant: "destructive",
      });
    }
  };

  const selectedDayEntries = selectedDate ? getDayEntries(selectedDate) : [];

  if (timeEntries === undefined) {
    return (
      <DashboardLayout role="admin">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Time Tracking
          </h1>
          <p className="text-muted-foreground mt-1">
            View and manage employee clock-ins and time entries
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {timeEntries?.filter((e) => !e.clockOutTime).length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Clocked In Now</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-warning/10">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {timeEntries?.filter((e) => e.status === "pending").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-destructive/10">
                  <XCircle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {timeEntries?.filter((e) => e.status === "flagged").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Flagged Entries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-success/10">
                  <CheckCircle2 className="w-6 h-6 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {timeEntries?.filter((e) => e.status === "approved").length || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Calendar */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{format(currentMonth, "MMMM yyyy")}</CardTitle>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentMonth(new Date())}
                >
                  Today
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {[
                { full: "Sunday", abbr: "Sun", short: "S" },
                { full: "Monday", abbr: "Mon", short: "M" },
                { full: "Tuesday", abbr: "Tue", short: "T" },
                { full: "Wednesday", abbr: "Wed", short: "W" },
                { full: "Thursday", abbr: "Thu", short: "T" },
                { full: "Friday", abbr: "Fri", short: "F" },
                { full: "Saturday", abbr: "Sat", short: "S" },
              ].map((day) => (
                <div
                  key={day.full}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  <span className="hidden sm:inline">{day.abbr}</span>
                  <span className="sm:hidden">{day.short}</span>
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, idx) => {
                const summary = getDaySummary(date);
                const isCurrentMonth = isSameMonth(date, currentMonth);
                const isSelected =
                  selectedDate && isSameDay(date, selectedDate);
                const today = isToday(date);

                return (
                  <button
                    key={idx}
                    onClick={() => handleDateClick(date)}
                    aria-label={`${format(date, "MMMM d, yyyy")}${summary ? `, ${summary.count} entries` : ""}`}
                    className={`
                      min-h-16 sm:min-h-24 p-1.5 sm:p-2 rounded-lg border text-left transition-all
                      ${!isCurrentMonth ? "opacity-40 bg-muted/30" : "bg-card hover:bg-muted/50"}
                      ${isSelected ? "ring-2 ring-primary" : ""}
                      ${today ? "border-primary" : "border-border"}
                    `}
                  >
                    <div
                      className={`text-sm font-medium mb-1 ${
                        today
                          ? "w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                          : ""
                      }`}
                    >
                      {format(date, "d")}
                    </div>

                    {summary && (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="w-3 h-3" />
                          <span>{summary.count}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>{summary.totalHours.toFixed(1)}h</span>
                        </div>
                        <div className="flex gap-1">
                          {summary.flagged > 0 && (
                            <Badge
                              variant="destructive"
                              className="text-[10px] px-1 py-0"
                            >
                              {summary.flagged}
                            </Badge>
                          )}
                          {summary.pending > 0 && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1 py-0"
                            >
                              {summary.pending}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Day Detail Dialog */}
        <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
              </DialogTitle>
              <DialogDescription>
                {selectedDayEntries.length} time entries for this day
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {selectedDayEntries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No time entries for this day</p>
                </div>
              ) : (
                selectedDayEntries.map((entry) => (
                  <div
                    key={entry._id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                          <span className="font-semibold text-accent text-sm">
                            {entry.employee?.firstName?.[0]}
                            {entry.employee?.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {entry.employee?.firstName} {entry.employee?.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {entry.employee?.employeeNumber}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={
                          entry.status === "approved"
                            ? "default"
                            : entry.status === "flagged"
                            ? "destructive"
                            : entry.status === "rejected"
                            ? "outline"
                            : "secondary"
                        }
                      >
                        {entry.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Clock In:</span>
                        <span className="ml-2 font-medium">
                          {format(new Date(entry.clockInTime), "h:mm a")}
                        </span>
                        {entry.clockInLocation && (
                          <span
                            className={`ml-2 text-xs ${
                              entry.clockInLocation.verified
                                ? "text-success"
                                : "text-warning"
                            }`}
                          >
                            <MapPin className="w-3 h-3 inline" />
                            {entry.clockInLocation.verified
                              ? " Verified"
                              : " Unverified"}
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-muted-foreground">Clock Out:</span>
                        <span className="ml-2 font-medium">
                          {entry.clockOutTime
                            ? format(new Date(entry.clockOutTime), "h:mm a")
                            : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Hours:</span>
                        <span className="ml-2 font-medium">
                          {entry.hoursWorked?.toFixed(2) || "—"}
                        </span>
                      </div>
                    </div>

                    {entry.notes && (
                      <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">
                        Note: {entry.notes}
                      </p>
                    )}

                    {(entry.status === "pending" ||
                      entry.status === "flagged") && (
                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleReject(entry._id)}
                        >
                          <XCircle className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-success hover:text-success"
                          onClick={() => handleApprove(entry._id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Approve
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default TimeTrackingPage;
