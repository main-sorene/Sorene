import { ReactNode } from "react";

export default function OnBoardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="flex flex-col w-full">{children}</div>;
}
