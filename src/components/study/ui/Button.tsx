import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost" | "success" | "disabled";
  size?: "sm" | "md";
  fullWidth?: boolean;
}

const VARIANT_CLASSES = {
  primary:
    "bg-gray-900 text-white hover:bg-gray-800 active:bg-gray-950 focus-visible:outline-gray-900",
  ghost:
    "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-gray-400",
  success:
    "bg-green-100 text-green-700 cursor-default focus-visible:outline-green-500",
  disabled:
    "bg-gray-100 text-gray-400 cursor-not-allowed",
};

const SIZE_CLASSES = {
  sm: "px-2.5 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2.5 text-sm rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
