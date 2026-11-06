import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardList, Pencil, PlusCircle, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { ConfermaEliminazione } from "@/components/conferma-eliminazione";
import { GiudizioBadge, Riquadro, StatoBadge } from "@/components/indicatori";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { calcolaEffettivo, calcolaPreventivo } from "@/lib/calcoli";
import { formatDataBreve, formatEuro, formatPercentuale } from "@/lib/formato";
import { eliminaIntervento, interventiQuery, type Intervento } from "@/lib/interventi";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/interventi/")({
  head: () => ({
    meta: [
      { title: "Storico interventi — TurnoPronto" },
      {
        name: "description",
        content: "Cerca, modifica ed elimina gli interventi di pulizia registrati.",
      },
      { property: "og:title", content: "Storico interventi — TurnoPronto" },
      {
        property: "og:description",
        content: "Tutti gli interventi con preventivo e risultato effettivo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(interventiQuery()),
  component: Storico,
});

type Filtro = "tutti" | "preventivo" | "completati";

function Storico() {
  const { data: interventi } = useSuspenseQuery(interventiQuery());
  const queryClient = useQueryClient();
  const [ricerca, setRicerca] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("tutti");

  const filtrati = useMemo(() => {
    const q = ricerca.trim().toLowerCase();
    return interventi.filter((i) => {
      if (filtro === "preventivo" && i.consuntivo_registrato) return false;
      if (filtro === "completati" && !i.consuntivo_registrato) return false;
      if (!q) return true;
      return i.appartamento.toLowerCase().includes(q) || formatDataBreve(i.data).includes(q);
    });
  }, [interventi, ricerca, filtro]);

  async function elimina(i: Intervento) {
    try {
      await eliminaIntervento(i.id);
      await queryClient.invalidateQueries({ queryKey: ["interventi"] });
      toast.success("Intervento eliminato");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Eliminazione non riuscita.");
    }
  }

  return (
    <AppShell
      titolo="Storico interventi"
      sottotitolo={`${interventi.length} ${interventi.length === 1 ? "intervento registrato" : "interventi registrati"}`}
      azioni={
        <Button asChild size="lg" className="h-11">
          <Link to="/interventi/nuovo">
            <PlusCircle /> Nuovo intervento
          </Link>
        </Button>
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Cerca per appartamento o data (gg/mm/aaaa)"
            value={ricerca}
            onChange={(e) => setRicerca(e.target.value)}
            className="h-11 bg-card pl-9 text-base"
            aria-label="Cerca interventi"
          />
        </div>
        <div
          className="grid grid-cols-3 rounded-lg border bg-card p-1 text-sm"
          role="group"
          aria-label="Filtra per stato"
        >
          {(
            [
              ["tutti", "Tutti"],
              ["preventivo", "Da chiudere"],
              ["completati", "Chiusi"],
            ] as const
          ).map(([k, l]) => (
            <button
              key={k}
              type="button"
              aria-pressed={filtro === k}
              onClick={() => setFiltro(k)}
              className={cn(
                "rounded-md px-3 py-1.5 font-medium transition-colors",
                filtro === k
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {filtrati.length === 0 ? (
        <Riquadro className="flex flex-col items-center py-12 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <ClipboardList className="size-6" />
          </span>
          <h2 className="mt-4 font-semibold">
            {interventi.length === 0 ? "Nessun intervento registrato" : "Nessun risultato"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {interventi.length === 0
              ? "Crea il primo intervento per iniziare."
              : "Prova a cambiare la ricerca o il filtro."}
          </p>
        </Riquadro>
      ) : (
        <>
          {/* Tabella (computer) */}
          <Riquadro className="hidden overflow-hidden p-0 sm:p-0 md:block">
            <table className="w-full text-sm">
              <thead className="bg-muted text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">Appartamento</th>
                  <th className="px-3 py-3 font-medium">Data</th>
                  <th className="px-3 py-3 text-right font-medium">Prezzo</th>
                  <th className="px-3 py-3 text-right font-medium">Spese</th>
                  <th className="px-3 py-3 text-right font-medium">Guadagno</th>
                  <th className="px-3 py-3 text-right font-medium">Margine</th>
                  <th className="px-5 py-3 text-right font-medium">
                    <span className="sr-only">Azioni</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtrati.map((i) => {
                  const eff = calcolaEffettivo(i);
                  const ris = eff ?? calcolaPreventivo(i);
                  return (
                    <tr key={i.id} className="hover:bg-muted/60">
                      <td className="px-5 py-3.5">
                        <Link
                          to="/interventi/$id"
                          params={{ id: i.id }}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {i.appartamento}
                        </Link>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          <StatoBadge completato={i.consuntivo_registrato} />
                          <GiudizioBadge prezzo={i.prezzo} risultato={ris} />
                        </div>
                      </td>
                      <td className="tabular px-3 py-3.5 text-muted-foreground">
                        {formatDataBreve(i.data)}
                      </td>
                      <td className="tabular px-3 py-3.5 text-right">{formatEuro(i.prezzo)}</td>
                      <td className="tabular px-3 py-3.5 text-right">
                        {formatEuro(ris.costoTotale)}
                      </td>
                      <td
                        className={cn(
                          "tabular px-3 py-3.5 text-right font-semibold",
                          ris.utile < 0 && "text-destructive",
                        )}
                      >
                        {formatEuro(ris.utile)}
                      </td>
                      <td className="tabular px-3 py-3.5 text-right">
                        {formatPercentuale(ris.margine)}
                        <div className="text-xs text-muted-foreground">
                          {eff ? "reale" : "previsto"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <Button
                            asChild
                            variant="ghost"
                            size="icon"
                            aria-label={`Modifica ${i.appartamento}`}
                          >
                            <Link to="/interventi/$id/modifica" params={{ id: i.id }}>
                              <Pencil />
                            </Link>
                          </Button>
                          <ConfermaEliminazione
                            appartamento={i.appartamento}
                            onConferma={() => elimina(i)}
                          >
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`Elimina ${i.appartamento}`}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 />
                            </Button>
                          </ConfermaEliminazione>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Riquadro>

          {/* Schede (smartphone) */}
          <ul className="space-y-3 md:hidden">
            {filtrati.map((i) => {
              const eff = calcolaEffettivo(i);
              const ris = eff ?? calcolaPreventivo(i);
              return (
                <li key={i.id} className="rounded-2xl border bg-card p-4 shadow-card">
                  <Link to="/interventi/$id" params={{ id: i.id }} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{i.appartamento}</p>
                        <p className="text-xs text-muted-foreground">{formatDataBreve(i.data)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <StatoBadge completato={i.consuntivo_registrato} />
                        <GiudizioBadge prezzo={i.prezzo} risultato={ris} />
                      </div>
                    </div>
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <dt className="text-muted-foreground">Prezzo</dt>
                        <dd className="tabular font-medium">{formatEuro(i.prezzo)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">
                          Guadagno {eff ? "reale" : "previsto"}
                        </dt>
                        <dd
                          className={cn(
                            "tabular font-semibold",
                            ris.utile < 0 && "text-destructive",
                          )}
                        >
                          {formatEuro(ris.utile)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Margine</dt>
                        <dd className="tabular font-medium">{formatPercentuale(ris.margine)}</dd>
                      </div>
                    </dl>
                  </Link>
                  <div className="mt-3 flex gap-2 border-t pt-3">
                    <Button asChild variant="outline" size="sm" className="flex-1">
                      <Link to="/interventi/$id/modifica" params={{ id: i.id }}>
                        <Pencil /> Modifica
                      </Link>
                    </Button>
                    <ConfermaEliminazione
                      appartamento={i.appartamento}
                      onConferma={() => elimina(i)}
                    >
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-destructive hover:text-destructive"
                      >
                        <Trash2 /> Elimina
                      </Button>
                    </ConfermaEliminazione>
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </AppShell>
  );
}
