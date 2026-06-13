import Link from "next/link";
import { Plus } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: { label: string; href: string; icon?: boolean };
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h3 className="text-lg font-bold tracking-tight">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action && (
        <Link
          href={action.href}
          className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
        >
          {action.icon && <Plus className="size-4" />}
          {action.label}
        </Link>
      )}
    </div>
  );
}