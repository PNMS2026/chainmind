"use client";

export default function GlassCard({ children, style = {}, onClick = null, className = "" }) {
  return (
    <div
      onClick={onClick}
      className={`card ${onClick ? "card-interactive" : ""} ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
