import { Link } from "react-router-dom";
import { SignIn } from "@clerk/clerk-react";
import { ArrowLeft } from "lucide-react";

const Login = () => {
  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />

        <div className="relative z-10 p-12 flex flex-col justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-xl">P</span>
            </div>
            <span className="text-primary-foreground font-display font-bold text-xl">PayrollPro</span>
          </Link>

          {/* Content */}
          <div className="max-w-md">
            <h1 className="font-display text-4xl font-bold text-primary-foreground mb-6">
              Welcome back to your workforce hub
            </h1>
            <p className="text-primary-foreground/80 text-lg">
              Access your dashboard to manage employees, track time, and run payroll—all in one secure platform.
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-12">
            <div>
              <div className="text-3xl font-bold text-accent">10K+</div>
              <div className="text-primary-foreground/60 text-sm">Companies</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent">500K+</div>
              <div className="text-primary-foreground/60 text-sm">Employees</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Clerk SignIn */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 sm:p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to home</span>
          </Link>

          {/* Clerk SignIn Component */}
          <SignIn
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none bg-transparent",
              },
            }}
            routing="path"
            path="/login"
            signUpUrl="/signup"
            fallbackRedirectUrl="/onboarding"
          />

          {/* Info hint */}
          <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Note:</strong> First-time users will be asked to select their role (admin or employee)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
