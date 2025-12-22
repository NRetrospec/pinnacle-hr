import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const LandingNavbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent flex items-center justify-center">
              <span className="text-accent-foreground font-bold text-lg sm:text-xl">P</span>
            </div>
            <span className="text-primary-foreground font-display font-bold text-lg sm:text-xl">
              PayrollPro
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="#features" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm font-medium">
              Features
            </Link>
            <Link to="#pricing" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm font-medium">
              Pricing
            </Link>
            <Link to="#about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm font-medium">
              About
            </Link>
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/10">
                Sign In
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="hero" size="default">
                Get Started Free
              </Button>
            </Link>
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
            <div className="flex flex-col gap-4">
              <Link to="#features" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm font-medium py-2">
                Features
              </Link>
              <Link to="#pricing" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm font-medium py-2">
                Pricing
              </Link>
              <Link to="#about" className="text-primary-foreground/80 hover:text-primary-foreground transition-colors text-sm font-medium py-2">
                About
              </Link>
              <hr className="border-white/10" />
              <Link to="/login">
                <Button variant="ghost" className="w-full text-primary-foreground/90 hover:text-primary-foreground hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
              <Link to="/signup">
                <Button variant="hero" className="w-full">
                  Get Started Free
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default LandingNavbar;
