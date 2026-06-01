"use client";
import { Suspense } from "react";
import { UpgradePage } from "@/pages-gitlab/UpgradePage";
export default function Page() {
  return (
    <Suspense>
      <UpgradePage />
    </Suspense>
  );
}
