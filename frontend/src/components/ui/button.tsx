import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "text";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  children,
  className = "",
  type = "button",
  ...props
}) => {
  const baseStyle =
    "inline-flex items-center justify-center font-medium rounded-full transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-3 focus-visible:ring-nura-terracotta disabled:opacity-50 disabled:pointer-events-none";

  const sizeStyles = {
    sm: "px-4 py-1.5 text-sm",
    md: "px-6 py-2.5 text-base",
    lg: "px-8 py-3.5 text-lg",
  };

  const variantStyles = {
    primary:
      "bg-nura-terracotta text-white shadow-sm hover:bg-[#c9634b] active:scale-[0.98]",
    secondary:
      "bg-nura-slate text-white shadow-sm hover:bg-[#32344a] active:scale-[0.98]",
    outline:
      "border-2 border-nura-terracotta text-nura-terracotta bg-transparent hover:bg-nura-rose-light active:scale-[0.98]",
    text: "text-nura-slate bg-transparent hover:text-nura-terracotta hover:underline",
  };

  return (
    <button
      type={type}
      className={`${baseStyle} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
