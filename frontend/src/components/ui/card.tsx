import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "outline";
  interactive?: boolean;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  variant = "default",
  interactive = false,
  children,
  className = "",
  tabIndex,
  ...props
}) => {
  const baseStyle = "rounded-3xl p-6 transition-all duration-300";

  const variantStyles = {
    default: "bg-white shadow-[0_8px_30px_rgba(217,107,82,0.04)] border border-nura-rose-medium/20 glow-card",
    glass: "glass-panel shadow-[0_8px_32px_0_rgba(217,107,82,0.03)] glow-card",
    outline: "border-2 border-nura-rose-medium bg-transparent",
  };

  const interactiveStyle = interactive
    ? "cursor-pointer hover:shadow-[0_12px_40px_rgba(217,116,91,0.1)] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-3 focus-visible:ring-nura-terracotta"
    : "";

  // If interactive, make it keyboard focusable if not overridden
  const finalTabIndex = interactive ? (tabIndex ?? 0) : tabIndex;

  return (
    <div
      className={`${baseStyle} ${variantStyles[variant]} ${interactiveStyle} ${className}`}
      tabIndex={finalTabIndex}
      {...props}
    >
      {children}
    </div>
  );
};
