import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Calculator, ClipboardCheck, ShieldCheck } from "lucide-react";

import heroImg from "@/assets/appartamento-pulito.jpg";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TurnoPronto — Quanto guadagni davvero su ogni pulizia" },
      {
        name: "description",
        content:
          "TurnoPronto aiuta le imprese di pulizia di Airbnb, B&B e case vacanza a confrontare costi previsti ed effettivi di ogni intervento.",
      },
      { property: "og:title", content: "TurnoPronto — Quanto guadagni davvero su ogni pulizia" },
      {
        property: "og:description",
        content:
          "Preventivo, consuntivo e margine reale di ogni intervento di pulizia, in un unico posto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const punti = [
  {
    icona: Calculator,
    titolo: "Preventivo in un minuto",
    testo: "Prezzo, ore-persona e costi: utile e margine si calcolano da soli.",
  },
  {
    icona: ClipboardCheck,
    titolo: "Consuntivo a fine lavoro",
    testo: "Inserisci ore e spese reali e vedi subito lo scostamento.",
  },
  {
    icona: ShieldCheck,
    titolo: "Dati riservati",
    testo: "Ogni impresa vede solo i propri interventi. Nessun dato degli ospiti.",
  },
];

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <Button asChild variant="ghost">
          <Link to="/auth">Accedi</Link>
        </Button>
      </header>

      <main className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:pt-12">
        <div>
          <p className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            Per imprese di pulizia di case vacanza
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight text-foreground sm:text-5xl">
            Scopri quanto guadagni davvero su ogni pulizia.
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Confronta il preventivo con il risultato effettivo di ogni intervento in appartamenti
            Airbnb, B&B e case vacanza.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-6 text-base">
              <Link to="/auth" search={{ modo: "registrazione" }}>
                Crea l'account della tua impresa <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-base">
              <Link to="/auth">Ho già un account</Link>
            </Button>
          </div>
        </div>
        <div className="relative">
          <img
            src={heroImg}
            alt="Appartamento per vacanze pulito e pronto per i nuovi ospiti"
            width={1280}
            height={960}
            className="aspect-[4/3] w-full rounded-3xl object-cover shadow-elevated"
          />
        </div>
      </main>

      <section className="border-t bg-card">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-12 sm:grid-cols-3 sm:px-6">
          {punti.map((p) => (
            <div key={p.titolo}>
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <p.icona className="size-5" />
              </span>
              <h2 className="mt-4 text-base font-semibold">{p.titolo}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.testo}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
