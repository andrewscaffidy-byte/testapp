import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" className="fill-current" />
      <path
        d="M9 16.5l4.2 4.2L23 11"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="stroke-background"
      />
    </svg>
  );
}

export function Logo({
  className,
  tone = "primary",
}: {
  className?: string;
  tone?: "primary" | "inverse";
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark
        className={
          tone === "inverse" ? "text-sidebar-primary [&_path]:stroke-sidebar" : "text-primary"
        }
      />
      <span
        className={cn(
          "font-display text-lg font-semibold tracking-tight",
          tone === "inverse" ? "text-sidebar-foreground" : "text-foreground",
        )}
      >
        TurnoPronto
      </span>
    </span>
  );
}
