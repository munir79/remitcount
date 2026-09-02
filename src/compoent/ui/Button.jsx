"use client";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-600/25 focus-visible:ring-indigo-500",
  secondary: "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 focus-visible:ring-neutral-400",
  danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-600/25 focus-visible:ring-rose-500",
  success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/25 focus-visible:ring-emerald-500",
  ghost: "bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 focus-visible:ring-neutral-400",
  link: "bg-transparent text-indigo-600 hover:underline p-0 h-auto",
};

const SIZES = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-[14px]",
  lg: "h-11 px-5 text-[15px]",
};

const Button = ({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  disabled = false,
  type = "button",
  className = "",
  onClick,
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md font-medium tracking-tight transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none active:scale-[0.98]
        ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;