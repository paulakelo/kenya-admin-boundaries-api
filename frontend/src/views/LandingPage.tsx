import React, { useState, useRef, useEffect } from "react";
import { HeroSection } from "../components/landing/HeroSection";
import { TelemetrySection } from "../components/landing/TelemetrySection";
import { TechSpecsSection } from "../components/landing/TechSpecsSection";
import { CtaSection } from "../components/landing/CtaSection";
import { AppFooter } from "../components/layout/AppFooter";
import { BackToTopButton } from "../components/common/BackToTopButton";

export default function LandingPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLElement>(null);

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 350);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    const checkScroll = () => {
      const depth = container ? container.scrollTop : window.scrollY;
      setShowScrollTop(depth > 350);
    };

    if (container) {
      container.addEventListener("scroll", checkScroll, { passive: true });
    }
    window.addEventListener("scroll", checkScroll, { passive: true });

    return () => {
      if (container) container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("scroll", checkScroll);
    };
  }, []);

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <main
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="h-full w-full bg-surface-base text-text-body overflow-y-auto overflow-x-hidden bg-tech-grid relative scroll-smooth overscroll-y-contain"
    >
      <HeroSection />
      <TelemetrySection />
      <TechSpecsSection />
      <CtaSection />
      <AppFooter />
      <BackToTopButton visible={showScrollTop} onClick={scrollToTop} />
    </main>
  );
}
