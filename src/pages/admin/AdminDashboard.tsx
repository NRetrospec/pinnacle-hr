import { useState } from "react";
import {
  Users,
  Clock,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin,
  Mail,
  Phone,
  Building,
  Briefcase,
  Hash,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useToast } from "@/hooks/use-toast";
import { format, startOfMonth, endOfMonth, addDays } from "date-fns";

// Sample employee data for hover cards (in real app, this would come from the activity data)
const employeeDetails: Record<string, {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  employeeNumber: string;
  hireDate: string;
  status: string;
}> = {
  "Sarah Johnson": {
    id: "1",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@company.com",
    phone: "(555) 123-4567",
    department: "Engineering",
    position: "Senior Developer",
    employeeNumber: "EMP-001",
    hireDate: "2022-03-15",
    status: "active",
  },
  "Mike Chen": {
    id: "2",
    firstName: "Mike",
    lastName: "Chen",
    email: "mike.chen@company.com",
    phone: "(555) 234-5678",
    department: "Marketing",
    position: "Marketing Manager",
    employeeNumber: "EMP-002",
    hireDate: "2021-08-20",
    status: "active",
  },
  "Emily Davis": {
    id: "3",
    firstName: "Emily",
    lastName: "Davis",
    email: "emily.davis@company.com",
    phone: "(555) 345-6789",
    department: "Sales",
    position: "Sales Representative",
    employeeNumber: "EMP-003",
    hireDate: "2023-01-10",
    status: "active",
  },
  "John Smith": {
    id: "4",
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@company.com",
    phone: "(555) 456-7890",
    department: "Operations",
    position: "Operations Lead",
    employeeNumber: "EMP-004",
    hireDate: "2020-11-05",
    status: "active",
  },
};

const recentActivity = [
  {
    id: 1,
    type: "clock_in",
    employee: "Sarah Johnson",
    time: "8:02 AM",
    location: "Main Office",
    status: "verified",
  },
  {
    id: 2,
    type: "pto_request",
    employee: "Mike Chen",
    time: "Yesterday",
    details: "Dec 26-28",
    status: "pending",
  },
  {
    id: 3,
    type: "clock_in",
    employee: "Emily Davis",
    time: "8:15 AM",
    location: "Remote",
    status: "flagged",
  },
  {
    id: 4,
    type: "clock_out",
    employee: "John Smith",
    time: "5:30 PM",
    location: "Main Office",
    status: "verified",
  },
];

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPayrollDialog, setShowPayrollDialog] = useState(false);
  const [showPtoDialog, setShowPtoDialog] = useState(false);

  // Fetch real employee statistics from Convex
  const employeeStats = useQuery(api.employees.getStats);
  const employees = useQuery(api.employees.list, { status: "active" });

  // Handle loading state (undefined)
  if (employeeStats === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Handle non-admin state (null) - show error instead of loading
  if (employeeStats === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-xl bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <span className="text-destructive font-bold text-2xl">!</span>
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-4">
              Access Denied
            </h1>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access the admin dashboard.
            </p>
            <p className="text-sm text-muted-foreground">
              Please contact your administrator if you believe this is an error.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Build stats array with real data
  const stats = [
    {
      label: "Total Employees",
      value: employeeStats?.active?.toString() || "0",
      change: `${employeeStats?.total || 0} total`,
      icon: Users,
      trend: "up" as const,
    },
    {
      label: "Clocked In Today",
      value: "—",
      change: "View time tracking",
      icon: Clock,
      trend: "neutral" as const,
    },
    {
      label: "Pending PTO",
      value: "—",
      change: "View requests",
      icon: Calendar,
      trend: "neutral" as const,
    },
    {
      label: "Next Payroll",
      value: "—",
      change: "Run payroll",
      icon: DollarSign,
      trend: "neutral" as const,
    },
  ];

  const handleRunPayroll = () => {
    setShowPayrollDialog(true);
  };

  const handleReviewPto = () => {
    setShowPtoDialog(true);
  };

  const handleAlertClick = (alertType: string) => {
    switch (alertType) {
      case "gps":
        navigate("/admin/time-tracking");
        break;
      case "pto":
        setShowPtoDialog(true);
        break;
      case "time":
        navigate("/admin/time-tracking");
        break;
    }
  };

  const processPayroll = () => {
    toast({
      title: "Payroll Processing",
      description: "Payroll has been queued for processing. You'll be notified when complete.",
    });
    setShowPayrollDialog(false);
  };

  return (
    <DashboardLayout role="admin">
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <div key={stat.label} className="dashboard-card stat-card">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-accent" />
                </div>
                {stat.trend === "up" && (
                  <TrendingUp className="w-5 h-5 text-success" />
                )}
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-foreground font-display">
                {stat.value}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              <div className="text-xs text-muted-foreground mt-2">{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 dashboard-card">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-semibold text-foreground">Recent Activity</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/admin/time-tracking">View all</Link>
              </Button>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const empDetails = employeeDetails[activity.employee];

                return (
                  <div key={activity.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 table-row-hover">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      activity.status === "verified" ? "bg-success/10" :
                      activity.status === "flagged" ? "bg-warning/10" :
                      "bg-accent/10"
                    }`}>
                      {activity.type === "clock_in" && <Clock className={`w-5 h-5 ${
                        activity.status === "verified" ? "text-success" :
                        activity.status === "flagged" ? "text-warning" :
                        "text-accent"
                      }`} />}
                      {activity.type === "clock_out" && <Clock className="w-5 h-5 text-muted-foreground" />}
                      {activity.type === "pto_request" && <Calendar className="w-5 h-5 text-accent" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Employee name with hover card */}
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <button className="font-medium text-foreground hover:text-accent transition-colors cursor-pointer underline-offset-2 hover:underline">
                            {activity.employee}
                          </button>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80" side="top">
                          {empDetails ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                                  <span className="text-lg font-semibold text-accent">
                                    {empDetails.firstName[0]}{empDetails.lastName[0]}
                                  </span>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground">
                                    {empDetails.firstName} {empDetails.lastName}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">{empDetails.position}</p>
                                </div>
                              </div>

                              <div className="grid gap-2 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="w-4 h-4" />
                                  <span>{empDetails.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="w-4 h-4" />
                                  <span>{empDetails.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Building className="w-4 h-4" />
                                  <span>{empDetails.department}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Hash className="w-4 h-4" />
                                  <span>{empDetails.employeeNumber}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Calendar className="w-4 h-4" />
                                  <span>Hired: {empDetails.hireDate}</span>
                                </div>
                              </div>

                              <div className="pt-2 border-t">
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  empDetails.status === "active"
                                    ? "bg-success/10 text-success"
                                    : "bg-muted text-muted-foreground"
                                }`}>
                                  {empDetails.status.charAt(0).toUpperCase() + empDetails.status.slice(1)}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">Employee details not available</p>
                          )}
                        </HoverCardContent>
                      </HoverCard>

                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        {activity.type === "clock_in" && (
                          <>
                            <span>Clocked in</span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {activity.location}
                            </span>
                          </>
                        )}
                        {activity.type === "clock_out" && <span>Clocked out</span>}
                        {activity.type === "pto_request" && <span>Requested PTO: {activity.details}</span>}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{activity.time}</div>
                      <div className="mt-1">
                        {activity.status === "verified" && (
                          <span className="inline-flex items-center gap-1 text-xs text-success">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        )}
                        {activity.status === "flagged" && (
                          <span className="inline-flex items-center gap-1 text-xs text-warning">
                            <AlertTriangle className="w-3 h-3" /> Flagged
                          </span>
                        )}
                        {activity.status === "pending" && (
                          <span className="inline-flex items-center gap-1 text-xs text-accent">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions & Alerts */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="dashboard-card">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/admin/employees">
                    <Users className="w-4 h-4 mr-2" />
                    Add New Employee
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleRunPayroll}
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  Run Payroll
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={handleReviewPto}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Review PTO Requests
                </Button>
              </div>
            </div>

            {/* Alerts */}
            <div className="dashboard-card">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">Alerts</h2>
              <div className="space-y-3">
                <button
                  onClick={() => handleAlertClick("gps")}
                  className="w-full flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20 hover:bg-warning/20 transition-colors text-left"
                >
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">GPS Verification Failed</div>
                    <div className="text-xs text-muted-foreground">Emily Davis - Outside geofence</div>
                  </div>
                </button>
                <button
                  onClick={() => handleAlertClick("pto")}
                  className="w-full flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors text-left"
                >
                  <Clock className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">5 PTO Requests Pending</div>
                    <div className="text-xs text-muted-foreground">Review required</div>
                  </div>
                </button>
                <button
                  onClick={() => handleAlertClick("time")}
                  className="w-full flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20 hover:bg-destructive/20 transition-colors text-left"
                >
                  <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Missing Time Entry</div>
                    <div className="text-xs text-muted-foreground">2 employees need review</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Run Payroll Dialog */}
      <Dialog open={showPayrollDialog} onOpenChange={setShowPayrollDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Run Payroll</DialogTitle>
            <DialogDescription>
              Process payroll for the current pay period. Review employee hours and compensation before processing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {(() => {
              const now = new Date();
              const periodStart = startOfMonth(now);
              const periodEnd = new Date(now.getFullYear(), now.getMonth(), 15);
              const payDate = addDays(periodEnd, 5);
              const estimatedTotal = employees
                ? employees.reduce((sum, emp) => {
                    const biweeklyPay =
                      emp.payType === "hourly"
                        ? emp.payRate * 80
                        : emp.payRate / 24;
                    return sum + biweeklyPay;
                  }, 0)
                : 0;
              return (
                <div className="rounded-lg border p-4">
                  <h3 className="font-medium mb-3">Pay Period Summary</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Pay Period:</span>
                      <span className="ml-2 font-medium">
                        {format(periodStart, "MMM d")} – {format(periodEnd, "MMM d, yyyy")}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Pay Date:</span>
                      <span className="ml-2 font-medium">{format(payDate, "MMM d, yyyy")}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Employees:</span>
                      <span className="ml-2 font-medium">{employeeStats?.active || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Estimated Total:</span>
                      <span className="ml-2 font-medium">
                        ${estimatedTotal.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {employees && employees.length > 0 ? (
              <div className="rounded-lg border">
                <div className="p-3 border-b bg-muted/30">
                  <h3 className="font-medium">Employee Breakdown</h3>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {employees.slice(0, 5).map((emp) => (
                    <div key={emp._id} className="flex items-center justify-between p-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">{emp.firstName} {emp.lastName}</p>
                        <p className="text-sm text-muted-foreground">{emp.department} - {emp.position}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          ${emp.payType === "hourly"
                            ? (emp.payRate * 80).toFixed(2)
                            : (emp.payRate / 24).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {emp.payType === "hourly" ? "80 hrs" : "Salary"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No active employees to process payroll for.
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowPayrollDialog(false)}>
              Cancel
            </Button>
            <Button onClick={processPayroll}>
              <DollarSign className="w-4 h-4 mr-2" />
              Process Payroll
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review PTO Dialog */}
      <Dialog open={showPtoDialog} onOpenChange={setShowPtoDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pending PTO Requests</DialogTitle>
            <DialogDescription>
              Review and approve or reject pending time off requests.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Sample PTO requests */}
            {[
              { name: "Mike Chen", dates: "Dec 26-28", type: "Vacation", hours: 24 },
              { name: "Sarah Johnson", dates: "Jan 2-3", type: "Personal", hours: 16 },
              { name: "John Smith", dates: "Dec 24", type: "Vacation", hours: 8 },
            ].map((request, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="font-semibold text-accent">
                      {request.name.split(" ").map(n => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{request.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.dates} - {request.type} ({request.hours} hrs)
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      toast({
                        title: "PTO Rejected",
                        description: `${request.name}'s request has been rejected.`,
                      });
                    }}
                  >
                    <XCircle className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-success hover:text-success"
                    onClick={() => {
                      toast({
                        title: "PTO Approved",
                        description: `${request.name}'s request has been approved.`,
                      });
                    }}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowPtoDialog(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminDashboard;
