import { Check, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Starter",
    description: "Perfect for small teams getting started",
    price: "29",
    period: "per employee/month",
    features: [
      "Up to 25 employees",
      "GPS time tracking",
      "Basic payroll",
      "PTO management",
      "Email support",
    ],
    cta: "Start Free Trial",
    popular: false,
  },
  {
    name: "Professional",
    description: "For growing companies that need more",
    price: "49",
    period: "per employee/month",
    features: [
      "Unlimited employees",
      "Advanced GPS geofencing",
      "Full payroll automation",
      "Custom PTO policies",
      "Document storage",
      "Priority support",
      "Analytics dashboard",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
  {
    name: "Enterprise",
    description: "Custom solutions for large organizations",
    price: "Custom",
    period: "contact for pricing",
    features: [
      "Everything in Professional",
      "Multi-location support",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
      "On-premise option",
    ],
    cta: "Contact Sales",
    popular: false,
  },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="bg-secondary/30 py-20 sm:py-28">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">Pricing</span>
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choose the plan that fits your business. No hidden fees, cancel anytime.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5 max-w-5xl mx-auto md:py-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 sm:p-8 rounded-2xl transition-all duration-300 ${
                plan.popular
                  ? "bg-primary text-primary-foreground shadow-xl md:scale-[1.03] border-2 border-white/20"
                  : "bg-card border border-border hover:border-primary/30 hover:shadow-lg"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-white text-primary text-xs font-semibold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className={`font-display text-lg font-bold mb-1 ${plan.popular ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm ${plan.popular ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className={`text-4xl font-bold font-display ${plan.popular ? 'text-primary-foreground' : 'text-foreground'}`}>
                  {plan.price === "Custom" ? "Custom" : `$${plan.price}`}
                </span>
                <span className={`text-sm ml-2 ${plan.popular ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-white' : 'text-primary'}`} />
                    <span className={`text-sm ${plan.popular ? 'text-primary-foreground/90' : 'text-foreground'}`}>
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              <Link to="/signup">
                <Button
                  variant={plan.popular ? "secondary" : "default"}
                  size="default"
                  className={`w-full group ${plan.popular ? 'bg-white text-primary hover:bg-white/90' : ''}`}
                >
                  {plan.cta}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
