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
  Loader2
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const EmployeeDashboard = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [clockInTime, setClockInTime] = useState<Date | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleClockAction = async () => {
    setIsLoading(true);

    // Get GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });

          setTimeout(() => {
            setIsLoading(false);
            if (isClockedIn) {
              setIsClockedIn(false);
              setClockInTime(null);
              toast({
                title: "Clocked Out",
                description: `You have clocked out at ${new Date().toLocaleTimeString()}`,
              });
            } else {
              setIsClockedIn(true);
              setClockInTime(new Date());
              toast({
                title: "Clocked In",
                description: `You have clocked in at ${new Date().toLocaleTimeString()}`,
              });
            }
          }, 1000);
        },
        (error) => {
          setIsLoading(false);
          toast({
            title: "Location Required",
            description: "Please enable location services to clock in/out.",
            variant: "destructive",
          });
        }
      );
    } else {
      setIsLoading(false);
      toast({
        title: "Location Not Supported",
        description: "Your browser doesn't support geolocation.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const getWorkedHours = () => {
    if (!clockInTime) return "0:00";
    const diff = currentTime.getTime() - clockInTime.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, "0")}`;
  };

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
                variant={isClockedIn ? "destructive" : "success"}
                size="xl"
                className="w-48 h-16 text-lg clock-btn"
                onClick={handleClockAction}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : isClockedIn ? (
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

              {isClockedIn && (
                <div className="flex items-center gap-2 text-primary-foreground/80">
                  <CheckCircle2 className="w-4 h-4 text-success" />
                  <span>Clocked in since {clockInTime?.toLocaleTimeString()}</span>
                </div>
              )}

              {location && (
                <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Location verified</span>
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
              {isClockedIn ? getWorkedHours() : "0:00"}
            </div>
            <div className="text-sm text-muted-foreground mt-1">Hours Today</div>
            <div className="text-xs text-muted-foreground mt-2">32.5 hrs this week</div>
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
            <Button variant="ghost" size="sm">View all</Button>
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
                {[
                  { date: "Dec 20, 2025", clockIn: "8:00 AM", clockOut: "5:00 PM", hours: "8.0", status: "approved" },
                  { date: "Dec 19, 2025", clockIn: "7:55 AM", clockOut: "5:30 PM", hours: "8.5", status: "approved" },
                  { date: "Dec 18, 2025", clockIn: "8:15 AM", clockOut: "6:00 PM", hours: "8.75", status: "approved" },
                  { date: "Dec 17, 2025", clockIn: "8:00 AM", clockOut: "5:00 PM", hours: "8.0", status: "approved" },
                ].map((entry, index) => (
                  <tr key={index} className="border-b border-border/50 table-row-hover">
                    <td className="py-4 text-foreground">{entry.date}</td>
                    <td className="py-4 text-foreground">{entry.clockIn}</td>
                    <td className="py-4 text-foreground">{entry.clockOut}</td>
                    <td className="py-4 text-foreground">{entry.hours}</td>
                    <td className="py-4">
                      <span className="status-active px-2 py-1 rounded-full text-xs font-medium">
                        {entry.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button variant="outline" className="h-20 flex-col gap-2" asChild>
            <a href="/employee/pay">
              <DollarSign className="w-6 h-6 text-accent" />
              <span>View Pay Stubs</span>
            </a>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" asChild>
            <a href="/employee/pto">
              <Calendar className="w-6 h-6 text-accent" />
              <span>Request Time Off</span>
            </a>
          </Button>
          <Button variant="outline" className="h-20 flex-col gap-2" asChild>
            <a href="/employee/documents">
              <FileText className="w-6 h-6 text-accent" />
              <span>View Documents</span>
            </a>
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;
