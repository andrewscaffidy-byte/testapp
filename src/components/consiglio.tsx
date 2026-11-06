import { CircleAlert, CircleCheck, CircleX, Lightbulb } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  MARGINE_OBIETTIVO,
  giudizio,
  prezzoConsigliato,
  prezzoMinimo,
  type Giudizio,
  type Risultato,
} from "@/lib/calcoli";
import { formatEuro } from "@/lib/formato";
import { cn } from "@/lib/utils";

const STILE: Record<
  Exclude<Giudizio, "nessuno">,
  { titolo: string; icona: typeof CircleCheck; classe: string }
> = {
  conviene: {
    titolo: "Conviene",
    icona: CircleCheck,
    classe: "border-success/30 bg-success-soft text-success",
  },
  poco: {
    titolo: "Conviene poco",
    icona: CircleAlert,
    classe: "border-warning/30 bg-warning-soft text-warning",
  },
  non_conviene: {
    titolo: "Non conviene",
    icona: CircleX,
    classe: "border-destructive/30 bg-destructive-soft text-destructive",
  },
};

function frase(g: Giudizio, prezzo: number, r: Risultato, reale: boolean): string {
  const verbo = reale ? "Ti è rimasto" : "Ti resta";
  if (g === "conviene")
    return `${verbo} un buon guadagno: ${formatEuro(r.utile)} su ${formatEuro(prezzo)} incassati.`;
  if (g === "poco")
    return `${verbo} solo ${formatEuro(r.utile)}: basta un imprevisto per lavorare quasi gratis.`;
  if (r.utile === 0)
    return reale
      ? "Hai coperto le spese ma non hai guadagnato nulla."
      : "Copri le spese ma non guadagni nulla.";
  return reale
    ? `Ci hai rimesso ${formatEuro(Math.abs(r.utile))}: le spese hanno superato il prezzo.`
    : `Con questo prezzo ci rimetti ${formatEuro(Math.abs(r.utile))}.`;
}

/** Giudizio "conviene / non conviene" e prezzo giusto da chiedere. */
export function Consiglio({
  prezzo,
  risultato,
  reale = false,
  onUsaPrezzo,
  className,
}: {
  prezzo: number;
  risultato: Risultato;
  /** true quando si basa sui costi reali (lavoro già fatto) */
  reale?: boolean;
  onUsaPrezzo?: (prezzo: number) => void;
  className?: string;
}) {
  const g = giudizio(prezzo, risultato);
  if (g === "nessuno") {
    return (
      <div
        className={cn("rounded-2xl border bg-card p-4 text-sm text-muted-foreground", className)}
      >
        Inserisci prezzo e spese: ti diremo se il lavoro conviene e quanto chiedere.
      </div>
    );
  }
  const s = STILE[g];
  const Icona = s.icona;
  const giusto = prezzoConsigliato(risultato.costoTotale);
  const minimo = prezzoMinimo(risultato.costoTotale);
  const mostraPrezzo = giusto > 0 && g !== "conviene";

  return (
    <div
      className={cn("rounded-2xl border bg-card shadow-card", className)}
      data-testid="consiglio"
    >
      <div className={cn("flex items-start gap-3 rounded-t-2xl border-b p-4", s.classe)}>
        <Icona className="mt-0.5 size-5 shrink-0" />
        <div>
          <p className="font-display font-semibold">{s.titolo}</p>
          <p className="mt-0.5 text-sm text-foreground/80">{frase(g, prezzo, risultato, reale)}</p>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Lightbulb className="size-4 text-primary" />
          {reale ? "Per un lavoro così, la prossima volta chiedi" : "Prezzo giusto da chiedere"}
        </div>
        <p
          className="tabular mt-1 font-display text-2xl font-semibold"
          data-testid="prezzo-consigliato"
        >
          {giusto > 0 ? formatEuro(giusto) : "—"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Così, dopo aver pagato tutte le spese, ti resta circa il {MARGINE_OBIETTIVO}% di quello
          che incassi. Sotto {formatEuro(minimo)} lavori in perdita.
        </p>
        {onUsaPrezzo && mostraPrezzo && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={() => onUsaPrezzo(giusto)}
          >
            Usa questo prezzo
          </Button>
        )}
      </div>
    </div>
  );
}
