import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Clock,
  Settings,
  FileText,
  LogOut,
  ChevronLeft,
  Menu,
  Bell,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useUser, useClerk } from "@clerk/clerk-react";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "employee";
}

const adminNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/admin" },
  { icon: Users, label: "Employees", path: "/admin/employees" },
  { icon: Clock, label: "Time Tracking", path: "/admin/time-tracking" },
  { icon: FileText, label: "Documents", path: "/admin/documents" },
  { icon: Settings, label: "Settings", path: "/admin/settings" },
];

const employeeNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/employee" },
];

// Sample notifications data
const sampleNotifications = [
  {
    id: 1,
    type: "warning",
    title: "GPS Verification Failed",
    description: "Emily Davis - Outside geofence",
    time: "5 min ago",
    link: "/admin/time-tracking",
    read: false,
  },
  {
    id: 2,
    type: "info",
    title: "5 PTO Requests Pending",
    description: "Review required",
    time: "1 hour ago",
    link: "/admin/pto",
    read: false,
  },
  {
    id: 3,
    type: "error",
    title: "Missing Time Entry",
    description: "2 employees need review",
    time: "2 hours ago",
    link: "/admin/time-tracking",
    read: false,
  },
  {
    id: 4,
    type: "success",
    title: "Payroll Completed",
    description: "December payroll processed",
    time: "Yesterday",
    link: "/admin/payroll",
    read: true,
  },
];

const DashboardLayout = ({ children, role }: DashboardLayoutProps) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { signOut } = useClerk();

  const navItems = role === "admin" ? adminNavItems : employeeNavItems;
  const unreadCount = sampleNotifications.filter(n => !n.read).length;

  const handleSignOut = () => {
    signOut();
  };

  const handleNotificationClick = (link: string) => {
    setNotificationsOpen(false);
    navigate(link);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-warning" />;
      case "error":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      default:
        return <Clock className="w-4 h-4 text-accent" />;
    }
  };

  // Get user initials
  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() ||
      user.emailAddresses[0]?.emailAddress?.[0]?.toUpperCase() ||
      "U"
    : "U";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300",
          sidebarCollapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!sidebarCollapsed && (
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
                <span className="text-sidebar-primary-foreground font-bold">P</span>
              </div>
              <span className="text-sidebar-foreground font-display font-bold">PayrollPro</span>
            </Link>
          )}
          <Button
            variant="ghost"
            size="iconSm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="text-sidebar-foreground hover:bg-sidebar-accent"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronLeft className={cn("w-4 h-4 transition-transform", sidebarCollapsed && "rotate-180")} />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <button
            onClick={handleSignOut}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-all duration-200"
            )}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="font-medium text-sm">Sign out</span>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-foreground/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          "lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-300",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold">P</span>
            </div>
            <span className="text-sidebar-foreground font-display font-bold">PayrollPro</span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </Button>

            <div className="hidden sm:flex items-center gap-2 bg-muted rounded-xl px-3.5 py-2">
              <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <Input
                type="search"
                placeholder="Search..."
                className="border-0 bg-transparent h-auto p-0 focus-visible:ring-0 w-48"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}>
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                      <span className="text-[10px] font-bold text-destructive-foreground">{unreadCount}</span>
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b border-border">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-xs text-muted-foreground">{unreadCount} unread</span>
                    )}
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {sampleNotifications.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No notifications
                    </div>
                  ) : (
                    sampleNotifications.map((notification) => (
                      <button
                        key={notification.id}
                        onClick={() => handleNotificationClick(notification.link)}
                        className={cn(
                          "w-full p-4 flex items-start gap-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0",
                          !notification.read && "bg-accent/5"
                        )}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-foreground truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="w-2 h-2 bg-accent rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
                <div className="p-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate(role === "admin" ? "/admin/settings" : "/employee/settings");
                    }}
                  >
                    View all notifications
                  </Button>
                </div>
              </PopoverContent>
            </Popover>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-semibold text-sm">
                  {userInitials}
                </span>
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-foreground">
                  {user?.fullName || user?.emailAddresses[0]?.emailAddress || "User"}
                </div>
                <div className="text-xs text-muted-foreground capitalize">{role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
