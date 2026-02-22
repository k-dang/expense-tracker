import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function findCaseInsensitive<T>(
  map: Record<string, T>,
  key: string,
): T | undefined {
  if (map[key] !== undefined) return map[key];
  const lower = key.toLowerCase();
  for (const k in map) {
    if (k.toLowerCase() === lower) return map[k];
  }
  return undefined;
}
