"use client";

import { Menu, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { activeNavAtom, userAtom } from "@/store/atoms";
import { useAtom, useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "@/lib/firebase";
import { getUserProfile, saveUserProfile } from "@/lib/firestore";
import { scrollToSection } from "@/lib/utils";

const navLinks = [
  { label: "Home" },
  { label: "Features" },
  { label: "Testimonial" },
  { label: "How It Works" },
  { label: "Our Team" },
  { label: "Pricing" },
];

export const Navbar = ({ isPolicyPage = false }) => {
  const [activeNav, setActiveNav] = useAtom(activeNavAtom);
  const [menuOpen, setMenuOpen] = useState(false);
  const authUser = useAtomValue(userAtom);
  const [, setUser] = useAtom(userAtom);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();

  const handleTrySorene = async () => {
    if (authUser) {
      router.push("/chat");
      return;
    }
    if (!auth || !provider) return;
    try {
      setIsGoogleLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userUid = user.email || user.uid;
      if (user.photoURL || user.email) {
        await saveUserProfile(userUid, { photoUrl: user.photoURL || undefined, email: user.email || "" });
      }
      const profile = await getUserProfile(userUid);
      setUser({ uid: userUid, email: user.email, displayName: user.displayName, photoURL: user.photoURL, profile: profile || undefined });
      router.push(profile?.onboardingComplete ? "/chat" : "/onBoarding");
    } catch (e) {
      console.error("Google sign-in error:", e);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const sectionIdByLabel: Record<string, string> = {
    Home: "home",
    Features: "features",
    Testimonial: "testimonials",
    "How It Works": "how-it-works",
    "Our Team": "team",
    Pricing: "pricing",
  };

  const handleNavClick = (label: string) => {
    setActiveNav(label);
    setMenuOpen(false);

    const targetId = sectionIdByLabel[label];
    if (!targetId) return;

    if (window.location.pathname !== "/") {
      // Navigate to homepage + scroll after navigation (no full refresh)
      router.push(`/#${targetId}`);
      return;
    }

    // Already on homepage → just scroll
    scrollToSection(targetId);
  };

  // Handle scrolling when coming from another page via hash
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (hash && window.location.pathname === "/") {
      // Small delay to let the page render first
      setTimeout(() => scrollToSection(hash), 100);
    }
  }, []);

  return (
    <nav className="flex w-full items-center justify-between px-5 sm:px-10 lg:px-20 py-2 lg:py-4 sticky top-0 z-20 bg-white/90 backdrop-blur-sm">
      {!isPolicyPage && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-40 -left-40 w-[400px] h-[400px] bg-[rgba(254,221,144,0.5)] rounded-full blur-[120px]" />
          <div className="absolute -top-40 -right-40 w-[400px] h-[400px] bg-[rgba(254,221,144,0.5)] rounded-full blur-[120px]" />
        </div>
      )}

      <div className="inline-flex items-center gap-[6.65px] shrink-0">
        <img
          onClick={() => router.push("/")}
          id="header-logo"
          className="w-[154px] h-[36px] cursor-pointer"
          alt="Sorene logo"
          src="/figmaAssets/Logo-full-black.png"
        />
        {/* <span className="font-['Clash_Display-Medium',Helvetica] font-medium text-[#101010] text-[28px] sm:text-[35.7px] leading-tight whitespace-nowrap">
          Sorene
        </span> */}
      </div>

      {/* Desktop Nav Links */}
      <div className="hidden lg:inline-flex items-center px-6 py-4 bg-white border border-[#EDEDED] rounded-xl gap-6 shadow-card">
        {navLinks.map((link) => (
          <button
            key={link.label}
            onClick={() => handleNavClick(link.label)}
            className="inline-flex items-center justify-center gap-2 cursor-pointer text-body-small-medium text-[#101010] text-center tracking-[0] leading-[21px] whitespace-nowrap"
          >
            {link.label}
          </button>
        ))}
      </div>

      {/* Desktop Right Actions */}
      <div className="hidden lg:inline-flex gap-6 items-center">
        <button
          className="text-body-small-medium text-[#101010] whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => {
            setMenuOpen(false);
            if (window.location.pathname !== "/") {
              router.push("/#footer");
            } else {
              scrollToSection("footer");
            }
          }}
        >
          Contact Us
        </button>
        <div className="inline-flex justify-center gap-2 p-0.5 bg-white rounded-[8px] border-[0.5px] border-[#EDEDED] items-center">
          <button
            onClick={handleTrySorene}
            disabled={isGoogleLoading}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 h-auto bg-[#101010] rounded-lg border-none hover:bg-[#2a2a2a] transition-colors disabled:opacity-70"
          >
            {isGoogleLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
            <span className="text-body-small-medium text-white">
              Try Sorene
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu ... (same as before, just use handleNavClick) */}
      <button
        className="lg:hidden p-2 rounded-md text-[#101010] hover:bg-gray-100 transition-colors"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        {menuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-[#ededed] shadow-lg z-30 lg:hidden">
          <div className="flex flex-col px-5 py-4 gap-4">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => handleNavClick(link.label)}
                className={`text-left font-medium text-[#101010] text-sm py-2 border-b border-[#f5f5f5] last:border-0 transition-opacity ${
                  activeNav === link.label ? "opacity-100" : "opacity-60"
                }`}
              >
                {link.label}
              </button>
            ))}
            <button
              className="font-medium text-[#101010] text-sm text-center py-2"
              onClick={() => {
                setMenuOpen(false);
                if (window.location.pathname !== "/") {
                  router.push("/#footer");
                } else {
                  scrollToSection("footer");
                }
              }}
            >
              Contact Us
            </button>
            <div className="flex justify-center gap-2 p-0.5 bg-white rounded-[10px] border border-solid border-[#ededed] shadow-shadow items-center">
              <button
                onClick={() => { setMenuOpen(false); handleTrySorene(); }}
                disabled={isGoogleLoading}
                className="w-full text-center inline-flex items-center justify-center gap-2 px-3.5 py-2 h-auto bg-[#101010] rounded-lg border-none hover:bg-[#2a2a2a] disabled:opacity-70"
              >
                {isGoogleLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />}
                <span className="font-medium text-white text-sm">Try Sorene</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
