import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LandingSection } from "@/pages/Index";
import { cn } from "@/lib/utils";

interface LandingNavbarProps {
  activeSection: LandingSection;
  onNavigate: (section: LandingSection) => void;
}

const LandingNavbar = ({ activeSection, onNavigate }: LandingNavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const { isSignedIn } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();

  // Get user role if signed in
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isSignedIn ? undefined : "skip"
  );

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getDashboardLink = () => {
    if (currentUser?.role === "admin") return "/admin";
    if (currentUser?.role === "employee") return "/employee";
    return "/onboarding";
  };

  const handleNavClick = (section: LandingSection) => {
    setIsOpen(false);
    onNavigate(section);
  };

  const navItems: { label: string; section: LandingSection }[] = [
    { label: "Home", section: "hero" },
    { label: "Features", section: "features" },
    { label: "Pricing", section: "pricing" },
    { label: "About", section: "about" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/90 backdrop-blur-xl border-b border-white/10 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <button
            onClick={() => handleNavClick("hero")}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white font-bold text-lg sm:text-xl">P</span>
            </div>
            <span className="text-primary-foreground font-display font-bold text-lg sm:text-xl">
              PayrollPro
            </span>
          </button>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.section}
                onClick={() => handleNavClick(item.section)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                  activeSection === item.section
                    ? "bg-white/20 text-white"
                    : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {isSignedIn ? (
              <>
                <Link to={getDashboardLink()}>
                  <Button variant="ghost" className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/10">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="border-white/30 text-primary-foreground hover:bg-white/10"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-white text-primary hover:bg-white/90">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-primary-foreground p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-white/10 animate-fade-in">
            <div className="flex flex-col gap-2">
              {navItems.map((item) => (
                <button
                  key={item.section}
                  onClick={() => handleNavClick(item.section)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium text-left transition-all",
                    activeSection === item.section
                      ? "bg-white/20 text-white"
                      : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
                  )}
                >
                  {item.label}
                </button>
              ))}
              <hr className="border-white/10 my-2" />
              {isSignedIn ? (
                <>
                  <Link to={getDashboardLink()} onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/10">
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={handleSignOut}
                    className="w-full border-white/30 text-primary-foreground hover:bg-white/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    <Button variant="ghost" className="w-full text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/10">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsOpen(false)}>
                    <Button className="w-full bg-white text-primary hover:bg-white/90">
                      Get Started Free
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LandingNavbar;
