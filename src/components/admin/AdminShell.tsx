"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Reports", href: "/admin/reports" },
  { label: "Content", href: "/admin/content" },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#f7f7f7]">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="font-semibold text-gray-900 text-lg">Sorene Admin</span>
        <nav className="flex gap-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={cn(
                "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith(n.href)
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-100"
              )}
            >
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
