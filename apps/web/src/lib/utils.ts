import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts initials from a name string
 * Takes the first letter of the first two words
 * @param name - Full name string
 * @returns Uppercase initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '';

  return name
    .split(' ')
    .filter(word => word.length > 0)
    .map(word => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
