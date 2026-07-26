import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  ringColor?: string;
}

const PADDING = {
  none: "",
  sm: "px-5 py-4 sm:px-6 sm:py-5",
  md: "px-5 py-5 sm:px-6 sm:py-6",
  lg: "px-6 py-6 sm:px-8 sm:py-8",
};

export default function Card({ children, className = "", padding = "md", ringColor = "ring-black/5" }: CardProps) {
  return (
    <section className={`rounded-2xl bg-white shadow-sm ring-1 ${ringColor} ${PADDING[padding]} ${className}`}>
      {children}
    </section>
  );
}
