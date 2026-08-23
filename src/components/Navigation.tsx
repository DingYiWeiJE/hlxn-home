"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import { useState, useEffect } from "react";
import WebNavigation from "./WebNavigation";
import MobileNavigation from "./MobileNavigation";

export default function Navigation({
  hasbg,
  localeSwitchUrls,
}: {
  hasbg?: boolean;
  localeSwitchUrls?: Partial<Record<"zh" | "en", string>>;
}) {
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollThreshold = (window.innerHeight * 1) / 4;
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 50);
      setScrolledPast(currentScrollY > scrollThreshold);
      setLastScrollY(currentScrollY);
      setMobileMenuOpen(false);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
      style={{
        backgroundColor: hasbg ? "white" : scrolledPast ? "white" : "transparent",
      }}
    >
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex-shrink-0">
            <img
              src={hasbg || scrolledPast ? "/images/common/logo_2.png" : "/images/common/logo.png"}
              alt="Logo"
              style={{
                height: "auto",
                maxHeight: "clamp(40px, 8vw, 55px)",
                width: "auto",
              }}
            />
          </Link>

          {/* Web Navigation */}
          <WebNavigation
            hasbg={hasbg}
            scrolledPast={scrolledPast}
            isWhiteBg={hasbg || scrolledPast}
            localeSwitchUrls={localeSwitchUrls}
          />

          {/* Mobile Menu Button */}
          <button
            className={`md:hidden p-2 ${hasbg || scrolledPast ? "text-black" : "text-white"}`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        <MobileNavigation
          mobileMenuOpen={mobileMenuOpen}
          setMobileMenuOpen={setMobileMenuOpen}
          isWhiteBg={hasbg || scrolledPast}
          localeSwitchUrls={localeSwitchUrls}
        />
      </div>
    </nav>
  );
}
