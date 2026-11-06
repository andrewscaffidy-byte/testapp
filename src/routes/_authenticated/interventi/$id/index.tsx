import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ClipboardCheck, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { ConfermaEliminazione } from "@/components/conferma-eliminazione";
import { Consiglio } from "@/components/consiglio";
import { Indicatore, Riquadro, StatoBadge, tonoValore } from "@/components/indicatori";
import { InterventoMancante } from "@/components/intervento-mancante";
import { Button } from "@/components/ui/button";
import {
  arrotonda,
  calcolaPreventivo,
  confronta,
  vociEffettive,
  vociPreviste,
} from "@/lib/calcoli";
import {
  formatData,
  formatEuro,
  formatEuroConSegno,
  formatOre,
  formatPercentuale,
} from "@/lib/formato";
import { eliminaIntervento, interventoQuery } from "@/lib/interventi";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/interventi/$id/")({
  head: () => ({
    meta: [
      { title: "Dettaglio intervento — TurnoPronto" },
      {
        name: "description",
        content: "Confronto tra preventivo e risultato effettivo dell'intervento.",
      },
      { property: "og:title", content: "Dettaglio intervento — TurnoPronto" },
      { property: "og:description", content: "Differenza di costo, utile reale e margine reale." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(interventoQuery(params.id)),
  component: Dettaglio,
});

function Dettaglio() {
  const { id } = Route.useParams();
  const { data: i } = useSuspenseQuery(interventoQuery(id));
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  if (!i) return <InterventoMancante />;

  const previsto = calcolaPreventivo(i);
  const c = confronta(i);
  const vp = vociPreviste(i);
  const ve = vociEffettive(i);

  async function elimina() {
    try {
      await eliminaIntervento(id);
      queryClient.removeQueries({ queryKey: ["interventi", id] });
      await queryClient.invalidateQueries({ queryKey: ["interventi"] });
      toast.success("Intervento eliminato");
      navigate({ to: "/interventi" });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eliminazione non riuscita.");
    }
  }

  const righe: { voce: string; prev: number; eff: number | null; ore?: boolean }[] = [
    { voce: "Ore di lavoro totali", prev: vp.ore, eff: ve?.ore ?? null, ore: true },
    { voce: "Costo di un'ora", prev: vp.costoOrario, eff: ve?.costoOrario ?? null },
    {
      voce: "Costo degli addetti",
      prev: previsto.costoManodopera,
      eff: c?.effettivo.costoManodopera ?? null,
    },
    { voce: "Lavanderia", prev: vp.lavanderia, eff: ve?.lavanderia ?? null },
    { voce: "Materiali", prev: vp.materiali, eff: ve?.materiali ?? null },
    { voce: "Trasporto", prev: vp.trasporto, eff: ve?.trasporto ?? null },
    { voce: "Altre spese", prev: vp.altri, eff: ve?.altri ?? null },
  ];

  return (
    <AppShell
      titolo={i.appartamento}
      sottotitolo={`Intervento del ${formatData(i.data)}`}
      azioni={
        <>
          <Button asChild variant="outline">
            <Link to="/interventi/$id/modifica" params={{ id }}>
              <Pencil /> Modifica stima
            </Link>
          </Button>
          <ConfermaEliminazione appartamento={i.appartamento} onConferma={elimina}>
            <Button variant="outline" className="text-destructive hover:text-destructive">
              <Trash2 /> Elimina
            </Button>
          </ConfermaEliminazione>
        </>
      }
    >
      <Link
        to="/interventi"
        className="-mt-2 mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Storico interventi
      </Link>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <StatoBadge completato={i.consuntivo_registrato} />
        <span className="text-sm text-muted-foreground">
          Prezzo concordato{" "}
          <strong className="tabular text-foreground">{formatEuro(i.prezzo)}</strong>
        </span>
      </div>

      {c ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Indicatore
            etichetta="Spese rispetto alla stima"
            valore={formatEuroConSegno(c.differenzaCosto)}
            nota={
              c.differenzaCosto > 0
                ? "Speso più del previsto"
                : c.differenzaCosto < 0
                  ? "Speso meno del previsto"
                  : "In linea con il previsto"
            }
            tono={
              c.differenzaCosto > 0 ? "negativo" : c.differenzaCosto < 0 ? "positivo" : "neutro"
            }
          />
          <Indicatore
            etichetta="Guadagno reale"
            valore={formatEuro(c.effettivo.utile)}
            nota={`Prezzo − spese. Previsto ${formatEuro(c.previsto.utile)}`}
            tono={tonoValore(c.effettivo.utile)}
          />
          <Indicatore
            etichetta="Margine reale"
            valore={formatPercentuale(c.effettivo.margine)}
            nota={`Su 100 € incassati, quanti ti restano. Previsto ${formatPercentuale(c.previsto.margine)}`}
            tono={tonoValore(c.effettivo.margine)}
          />
          <Indicatore
            etichetta="Spese reali"
            valore={formatEuro(c.effettivo.costoTotale)}
            nota={`Previsto ${formatEuro(c.previsto.costoTotale)}`}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            <Indicatore
              etichetta="Spese previste"
              valore={formatEuro(previsto.costoTotale)}
              nota="Addetti + tutte le altre spese"
            />
            <Indicatore
              etichetta="Guadagno previsto"
              valore={formatEuro(previsto.utile)}
              nota="Prezzo − spese"
              tono={tonoValore(previsto.utile)}
            />
            <Indicatore
              etichetta="Margine previsto"
              valore={formatPercentuale(previsto.margine)}
              nota="Su 100 € incassati, quanti ti restano"
              tono={tonoValore(previsto.margine)}
            />
          </div>
          <Riquadro className="mt-4 flex flex-col gap-4 border-primary/30 bg-primary-soft sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-semibold">Lavoro concluso?</h2>
              <p className="text-sm text-muted-foreground">
                Inserisci ore e spese reali per sapere quanto hai guadagnato davvero.
              </p>
            </div>
            <Button asChild size="lg" className="h-11 shrink-0">
              <Link to="/interventi/$id/consuntivo" params={{ id }}>
                <ClipboardCheck /> Inserisci costi reali
              </Link>
            </Button>
          </Riquadro>
        </>
      )}

      <Consiglio
        className="mt-6"
        prezzo={i.prezzo}
        risultato={c ? c.effettivo : previsto}
        reale={!!c}
      />

      <Riquadro className="mt-6 overflow-hidden p-0 sm:p-0">
        <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
          <div>
            <h2 className="text-base font-semibold">Stima e realtà a confronto</h2>
            <p className="text-xs text-muted-foreground">
              In rosso quello che è andato peggio del previsto, in verde quello che è andato meglio.
            </p>
          </div>
          {c && (
            <Button asChild variant="outline" size="sm">
              <Link to="/interventi/$id/consuntivo" params={{ id }}>
                <Pencil /> Modifica costi reali
              </Link>
            </Button>
          )}
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[13px] sm:text-sm">
            <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium sm:px-6">Voce</th>
                <th className="px-2 py-2.5 text-right font-medium sm:px-3">Previsto</th>
                <th className="px-2 py-2.5 text-right font-medium sm:px-3">Reale</th>
                <th className="px-4 py-2.5 text-right font-medium sm:px-6">
                  <span className="sm:hidden">Diff.</span>
                  <span className="hidden sm:inline">Differenza</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {righe.map((r) => {
                const d = r.eff === null ? null : arrotonda(r.eff - r.prev);
                const fmt = r.ore ? formatOre : formatEuro;
                return (
                  <tr key={r.voce}>
                    <td className="px-4 py-3 sm:px-6">{r.voce}</td>
                    <td className="tabular px-2 py-3 text-right sm:px-3">{fmt(r.prev)}</td>
                    <td className="tabular px-2 py-3 text-right sm:px-3">
                      {r.eff === null ? "—" : fmt(r.eff)}
                    </td>
                    <td
                      className={cn(
                        "tabular px-4 py-3 text-right sm:px-6",
                        d !== null && d > 0 && "text-destructive",
                        d !== null && d < 0 && "text-success",
                      )}
                    >
                      {d === null
                        ? "—"
                        : r.ore
                          ? `${d > 0 ? "+" : ""}${formatOre(d)}`
                          : formatEuroConSegno(d)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 font-semibold">
              <tr>
                <td className="px-4 py-3 sm:px-6">Spese totali</td>
                <td className="tabular px-2 py-3 text-right sm:px-3">
                  {formatEuro(previsto.costoTotale)}
                </td>
                <td className="tabular px-2 py-3 text-right sm:px-3">
                  {c ? formatEuro(c.effettivo.costoTotale) : "—"}
                </td>
                <td
                  className={cn(
                    "tabular px-4 py-3 text-right sm:px-6",
                    c && c.differenzaCosto > 0 && "text-destructive",
                    c && c.differenzaCosto < 0 && "text-success",
                  )}
                >
                  {c ? formatEuroConSegno(c.differenzaCosto) : "—"}
                </td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-3 sm:px-6">Guadagno</td>
                <td className="tabular px-2 py-3 text-right sm:px-3">
                  {formatEuro(previsto.utile)}
                </td>
                <td className="tabular px-2 py-3 text-right sm:px-3">
                  {c ? formatEuro(c.effettivo.utile) : "—"}
                </td>
                <td
                  className={cn(
                    "tabular px-4 py-3 text-right sm:px-6",
                    c && c.differenzaUtile < 0 && "text-destructive",
                    c && c.differenzaUtile > 0 && "text-success",
                  )}
                >
                  {c ? formatEuroConSegno(c.differenzaUtile) : "—"}
                </td>
              </tr>
              <tr className="border-t">
                <td className="px-4 py-3 sm:px-6">Margine</td>
                <td className="tabular px-2 py-3 text-right sm:px-3">
                  {formatPercentuale(previsto.margine)}
                </td>
                <td className="tabular px-2 py-3 text-right sm:px-3">
                  {c ? formatPercentuale(c.effettivo.margine) : "—"}
                </td>
                <td className="tabular px-4 py-3 text-right sm:px-6">
                  {c && c.previsto.margine !== null && c.effettivo.margine !== null
                    ? `${c.effettivo.margine - c.previsto.margine > 0 ? "+" : ""}${formatPercentuale(arrotonda(c.effettivo.margine - c.previsto.margine, 1)).replace(" %", " punti")}`
                    : "—"}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        {previsto.margine === null && (
          <p className="px-5 pb-5 text-xs text-muted-foreground sm:px-6">
            Il prezzo concordato è zero: il margine percentuale non si può calcolare.
          </p>
        )}
      </Riquadro>
    </AppShell>
  );
}
