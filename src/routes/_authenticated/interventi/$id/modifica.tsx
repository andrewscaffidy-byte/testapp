import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { InterventoMancante } from "@/components/intervento-mancante";
import { ModuloPreventivo } from "@/components/modulo-preventivo";
import { aggiornaIntervento, interventoQuery } from "@/lib/interventi";

export const Route = createFileRoute("/_authenticated/interventi/$id/modifica")({
  head: () => ({
    meta: [
      { title: "Modifica intervento — TurnoPronto" },
      { name: "description", content: "Modifica i dati e il preventivo dell'intervento." },
      { property: "og:title", content: "Modifica intervento — TurnoPronto" },
      { property: "og:description", content: "Aggiorna data, prezzo e costi previsti." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context, params }) => context.queryClient.ensureQueryData(interventoQuery(params.id)),
  component: Modifica,
});

function Modifica() {
  const { id } = Route.useParams();
  const { data: i } = useSuspenseQuery(interventoQuery(id));
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  if (!i) return <InterventoMancante />;

  return (
    <AppShell titolo="Modifica intervento" sottotitolo={i.appartamento}>
      <ModuloPreventivo
        intervento={i}
        etichettaInvio="Salva modifiche"
        onSalva={async (dati) => {
          try {
            await aggiornaIntervento(id, { ...dati, appartamento: dati.appartamento.trim() });
            await queryClient.invalidateQueries({ queryKey: ["interventi"] });
            toast.success("Modifiche salvate");
            navigate({ to: "/interventi/$id", params: { id } });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Aggiornamento non riuscito.");
          }
        }}
        onAnnulla={() => navigate({ to: "/interventi/$id", params: { id } })}
      />
    </AppShell>
  );
}
