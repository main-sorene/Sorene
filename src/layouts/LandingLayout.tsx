"use client";

import { Navbar } from "@/components/Navbar";
import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function LandingLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const isPolicyPage = /^\/(privacy|terms|policy)/.test(pathname);
  return (
    <div className="flex flex-col w-full">
      <Navbar isPolicyPage={isPolicyPage} />
      {children}
    </div>
  );
}
