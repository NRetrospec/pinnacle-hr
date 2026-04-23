import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, MapPin, Phone } from "lucide-react";

const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <section id="about" className="flex flex-col bg-primary text-primary-foreground">
      <div className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 py-20 sm:py-28">
          {/* About Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="inline-block text-white/50 font-semibold text-sm uppercase tracking-wider mb-4">About Us</span>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4">
              Building the Future of HR
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              PayrollPro was founded with a simple mission: make HR and payroll management effortless for businesses of all sizes.
            </p>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto mb-16">
            {/* Mission */}
            <div className="text-center p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors">
              <h3 className="font-display text-lg font-bold mb-3">Our Mission</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                To empower businesses with intuitive, secure, and comprehensive HR tools that save time and reduce complexity.
              </p>
            </div>

            {/* Vision */}
            <div className="text-center p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors">
              <h3 className="font-display text-lg font-bold mb-3">Our Vision</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                A world where every business, regardless of size, has access to enterprise-grade HR and payroll solutions.
              </p>
            </div>

            {/* Values */}
            <div className="text-center p-6 sm:p-8 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/[0.07] transition-colors">
              <h3 className="font-display text-lg font-bold mb-3">Our Values</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Security, simplicity, and customer success drive everything we do. Your trust is our top priority.
              </p>
            </div>
          </div>

          {/* Contact & CTA */}
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="font-display text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-white/70 mb-6">
              Join over 10,000 companies already using PayrollPro to streamline their HR operations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link to="/signup">
                <Button size="lg" className="group bg-white text-primary hover:bg-white/90">
                  Start Free Trial
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">
                <Mail className="w-4 h-4 mr-2" />
                Contact Sales
              </Button>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>hello@payrollpro.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>1-800-PAYROLL</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>San Francisco, CA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 py-6">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <span className="text-white font-bold">P</span>
              </div>
              <span className="font-display font-bold">PayrollPro</span>
            </div>
            <p className="text-white/60 text-sm">
              © {currentYear} PayrollPro. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <button className="text-white/60 hover:text-white text-sm transition-colors">
                Privacy
              </button>
              <button className="text-white/60 hover:text-white text-sm transition-colors">
                Terms
              </button>
              <button className="text-white/60 hover:text-white text-sm transition-colors">
                Security
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LandingFooter;
