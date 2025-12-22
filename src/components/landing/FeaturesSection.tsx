import { 
  Clock, 
  MapPin, 
  DollarSign, 
  FileText, 
  Calendar, 
  Shield, 
  Users, 
  BarChart3 
} from "lucide-react";

const features = [
  {
    icon: Clock,
    title: "GPS Time Tracking",
    description: "Verify employee clock-ins with precise GPS location tracking. Set geofences and prevent buddy punching.",
  },
  {
    icon: DollarSign,
    title: "Automated Payroll",
    description: "Calculate regular and overtime hours, manage deductions, and generate pay stubs automatically.",
  },
  {
    icon: Calendar,
    title: "PTO Management",
    description: "Configure accrual rules, manage time-off requests, and track balances effortlessly.",
  },
  {
    icon: FileText,
    title: "Document Storage",
    description: "Securely store and manage W-2s, 1099s, and company policies with version control.",
  },
  {
    icon: Users,
    title: "Employee Management",
    description: "Maintain comprehensive employee profiles with role-based access and audit trails.",
  },
  {
    icon: MapPin,
    title: "Location Verification",
    description: "Define work locations and verify employee presence with radius-based geofencing.",
  },
  {
    icon: BarChart3,
    title: "Real-time Analytics",
    description: "Get insights into labor costs, attendance patterns, and workforce productivity.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "GDPR-compliant data handling with role-based authorization and audit logging.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-20 sm:py-32 bg-background">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-accent font-semibold text-sm uppercase tracking-wider">Features</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mt-4 mb-6">
            Everything You Need to Manage Your Workforce
          </h2>
          <p className="text-muted-foreground text-lg">
            From time tracking to payroll, we've got every aspect of HR management covered with powerful, easy-to-use tools.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-accent/50 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
