import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-teal-700 text-white border-teal-700 hover:bg-teal-800",
  secondary:
    "bg-white text-stone-900 border-stone-300 hover:bg-stone-100 dark:bg-stone-800 dark:text-stone-100 dark:border-stone-600 dark:hover:bg-stone-700",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export function Button({ variant = "secondary", className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded-lg border px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
