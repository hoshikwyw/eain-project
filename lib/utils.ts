import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** The capital first letter of a name, for an avatar. `fallback` stands in for an empty name. */
export function initialOf(name: string, fallback = "E"): string {
  return name.trim().charAt(0).toUpperCase() || fallback;
}
