import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { giudizio, type Risultato } from "@/lib/calcoli";
import { cn } from "@/lib/utils";

export function Riquadro({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5 shadow-card sm:p-6", className)}>
      {children}
    </section>
  );
}

export function Indicatore({
  etichetta,
  valore,
  nota,
  icona: Icona,
  tono = "neutro",
}: {
  etichetta: string;
  valore: string;
  nota?: string;
  icona?: LucideIcon;
  tono?: "neutro" | "positivo" | "negativo";
}) {
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {etichetta}
        </p>
        {Icona && (
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Icona className="size-4" />
          </span>
        )}
      </div>
      <p
        className={cn(
          "tabular mt-2 font-display text-2xl font-semibold sm:text-[1.7rem]",
          tono === "positivo" && "text-success",
          tono === "negativo" && "text-destructive",
          tono === "neutro" && "text-foreground",
        )}
      >
        {valore}
      </p>
      {nota && <p className="mt-1 text-xs text-muted-foreground">{nota}</p>}
    </div>
  );
}

export function tonoValore(v: number | null): "neutro" | "positivo" | "negativo" {
  if (v === null || v === 0) return "neutro";
  return v > 0 ? "positivo" : "negativo";
}

export function StatoBadge({ completato }: { completato: boolean }) {
  return completato ? (
    <span className="inline-flex items-center rounded-full bg-success-soft px-2.5 py-0.5 text-xs font-medium text-success">
      Costi reali inseriti
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-warning-soft px-2.5 py-0.5 text-xs font-medium text-warning">
      Solo stima
    </span>
  );
}

export function GiudizioBadge({ prezzo, risultato }: { prezzo: number; risultato: Risultato }) {
  const g = giudizio(prezzo, risultato);
  if (g === "nessuno") return null;
  const [testo, classe] =
    g === "conviene"
      ? ["Conviene", "bg-success-soft text-success"]
      : g === "poco"
        ? ["Conviene poco", "bg-warning-soft text-warning"]
        : ["Non conviene", "bg-destructive-soft text-destructive"];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        classe,
      )}
    >
      {testo}
    </span>
  );
}
