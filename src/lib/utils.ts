import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getFriendlyErrorMessage(error: string | Error): string {
  const msg = typeof error === "string" ? error : error.message;

  if (
    msg.includes("BadCredentials") ||
    msg.includes("535") ||
    msg.includes("gsmtp")
  ) {
    return "The email service is currently unavailable. Please try again later or use Google sign-in.";
  }

  if (msg.includes("Internal Server Error")) {
    return "Our server encountered an issue. Please try again in a few moments.";
  }

  return msg || "An unexpected error occurred. Please try again.";
}

export const scrollToSection = (id: string) => {
  setTimeout(() => {
    const element = document.getElementById(id);
    if (!element) return;

    const navbarOffset = 80; // Adjust if your navbar height changes
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.scrollY - navbarOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth",
    });
  }, 10);
};
