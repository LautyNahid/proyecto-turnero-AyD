import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Parse a date string like "YYYY-MM-DD" or an ISO string into a local Date
export function parseLocalDate(fecha: string | Date): Date {
  if (fecha instanceof Date) return fecha;

  const s = String(fecha);
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    return new Date(y, mo, d);
  }

  // Fallback to native parser for other formats
  return new Date(s);
}