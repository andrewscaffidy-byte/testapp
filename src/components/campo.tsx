import type { ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Campo({
  id,
  etichetta,
  aiuto,
  errore,
  children,
  className,
}: {
  id: string;
  etichetta: string;
  aiuto?: string | undefined;
  errore?: string | undefined;
  children: ReactNode;
  className?: string | undefined;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={id} className="text-sm font-medium text-foreground">
        {etichetta}
      </Label>
      {children}
      {errore ? (
        <p id={`${id}-errore`} className="text-xs font-medium text-destructive">
          {errore}
        </p>
      ) : aiuto ? (
        <p className="text-xs text-muted-foreground">{aiuto}</p>
      ) : null}
    </div>
  );
}

export function CampoNumero({
  id,
  etichetta,
  valore,
  onChange,
  errore,
  aiuto,
  unita = "€",
}: {
  id: string;
  etichetta: string;
  valore: string;
  onChange: (v: string) => void;
  errore?: string | undefined;
  aiuto?: string | undefined;
  unita?: string | undefined;
}) {
  return (
    <Campo id={id} etichetta={etichetta} errore={errore} aiuto={aiuto}>
      <div className="relative">
        <Input
          id={id}
          name={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder="0"
          value={valore}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!errore}
          aria-describedby={errore ? `${id}-errore` : undefined}
          className={cn(
            "tabular h-11 bg-card pr-10 text-base",
            errore && "border-destructive focus-visible:ring-destructive",
          )}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">
          {unita}
        </span>
      </div>
    </Campo>
  );
}
