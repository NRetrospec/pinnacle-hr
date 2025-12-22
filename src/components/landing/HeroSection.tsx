import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, PlayCircle, Shield, Clock, Users } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBg})` }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/90" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30 text-accent text-sm font-medium mb-8 animate-fade-in">
            <Shield className="w-4 h-4" />
            <span>Enterprise-Grade Security</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight animate-slide-up">
            Modern HR & Payroll
            <span className="block text-gradient">Made Simple</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto animate-slide-up stagger-1 opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            Manage employees, track time with GPS verification, calculate payroll, and store documents—all in one secure, intuitive platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-2 opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            <Link to="/signup">
              <Button variant="hero" size="xl" className="group">
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Button variant="glass" size="xl" className="group">
              <PlayCircle className="w-5 h-5" />
              Watch Demo
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-xl mx-auto animate-fade-in stagger-3 opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-accent mb-2">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-primary-foreground">10K+</div>
              <div className="text-sm text-primary-foreground/60">Companies</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-accent mb-2">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-primary-foreground">500K+</div>
              <div className="text-sm text-primary-foreground/60">Hours Tracked</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-accent mb-2">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-primary-foreground">99.9%</div>
              <div className="text-sm text-primary-foreground/60">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
