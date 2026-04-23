import { Link } from "react-router-dom";
import { SignUp } from "@clerk/clerk-react";
import { ArrowLeft } from "lucide-react";

const Signup = () => {
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
              Start managing your workforce today
            </h1>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Join thousands of companies who trust PayrollPro for their HR and payroll needs.
            </p>
            
            {/* Benefits */}
            <ul className="space-y-4">
              {[
                "14-day free trial, no credit card required",
                "Set up in less than 5 minutes",
                "Cancel anytime",
              ].map((benefit) => (
                <li key={benefit} className="flex items-center gap-3 text-primary-foreground/90">
                  <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-accent" />
                  </div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          {/* Testimonial */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <p className="text-primary-foreground/90 italic mb-4">
              "PayrollPro transformed how we manage our 200+ employees. The GPS time tracking alone has saved us thousands."
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20" />
              <div>
                <div className="text-primary-foreground font-medium">Sarah Johnson</div>
                <div className="text-primary-foreground/60 text-sm">HR Director, TechCorp</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Clerk SignUp */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 sm:p-8 lg:p-12 bg-background">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <Link to="/" className="lg:hidden inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to home</span>
          </Link>

          {/* Clerk SignUp Component */}
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none bg-transparent",
              },
            }}
            routing="path"
            path="/signup"
            signInUrl="/login"
            afterSignUpUrl="/onboarding"
          />

          {/* Info hint */}
          <div className="mt-8 p-4 rounded-xl bg-muted/50 border border-border">
            <p className="text-sm text-muted-foreground text-center">
              <strong>Note:</strong> After creating your account, you'll choose your role (admin or employee)
            </p>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            By signing up, you agree to our{" "}
            <Link to="#" className="underline">Terms of Service</Link>{" "}
            and{" "}
            <Link to="#" className="underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
