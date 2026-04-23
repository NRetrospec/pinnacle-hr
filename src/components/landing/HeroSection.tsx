import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, PlayCircle, Shield, Clock, Users } from "lucide-react";

const HeroSection = () => {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden hero-gradient">
      {/* Video Background — gradient shows as fallback if video is unavailable */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        aria-hidden="true"
      >
        <source src="/videos/hero-video.mp4" type="video/mp4" />
      </video>

      {/* Dark blue overlay for text readability */}
      <div className="absolute inset-0 bg-slate-900/50" />

      {/* Subtle Grid Pattern Overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }} />

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium mb-8 animate-fade-in">
            <Shield className="w-4 h-4" />
            <span>Enterprise-Grade Security</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight animate-slide-up">
            Modern HR & Payroll
            <span className="block text-accent">Made Simple</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-white/70 mb-10 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'forwards' }}>
            Manage employees, track time with GPS verification, calculate payroll, and store documents—all in one secure, intuitive platform.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.25s', animationFillMode: 'forwards' }}>
            <Link to="/signup">
              <Button size="xl" className="group bg-white text-primary hover:bg-white/90">
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
          <div className="mt-12 sm:mt-16 flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-0 sm:divide-x sm:divide-white/20 animate-fade-in" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <div className="text-center sm:px-8">
              <div className="flex items-center justify-center gap-2 text-white/60 mb-1">
                <Users className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white">10K+</div>
              <div className="text-xs sm:text-sm text-white/50">Companies</div>
            </div>
            <div className="text-center sm:px-8">
              <div className="flex items-center justify-center gap-2 text-white/60 mb-1">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white">500K+</div>
              <div className="text-xs sm:text-sm text-white/50">Hours Tracked</div>
            </div>
            <div className="text-center sm:px-8">
              <div className="flex items-center justify-center gap-2 text-white/60 mb-1">
                <Shield className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-white">99.9%</div>
              <div className="text-xs sm:text-sm text-white/50">Uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
