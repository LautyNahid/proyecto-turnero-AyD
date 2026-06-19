import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface KpiCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: "lime";
}

export function KpiCard({ label, value, icon, tone }: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl p-4 shadow-soft",
        tone === "lime"
          ? "bg-lime text-lime-foreground"
          : "bg-card border border-border"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] opacity-70 font-semibold uppercase tracking-wider">
          {label}
        </div>
        <div className="opacity-70">{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
    </div>
  );
}