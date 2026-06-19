interface StatCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  tone?: "primary" | "lime";
}

export function StatCard({ icon: Icon, label, value, tone }: StatCardProps) {
  const bg =
    tone === "primary"
      ? "bg-primary text-primary-foreground"
      : tone === "lime"
        ? "bg-lime text-lime-foreground"
        : "bg-card border border-border";

  return (
    <div className={`rounded-2xl p-4 shadow-soft ${bg}`}>
      <Icon className="size-4 opacity-70" />
      <div className="mt-3 text-2xl font-bold leading-none">{value}</div>
      <div className="text-[11px] mt-1 opacity-70">{label}</div>
    </div>
  );
}