import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

import { Campo, CampoNumero } from "@/components/campo";
import { Consiglio } from "@/components/consiglio";
import { Riquadro } from "@/components/indicatori";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calcola } from "@/lib/calcoli";
import { formatEuro, formatPercentuale, leggiNumero, numeroPerCampo, oggiISO } from "@/lib/formato";
import { erroriDa, preventivoSchema, type Intervento } from "@/lib/interventi";
import { cn } from "@/lib/utils";

type Valori = {
  appartamento: string;
  data: string;
  prezzo: string;
  ore_previste: string;
  costo_orario: string;
  lavanderia_prevista: string;
  materiali_previsti: string;
  trasporto_previsto: string;
  altri_previsti: string;
};

export type DatiPreventivo = {
  appartamento: string;
  data: string;
  prezzo: number;
  ore_previste: number;
  costo_orario: number;
  lavanderia_prevista: number;
  materiali_previsti: number;
  trasporto_previsto: number;
  altri_previsti: number;
};

function iniziali(i?: Intervento): Valori {
  return {
    appartamento: i?.appartamento ?? "",
    data: i?.data ?? oggiISO(),
    prezzo: numeroPerCampo(i?.prezzo),
    ore_previste: numeroPerCampo(i?.ore_previste),
    costo_orario: numeroPerCampo(i?.costo_orario),
    lavanderia_prevista: numeroPerCampo(i?.lavanderia_prevista),
    materiali_previsti: numeroPerCampo(i?.materiali_previsti),
    trasporto_previsto: numeroPerCampo(i?.trasporto_previsto),
    altri_previsti: numeroPerCampo(i?.altri_previsti),
  };
}

const num = (s: string) => {
  const v = leggiNumero(s);
  return Number.isFinite(v) && v >= 0 ? v : 0;
};

export function ModuloPreventivo({
  intervento,
  etichettaInvio,
  onSalva,
  onAnnulla,
}: {
  intervento?: Intervento;
  etichettaInvio: string;
  onSalva: (dati: DatiPreventivo) => Promise<void>;
  onAnnulla?: () => void;
}) {
  const [valori, setValori] = useState<Valori>(() => iniziali(intervento));
  const [errori, setErrori] = useState<Partial<Record<keyof Valori, string>>>({});
  const [invio, setInvio] = useState(false);

  const set = (k: keyof Valori) => (v: string) => {
    setValori((p) => ({ ...p, [k]: v }));
    if (errori[k]) setErrori((e) => ({ ...e, [k]: "" }));
  };

  const anteprima = useMemo(
    () =>
      calcola(num(valori.prezzo), {
        ore: num(valori.ore_previste),
        costoOrario: num(valori.costo_orario),
        lavanderia: num(valori.lavanderia_prevista),
        materiali: num(valori.materiali_previsti),
        trasporto: num(valori.trasporto_previsto),
        altri: num(valori.altri_previsti),
      }),
    [valori],
  );

  async function invia(e: FormEvent) {
    e.preventDefault();
    const r = preventivoSchema.safeParse(valori);
    if (!r.success) {
      setErrori(erroriDa(r.error) as Partial<Record<keyof Valori, string>>);
      return;
    }
    setInvio(true);
    try {
      await onSalva(r.data);
    } finally {
      setInvio(false);
    }
  }

  return (
    <form onSubmit={invia} noValidate className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Riquadro>
          <h2 className="text-base font-semibold">Dati dell'intervento</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Usa solo un nome interno per l'appartamento. Non inserire dati degli ospiti.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Campo
              id="appartamento"
              etichetta="Nome interno dell'appartamento"
              errore={errori.appartamento}
              className="sm:col-span-2"
            >
              <Input
                id="appartamento"
                name="appartamento"
                placeholder="Es. Trilocale Via Roma 12"
                maxLength={120}
                value={valori.appartamento}
                onChange={(e) => set("appartamento")(e.target.value)}
                aria-invalid={!!errori.appartamento}
                className="h-11 bg-card text-base"
              />
            </Campo>
            <Campo id="data" etichetta="Data" errore={errori.data}>
              <Input
                id="data"
                name="data"
                type="date"
                value={valori.data}
                onChange={(e) => set("data")(e.target.value)}
                aria-invalid={!!errori.data}
                className="h-11 bg-card text-base"
              />
            </Campo>
            <CampoNumero
              id="prezzo"
              etichetta="Prezzo concordato"
              aiuto="Quanto incassi dal cliente per questa pulizia"
              valore={valori.prezzo}
              onChange={set("prezzo")}
              errore={errori.prezzo}
            />
          </div>
        </Riquadro>

        <Riquadro>
          <h2 className="text-base font-semibold">Lavoro degli addetti (previsto)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Somma le ore di tutti: 2 addetti per 1 ora e mezza = 3 ore.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <CampoNumero
              id="ore_previste"
              etichetta="Ore di lavoro totali"
              aiuto="Ore di tutti gli addetti messe insieme (ore-persona)"
              unita="h"
              valore={valori.ore_previste}
              onChange={set("ore_previste")}
              errore={errori.ore_previste}
            />
            <CampoNumero
              id="costo_orario"
              etichetta="Quanto ti costa un'ora di un addetto"
              aiuto="Paga, contributi e assicurazione: il costo vero per te, non la paga netta"
              valore={valori.costo_orario}
              onChange={set("costo_orario")}
              errore={errori.costo_orario}
            />
          </div>
        </Riquadro>

        <Riquadro>
          <h2 className="text-base font-semibold">Altre spese previste</h2>
          <p className="mt-1 text-sm text-muted-foreground">Lascia vuoto se una spesa non c'è.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <CampoNumero
              id="lavanderia_prevista"
              etichetta="Lavanderia"
              aiuto="Lavaggio di lenzuola e asciugamani"
              valore={valori.lavanderia_prevista}
              onChange={set("lavanderia_prevista")}
              errore={errori.lavanderia_prevista}
            />
            <CampoNumero
              id="materiali_previsti"
              etichetta="Materiali"
              aiuto="Detersivi, sacchi, prodotti di cortesia"
              valore={valori.materiali_previsti}
              onChange={set("materiali_previsti")}
              errore={errori.materiali_previsti}
            />
            <CampoNumero
              id="trasporto_previsto"
              etichetta="Trasporto"
              aiuto="Carburante, parcheggio, biglietti"
              valore={valori.trasporto_previsto}
              onChange={set("trasporto_previsto")}
              errore={errori.trasporto_previsto}
            />
            <CampoNumero
              id="altri_previsti"
              etichetta="Altre spese"
              aiuto="Qualsiasi altra spesa per questo lavoro"
              valore={valori.altri_previsti}
              onChange={set("altri_previsti")}
              errore={errori.altri_previsti}
            />
          </div>
        </Riquadro>
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-2xl bg-hero p-5 text-primary-foreground shadow-elevated sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">
            Calcolo automatico
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <Riga etichetta="Costo degli addetti" spiegazione="Ore × costo di un'ora">
              {formatEuro(anteprima.costoManodopera)}
            </Riga>
            <Riga etichetta="Spese totali" spiegazione="Addetti + tutte le altre spese">
              {formatEuro(anteprima.costoTotale)}
            </Riga>
            <div className="border-t border-primary-foreground/20 pt-3">
              <Riga
                etichetta="Guadagno previsto"
                spiegazione="Quello che ti resta: prezzo − spese (utile)"
                grande
                testId="utile-previsto"
              >
                {formatEuro(anteprima.utile)}
              </Riga>
            </div>
            <Riga
              etichetta="Margine previsto"
              spiegazione="Su 100 € incassati, quanti ti restano in tasca"
              grande
              testId="margine-previsto"
            >
              {formatPercentuale(anteprima.margine)}
            </Riga>
          </dl>
          {anteprima.margine === null && (
            <p className="mt-3 text-xs opacity-80">
              Con prezzo zero il margine non si può calcolare.
            </p>
          )}
        </div>
        <Consiglio
          className="mt-4"
          prezzo={num(valori.prezzo)}
          risultato={anteprima}
          onUsaPrezzo={(p) => set("prezzo")(String(p))}
        />
        <div className={cn("mt-4 flex flex-col gap-2", onAnnulla && "sm:flex-row lg:flex-col")}>
          <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={invio}>
            {invio && <Loader2 className="animate-spin" />}
            {etichettaInvio}
          </Button>
          {onAnnulla && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 w-full"
              onClick={onAnnulla}
            >
              Annulla
            </Button>
          )}
        </div>
      </aside>
    </form>
  );
}

export function Riga({
  etichetta,
  spiegazione,
  grande,
  testId,
  children,
}: {
  etichetta: string;
  spiegazione: string;
  grande?: boolean;
  testId?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex justify-between gap-4">
      <dt>
        <span className="opacity-90">{etichetta}</span>
        <span className="block text-[11px] leading-snug opacity-70">{spiegazione}</span>
      </dt>
      <dd
        className={cn(
          "tabular shrink-0 font-medium",
          grande && "font-display text-lg font-semibold",
        )}
        data-testid={testId}
      >
        {children}
      </dd>
    </div>
  );
}
