import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Category } from "@pomarc/shared";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
