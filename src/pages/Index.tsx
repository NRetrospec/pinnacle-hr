import { useState, useEffect, useRef, useCallback } from "react";
import LandingNavbar from "@/components/landing/LandingNavbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import PricingSection from "@/components/landing/PricingSection";
import LandingFooter from "@/components/landing/LandingFooter";

export type LandingSection = "hero" | "features" | "pricing" | "about";

const SECTION_IDS: LandingSection[] = ["hero", "features", "pricing", "about"];

const Index = () => {
  const [activeSection, setActiveSection] = useState<LandingSection>("hero");
  const isScrollingToRef = useRef(false);

  // Track which section is visible via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isScrollingToRef.current) {
            setActiveSection(id);
          }
        },
        { threshold: 0.4 }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const handleNavigate = useCallback((section: LandingSection) => {
    const el = document.getElementById(section);
    if (!el) return;

    isScrollingToRef.current = true;
    setActiveSection(section);
    el.scrollIntoView({ behavior: "smooth" });

    // Release lock after scroll finishes
    setTimeout(() => {
      isScrollingToRef.current = false;
    }, 800);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar activeSection={activeSection} onNavigate={handleNavigate} />
      <main>
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
        <LandingFooter />
      </main>
    </div>
  );
};

export default Index;
