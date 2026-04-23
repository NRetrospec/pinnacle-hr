import { useUser } from "@clerk/clerk-react";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Users, Briefcase } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const Onboarding = () => {
  const { isLoaded } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const setUserRoleMutation = useMutation(api.users.setUserRole);
  const currentUser = useQuery(api.users.getCurrentUser);

  useEffect(() => {
    // If user already has a role, redirect to appropriate dashboard
    if (isLoaded && currentUser?.role) {
      navigate(`/${currentUser.role}`, { replace: true });
    }
  }, [currentUser, navigate, isLoaded]);

  const handleSetUserRole = async (role: "admin" | "employee") => {
    if (isUpdating) return;

    setIsUpdating(true);

    try {
      // Call backend mutation to set role in Convex database
      await setUserRoleMutation({ role });

      toast({
        title: "Role set successfully!",
        description: `You're now logged in as ${role}.`,
      });

      // Immediately redirect - no polling needed since Convex is immediately consistent
      navigate(`/${role}`, { replace: true });
    } catch (error: any) {
      console.error("Failed to set user role:", error);
      toast({
        title: "Error setting role",
        description: error.message || "Please try again",
        variant: "destructive",
      });
      setIsUpdating(false);
    }
  };

  // Show loading while user data loads
  if (!isLoaded || currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <div className="w-16 h-16 rounded-xl bg-primary mx-auto mb-6 flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-2xl">P</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Welcome to PayrollPro!
          </h1>
          <p className="text-muted-foreground text-lg">
            Let's get you set up. What type of account would you like?
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {/* Admin Option */}
          <div
            role="button"
            tabIndex={isUpdating ? -1 : 0}
            aria-disabled={isUpdating}
            onClick={() => !isUpdating && handleSetUserRole("admin")}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !isUpdating && handleSetUserRole("admin")}
            className={`cursor-pointer group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl ${isUpdating ? "opacity-50 pointer-events-none" : ""}`}
          >
            <div className="dashboard-card p-8 hover:border-primary transition-all">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                Administrator
              </h2>
              <p className="text-muted-foreground mb-6">
                Full access to manage employees, payroll, time tracking, and all system settings.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Manage all employees</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Approve time entries & PTO</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  <span>Run payroll & reports</span>
                </li>
              </ul>
              <Button
                className="w-full"
                size="lg"
                disabled={isUpdating}
              >
                {isUpdating ? "Setting up..." : "Continue as Admin"}
              </Button>
            </div>
          </div>

          {/* Employee Option */}
          <div
            role="button"
            tabIndex={isUpdating ? -1 : 0}
            aria-disabled={isUpdating}
            onClick={() => !isUpdating && handleSetUserRole("employee")}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !isUpdating && handleSetUserRole("employee")}
            className={`cursor-pointer group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-xl ${isUpdating ? "opacity-50 pointer-events-none" : ""}`}
          >
            <div className="dashboard-card p-8 hover:border-primary transition-all">
              <div className="w-16 h-16 rounded-xl bg-accent/10 flex items-center justify-center mb-6 group-hover:bg-accent/20 transition-colors">
                <Users className="w-8 h-8 text-accent" />
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground mb-3">
                Employee
              </h2>
              <p className="text-muted-foreground mb-6">
                Access to clock in/out, view schedules, request time off, and manage your profile.
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>Clock in/out with GPS</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>Request time off (PTO)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">✓</span>
                  <span>View pay stubs & hours</span>
                </li>
              </ul>
              <Button
                className="w-full"
                variant="outline"
                size="lg"
                disabled={isUpdating}
              >
                {isUpdating ? "Setting up..." : "Continue as Employee"}
              </Button>
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-8">
          You can change this later in your account settings
        </p>
      </div>
    </div>
  );
};

export default Onboarding;
