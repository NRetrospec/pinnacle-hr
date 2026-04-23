import { useState, useEffect } from "react";
import {
  Clock,
  DollarSign,
  Calendar,
  FileText,
  MapPin,
  CheckCircle2,
  Play,
  Square,
  Loader2,
  AlertTriangle
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { format } from "date-fns";

const EmployeeDashboard = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  // Convex queries and mutations
  const clockStatus = useQuery(api.timeEntries.getCurrentStatus);
  const recentEntries = useQuery(api.timeEntries.getMyEntries, { limit: 5 });
  const clockInMutation = useMutation(api.timeEntries.clockIn);
  const clockOutMutation = useMutation(api.timeEntries.clockOut);

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockAction = async () => {
    setIsLoading(true);

    // Get GPS location
    if (!navigator.geolocation) {
      setIsLoading(false);
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = position.coords.latitude;
          const longitude = position.coords.longitude;

          if (clockStatus?.isClockedIn) {
            // Clock out
            const result = await clockOutMutation({ latitude, longitude });
            toast({
              title: result.verified ? "Clocked Out" : "Clocked Out (Flagged)",
              description: result.message,
              variant: result.verified ? "default" : "destructive",
            });
          } else {
            // Clock in
            const result = await clockInMutation({ latitude, longitude });
            toast({
              title: result.verified ? "Clocked In" : "Clocked In (Flagged)",
              description: result.message,
              variant: result.verified ? "default" : "destructive",
            });
          }
        } catch (error: any) {
          toast({
            title: "Error",
            description: error.message || "Failed to clock in/out",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        setIsLoading(false);
        toast({
          title: "Location Required",
          description: "Please enable location services to clock in/out.",
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getWorkedHours = () => {
    if (!clockStatus?.isClockedIn || !clockStatus.activeEntry) return "0:00";
    const elapsed = clockStatus.activeEntry.elapsedHours;
    const hours = Math.floor(elapsed);
    const minutes = Math.floor((elapsed % 1) * 60);
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge variant="default" className="bg-success">Approved</Badge>;
      case "pending":
        return <Badge variant="secondary">Pending</Badge>;
      case "flagged":
        return <Badge variant="destructive">Flagged</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Show loading state while Convex data is being fetched
  if (clockStatus === undefined) {
    return (
      <DashboardLayout role="employee">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // If no employee profile, show setup message
  if (clockStatus && !clockStatus.hasEmployeeProfile) {
    return (
      <DashboardLayout role="employee">
        <div className="space-y-8">
          <div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">My Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome to Pinnacle HR</p>
          </div>

          <div className="dashboard-card p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-8 h-8 text-warning" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-4">
                Employee Profile Setup Required
              </h2>
              <p className="text-muted-foreground mb-6">
                Your employee profile hasn't been created yet. Please contact your administrator to set up your profile and link it to your account.
              </p>
              <p className="text-sm text-muted-foreground">
                Once your profile is set up, you'll be able to clock in/out, request time off, and access all employee features.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="employee">
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">My Dashboard</h1>
          <p className="text-muted-foreground mt-1">Track your time and view your information.</p>
        </div>

        {/* Clock In/Out Card */}
        <div className="dashboard-card bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-8">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="text-center lg:text-left">
              <div className="text-sm text-primary-foreground/70 uppercase tracking-wider mb-2">
                Current Time
              </div>
              <div className="text-4xl sm:text-5xl font-display font-bold mb-4">
                {formatTime(currentTime)}
              </div>
              <div className="text-primary-foreground/80">
                {currentTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4">
              <Button
                variant={clockStatus?.isClockedIn ? "destructive" : "success"}
                size="xl"
                className="w-48 h-16 text-lg clock-btn"
                onClick={handleClockAction}
                disabled={isLoading || !clockStatus}
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : clockStatus?.isClockedIn ? (
                  <>
                    <Square className="w-6 h-6" />
                    Clock Out
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6" />
                    Clock In
                  </>
                )}
              </Button>

              {clockStatus?.isClockedIn && clockStatus.activeEntry && (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2 text-primary-foreground/80">
                    {clockStatus.activeEntry.clockInVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                    <span>
                      Clocked in since {format(clockStatus.activeEntry.clockInTime, "h:mm a")}
                    </span>
                  </div>
                  {clockStatus.activeEntry.clockInVerified ? (
                    <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
                      <MapPin className="w-4 h-4" />
                      <span>Location verified</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-warning text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Outside geofence</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="dashboard-card stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Clock className="w-6 h-6 text-accent" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-display">
              {clockStatus?.isClockedIn ? getWorkedHours() : "0:00"}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Hours Today</div>
            <div className="text-xs text-muted-foreground mt-2">
              {clockStatus?.isClockedIn ? "Currently clocked in" : "Not clocked in"}
            </div>
          </div>

          <div className="dashboard-card stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-display">
              $2,450.00
            </div>
            <div className="text-sm text-muted-foreground mt-1">Last Pay</div>
            <div className="text-xs text-muted-foreground mt-2">Dec 15, 2025</div>
          </div>

          <div className="dashboard-card stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-warning" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-display">
              12.5
            </div>
            <div className="text-sm text-muted-foreground mt-1">PTO Balance</div>
            <div className="text-xs text-muted-foreground mt-2">Hours available</div>
          </div>

          <div className="dashboard-card stat-card">
            <div className="flex items-start justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-accent" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-foreground font-display">
              3
            </div>
            <div className="text-sm text-muted-foreground mt-1">New Documents</div>
            <div className="text-xs text-muted-foreground mt-2">Requires acknowledgment</div>
          </div>
        </div>

        {/* Recent Time Entries */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-lg font-semibold text-foreground">Recent Time Entries</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-muted-foreground border-b border-border">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Clock In</th>
                  <th className="pb-3 font-medium">Clock Out</th>
                  <th className="pb-3 font-medium">Total Hours</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {!recentEntries || recentEntries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No time entries yet. Clock in to get started!
                    </td>
                  </tr>
                ) : (
                  recentEntries.map((entry) => (
                    <tr key={entry._id} className="border-b border-border/50 table-row-hover">
                      <td className="py-4 text-foreground">
                        {format(entry.clockInTime, "MMM d, yyyy")}
                      </td>
                      <td className="py-4 text-foreground">
                        {format(entry.clockInTime, "h:mm a")}
                      </td>
                      <td className="py-4 text-foreground">
                        {entry.clockOutTime ? format(entry.clockOutTime, "h:mm a") : "—"}
                      </td>
                      <td className="py-4 text-foreground">
                        {entry.hoursWorked ? entry.hoursWorked.toFixed(2) : "In Progress"}
                      </td>
                      <td className="py-4">
                        {getStatusBadge(entry.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button variant="outline" className="h-20 flex-col gap-2" disabled>
            <DollarSign className="w-6 h-6 text-accent" />
            <span>View Pay Stubs</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" disabled>
            <Calendar className="w-6 h-6 text-accent" />
            <span>Request Time Off</span>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" disabled>
            <FileText className="w-6 h-6 text-accent" />
            <span>View Documents</span>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
