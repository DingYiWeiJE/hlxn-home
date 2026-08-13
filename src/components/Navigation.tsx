"use client";

import { useLocale } from "next-intl";
import Link from "next/link";
import Image from "next/image";
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
        backgroundColor: hasbg ? "#2a62bb" : scrolledPast ? "#2a62bb" : "transparent",
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex-shrink-0">
            <Image
              src="/images/common/logo.png"
              alt="Logo"
              width={178}
              height={55}
              priority
              className="w-auto"
              style={{
                height: "auto",
                maxHeight: "clamp(40px, 8vw, 55px)",
              }}
            />
          </Link>

          {/* Web Navigation */}
          <WebNavigation
            hasbg={hasbg}
            scrolledPast={scrolledPast}
            localeSwitchUrls={localeSwitchUrls}
          />

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-white"
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
          localeSwitchUrls={localeSwitchUrls}
        />
      </div>
    </nav>
  );
}
