import { Link } from "react-router-dom";

const LandingFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground py-16">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
                <span className="text-accent-foreground font-bold text-xl">P</span>
              </div>
              <span className="font-display font-bold text-xl">PayrollPro</span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Modern HR and payroll management for businesses of all sizes. Trusted by 10,000+ companies worldwide.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-display font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              <li>
                <Link to="#features" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Features
                </Link>
              </li>
              <li>
                <Link to="#pricing" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Pricing
                </Link>
              </li>
              <li>
                <Link to="#" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Integrations
                </Link>
              </li>
              <li>
                <Link to="#" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  API
                </Link>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li>
                <Link to="#about" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="#" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Careers
                </Link>
              </li>
              <li>
                <Link to="#" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="#" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-display font-semibold mb-4">Legal</h4>
            <ul className="space-y-3">
              <li>
                <Link to="#" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="#" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="#" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  Security
                </Link>
              </li>
              <li>
                <Link to="#" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
                  GDPR
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-primary-foreground/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-primary-foreground/60 text-sm">
            © {currentYear} PayrollPro. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="#" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">
              Twitter
            </Link>
            <Link to="#" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">
              LinkedIn
            </Link>
            <Link to="#" className="text-primary-foreground/60 hover:text-primary-foreground text-sm transition-colors">
              GitHub
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
