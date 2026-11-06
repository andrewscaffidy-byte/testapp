import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, ClipboardList, Euro, Percent, PlusCircle, Receipt } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { Indicatore, Riquadro, StatoBadge, tonoValore } from "@/components/indicatori";
import { Button } from "@/components/ui/button";
import { calcolaEffettivo, calcolaPreventivo, riepiloga } from "@/lib/calcoli";
import { formatDataBreve, formatEuro, formatEuroConSegno, formatPercentuale } from "@/lib/formato";
import { interventiQuery } from "@/lib/interventi";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Riepilogo — TurnoPronto" },
      {
        name: "description",
        content: "Interventi, ricavi, costi e margine medio della tua impresa.",
      },
      { property: "og:title", content: "Riepilogo — TurnoPronto" },
      { property: "og:description", content: "Interventi, ricavi, costi e margine medio." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(interventiQuery()),
  component: Dashboard,
});

function Dashboard() {
  const { data: interventi } = useSuspenseQuery(interventiQuery());
  const r = riepiloga(interventi);
  const recenti = interventi.slice(0, 5);
  const vuoto = interventi.length === 0;

  return (
    <AppShell
      titolo="Riepilogo"
      sottotitolo="Andamento economico dei tuoi interventi di pulizia."
      azioni={
        <Button asChild size="lg" className="h-11">
          <Link to="/interventi/nuovo">
            <PlusCircle /> Nuovo intervento
          </Link>
        </Button>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Indicatore
          etichetta="Interventi"
          valore={String(r.numeroInterventi)}
          nota={`${r.conConsuntivo} con costi reali inseriti`}
          icona={ClipboardList}
        />
        <Indicatore
          etichetta="Ricavi"
          valore={formatEuro(r.ricavi)}
          nota="Quanto hai incassato in totale"
          icona={Euro}
        />
        <Indicatore
          etichetta="Spese"
          valore={formatEuro(r.costi)}
          nota="Reali se inserite, altrimenti stimate"
          icona={Receipt}
        />
        <Indicatore
          etichetta="Margine medio"
          valore={formatPercentuale(r.margineMedio)}
          nota={`Guadagno ${formatEuro(r.utile)}. Su 100 € incassati, quanti ti restano`}
          icona={Percent}
          tono={vuoto ? "neutro" : tonoValore(r.margineMedio)}
        />
      </div>

      {vuoto ? (
        <Riquadro className="mt-6 flex flex-col items-center px-6 py-12 text-center">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <ClipboardList className="size-7" />
          </span>
          <h2 className="mt-5 text-lg font-semibold">Nessun intervento registrato</h2>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Crea il primo intervento con la stima dei costi. A lavoro finito potrai inserire ore e
            spese reali per vedere quanto hai guadagnato davvero.
          </p>
          <Button asChild size="lg" className="mt-6 h-11">
            <Link to="/interventi/nuovo">
              <PlusCircle /> Crea il primo intervento
            </Link>
          </Button>
        </Riquadro>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_300px]">
          <Riquadro className="p-0 sm:p-0">
            <div className="flex items-center justify-between px-5 pt-5 sm:px-6">
              <h2 className="text-base font-semibold">Ultimi interventi</h2>
              <Link to="/interventi" className="text-sm font-medium text-primary hover:underline">
                Vedi tutti
              </Link>
            </div>
            <ul className="mt-3 divide-y">
              {recenti.map((i) => {
                const eff = calcolaEffettivo(i);
                const ris = eff ?? calcolaPreventivo(i);
                return (
                  <li key={i.id}>
                    <Link
                      to="/interventi/$id"
                      params={{ id: i.id }}
                      className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted sm:px-6"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{i.appartamento}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {formatDataBreve(i.data)}{" "}
                          <StatoBadge completato={i.consuntivo_registrato} />
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="tabular font-semibold">{formatEuro(ris.utile)}</p>
                        <p className="tabular text-xs text-muted-foreground">
                          {eff ? "reale" : "previsto"} · {formatPercentuale(ris.margine)}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </Riquadro>

          <Riquadro>
            <h2 className="text-base font-semibold">Stima e realtà</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Quanto hai speso in più o in meno rispetto a quanto avevi stimato.
            </p>
            {r.conConsuntivo === 0 ? (
              <p className="mt-5 rounded-lg bg-muted px-3 py-3 text-sm text-muted-foreground">
                Nessun costo reale inserito. Apri un intervento e registra ore e spese reali.
              </p>
            ) : (
              <>
                <p
                  className={`tabular mt-5 font-display text-3xl font-semibold ${
                    r.scostamentoCosti > 0
                      ? "text-destructive"
                      : r.scostamentoCosti < 0
                        ? "text-success"
                        : ""
                  }`}
                >
                  {formatEuroConSegno(r.scostamentoCosti)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {r.scostamentoCosti > 0
                    ? "Hai speso più del previsto."
                    : r.scostamentoCosti < 0
                      ? "Hai speso meno del previsto."
                      : "Costi in linea con il previsto."}{" "}
                  Su {r.conConsuntivo} {r.conConsuntivo === 1 ? "intervento" : "interventi"}.
                </p>
              </>
            )}
          </Riquadro>
        </div>
      )}
    </AppShell>
  );
}
