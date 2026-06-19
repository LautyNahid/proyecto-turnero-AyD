import { cn } from "@/lib/utils";

interface FilterChipProps {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}

export function FilterChip({ active, onClick, label, count }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 h-8 rounded-full text-xs font-semibold transition-colors inline-flex items-center gap-2",
        active
          ? "bg-card text-foreground shadow-soft"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {label}
      <span
        className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full",
          active ? "bg-primary/10 text-primary" : "bg-card/60"
        )}
      >
        {count}
      </span>
    </button>
  );
}