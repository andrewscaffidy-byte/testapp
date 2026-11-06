import { useMemo, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";

import { CampoNumero } from "@/components/campo";
import { Consiglio } from "@/components/consiglio";
import { Riga } from "@/components/modulo-preventivo";
import { Riquadro } from "@/components/indicatori";
import { Button } from "@/components/ui/button";
import { calcola, calcolaPreventivo } from "@/lib/calcoli";
import {
  formatEuro,
  formatEuroConSegno,
  formatPercentuale,
  leggiNumero,
  numeroPerCampo,
} from "@/lib/formato";
import { consuntivoSchema, erroriDa, type Intervento } from "@/lib/interventi";

type Valori = {
  ore_effettive: string;
  costo_orario_effettivo: string;
  lavanderia_effettiva: string;
  materiali_effettivi: string;
  trasporto_effettivo: string;
  altri_effettivi: string;
};

export type DatiConsuntivo = {
  ore_effettive: number;
  costo_orario_effettivo: number;
  lavanderia_effettiva: number;
  materiali_effettivi: number;
  trasporto_effettivo: number;
  altri_effettivi: number;
};

const num = (s: string) => {
  const v = leggiNumero(s);
  return Number.isFinite(v) && v >= 0 ? v : 0;
};

export function ModuloConsuntivo({
  intervento: i,
  onSalva,
  onAnnulla,
}: {
  intervento: Intervento;
  onSalva: (dati: DatiConsuntivo) => Promise<void>;
  onAnnulla: () => void;
}) {
  const giaInserito = i.consuntivo_registrato;
  // Precompila con i valori già registrati o, la prima volta, con quelli del preventivo.
  const [valori, setValori] = useState<Valori>(() => ({
    ore_effettive: numeroPerCampo(giaInserito ? i.ore_effettive : i.ore_previste),
    costo_orario_effettivo: numeroPerCampo(
      giaInserito ? (i.costo_orario_effettivo ?? i.costo_orario) : i.costo_orario,
    ),
    lavanderia_effettiva: numeroPerCampo(
      giaInserito ? i.lavanderia_effettiva : i.lavanderia_prevista,
    ),
    materiali_effettivi: numeroPerCampo(giaInserito ? i.materiali_effettivi : i.materiali_previsti),
    trasporto_effettivo: numeroPerCampo(giaInserito ? i.trasporto_effettivo : i.trasporto_previsto),
    altri_effettivi: numeroPerCampo(giaInserito ? i.altri_effettivi : i.altri_previsti),
  }));
  const [errori, setErrori] = useState<Partial<Record<keyof Valori, string>>>({});
  const [invio, setInvio] = useState(false);

  const set = (k: keyof Valori) => (v: string) => {
    setValori((p) => ({ ...p, [k]: v }));
    if (errori[k]) setErrori((e) => ({ ...e, [k]: "" }));
  };

  const previsto = calcolaPreventivo(i);
  const effettivo = useMemo(
    () =>
      calcola(i.prezzo, {
        ore: num(valori.ore_effettive),
        costoOrario: num(valori.costo_orario_effettivo),
        lavanderia: num(valori.lavanderia_effettiva),
        materiali: num(valori.materiali_effettivi),
        trasporto: num(valori.trasporto_effettivo),
        altri: num(valori.altri_effettivi),
      }),
    [valori, i.prezzo],
  );
  const diff = effettivo.costoTotale - previsto.costoTotale;

  async function invia(e: FormEvent) {
    e.preventDefault();
    const r = consuntivoSchema.safeParse(valori);
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
          <h2 className="text-base font-semibold">Lavoro degli addetti (reale)</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Avevi previsto {numeroPerCampo(i.ore_previste) || "0"} ore. Somma le ore lavorate
            davvero da tutti gli addetti.
          </p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <CampoNumero
              id="ore_effettive"
              etichetta="Ore di lavoro totali"
              aiuto="Ore di tutti gli addetti messe insieme (ore-persona)"
              unita="h"
              valore={valori.ore_effettive}
              onChange={set("ore_effettive")}
              errore={errori.ore_effettive}
            />
            <CampoNumero
              id="costo_orario_effettivo"
              etichetta="Quanto ti costa un'ora di un addetto"
              aiuto="Paga, contributi e assicurazione"
              valore={valori.costo_orario_effettivo}
              onChange={set("costo_orario_effettivo")}
              errore={errori.costo_orario_effettivo}
            />
          </div>
        </Riquadro>
        <Riquadro>
          <h2 className="text-base font-semibold">Altre spese reali</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <CampoNumero
              id="lavanderia_effettiva"
              etichetta="Lavanderia"
              valore={valori.lavanderia_effettiva}
              onChange={set("lavanderia_effettiva")}
              errore={errori.lavanderia_effettiva}
              aiuto={`Previsto: ${formatEuro(i.lavanderia_prevista)}`}
            />
            <CampoNumero
              id="materiali_effettivi"
              etichetta="Materiali"
              valore={valori.materiali_effettivi}
              onChange={set("materiali_effettivi")}
              errore={errori.materiali_effettivi}
              aiuto={`Previsto: ${formatEuro(i.materiali_previsti)}`}
            />
            <CampoNumero
              id="trasporto_effettivo"
              etichetta="Trasporto"
              valore={valori.trasporto_effettivo}
              onChange={set("trasporto_effettivo")}
              errore={errori.trasporto_effettivo}
              aiuto={`Previsto: ${formatEuro(i.trasporto_previsto)}`}
            />
            <CampoNumero
              id="altri_effettivi"
              etichetta="Altre spese"
              valore={valori.altri_effettivi}
              onChange={set("altri_effettivi")}
              errore={errori.altri_effettivi}
              aiuto={`Previsto: ${formatEuro(i.altri_previsti)}`}
            />
          </div>
        </Riquadro>
      </div>

      <aside className="lg:sticky lg:top-8 lg:self-start">
        <div className="rounded-2xl bg-hero p-5 text-primary-foreground shadow-elevated sm:p-6">
          <p className="text-xs font-medium uppercase tracking-wide opacity-80">
            Risultato effettivo
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <Riga etichetta="Prezzo concordato" spiegazione="Quanto incassi dal cliente">
              {formatEuro(i.prezzo)}
            </Riga>
            <Riga etichetta="Spese reali" spiegazione="Addetti + tutte le altre spese">
              {formatEuro(effettivo.costoTotale)}
            </Riga>
            <Riga
              etichetta="Rispetto al previsto"
              spiegazione={
                diff > 0 ? "Hai speso di più" : diff < 0 ? "Hai speso di meno" : "Come previsto"
              }
            >
              {formatEuroConSegno(diff)}
            </Riga>
            <div className="border-t border-primary-foreground/20 pt-3">
              <Riga etichetta="Guadagno reale" spiegazione="Prezzo − spese reali (utile)" grande>
                {formatEuro(effettivo.utile)}
              </Riga>
            </div>
            <Riga
              etichetta="Margine reale"
              spiegazione="Su 100 € incassati, quanti ti restano"
              grande
            >
              {formatPercentuale(effettivo.margine)}
            </Riga>
          </dl>
        </div>
        <Consiglio className="mt-4" prezzo={i.prezzo} risultato={effettivo} reale />
        <div className="mt-4 flex flex-col gap-2">
          <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={invio}>
            {invio && <Loader2 className="animate-spin" />}
            Salva costi reali
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-12 w-full"
            onClick={onAnnulla}
          >
            Annulla
          </Button>
        </div>
      </aside>
    </form>
  );
}
