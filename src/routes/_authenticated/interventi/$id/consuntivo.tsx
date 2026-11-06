import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { InterventoMancante } from "@/components/intervento-mancante";
import { ModuloConsuntivo } from "@/components/modulo-consuntivo";
import { formatData } from "@/lib/formato";
import { aggiornaIntervento, interventoQuery } from "@/lib/interventi";

export const Route = createFileRoute("/_authenticated/interventi/$id/consuntivo")({
  head: () => ({
    meta: [
      { title: "Costi reali intervento — TurnoPronto" },
      { name: "description", content: "Inserisci ore-persona e costi effettivi dell'intervento." },
      { property: "og:title", content: "Costi reali intervento — TurnoPronto" },
      {
        property: "og:description",
        content: "Ore e costi reali per calcolare utile e margine effettivi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(interventoQuery(params.id)),
  component: Consuntivo,
});

function Consuntivo() {
  const { id } = Route.useParams();
  const { data: i } = useSuspenseQuery(interventoQuery(id));
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!i) return <InterventoMancante />;

  return (
    <AppShell
      titolo={i.consuntivo_registrato ? "Modifica costi reali" : "Inserisci costi reali"}
      sottotitolo={`${i.appartamento} · ${formatData(i.data)}`}
    >
      <ModuloConsuntivo
        intervento={i}
        onSalva={async (dati) => {
          try {
            await aggiornaIntervento(id, { ...dati, consuntivo_registrato: true });
            await queryClient.invalidateQueries({ queryKey: ["interventi"] });
            toast.success("Costi reali salvati");
            navigate({ to: "/interventi/$id", params: { id } });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Salvataggio non riuscito.");
          }
        }}
        onAnnulla={() => navigate({ to: "/interventi/$id", params: { id } })}
      />
    </AppShell>
  );
}
