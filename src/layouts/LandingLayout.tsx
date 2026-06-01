import { Navbar } from "@/components/Navbar";
import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

export default function LandingLayout({ children }: { children: ReactNode }) {
  const location = useLocation();

  const isPolicyPage = /^\/(privacy|terms|policy)/.test(location.pathname);
  return (
    <div className="flex flex-col w-full">
      <Navbar isPolicyPage={isPolicyPage} />
      {children}
    </div>
  );
}
