import { 
  Users, 
  Clock, 
  DollarSign, 
  Calendar, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MapPin
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const stats = [
  {
    label: "Total Employees",
    value: "47",
    change: "+3 this month",
    icon: Users,
    trend: "up",
  },
  {
    label: "Clocked In Today",
    value: "42",
    change: "89% attendance",
    icon: Clock,
    trend: "up",
  },
  {
    label: "Pending PTO",
    value: "5",
    change: "Needs review",
    icon: Calendar,
    trend: "neutral",
  },
  {
    label: "Next Payroll",
    value: "$127,450",
    change: "Dec 31, 2025",
    icon: DollarSign,
    trend: "neutral",
  },
];

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
                <Link to="/admin/time">View all</Link>
              </Button>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity) => (
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
                    <div className="font-medium text-foreground">{activity.employee}</div>
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
              ))}
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
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/admin/payroll">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Run Payroll
                  </Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link to="/admin/pto">
                    <Calendar className="w-4 h-4 mr-2" />
                    Review PTO Requests
                  </Link>
                </Button>
              </div>
            </div>

            {/* Alerts */}
            <div className="dashboard-card">
              <h2 className="font-display text-lg font-semibold text-foreground mb-4">Alerts</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">GPS Verification Failed</div>
                    <div className="text-xs text-muted-foreground">Emily Davis - Outside geofence</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <Clock className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">5 PTO Requests Pending</div>
                    <div className="text-xs text-muted-foreground">Review required</div>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-foreground">Missing Time Entry</div>
                    <div className="text-xs text-muted-foreground">2 employees need review</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
