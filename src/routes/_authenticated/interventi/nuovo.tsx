import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { ModuloPreventivo } from "@/components/modulo-preventivo";
import { creaIntervento } from "@/lib/interventi";

export const Route = createFileRoute("/_authenticated/interventi/nuovo")({
  head: () => ({
    meta: [
      { title: "Nuovo intervento — TurnoPronto" },
      {
        name: "description",
        content: "Crea un nuovo intervento di pulizia con il suo preventivo.",
      },
      { property: "og:title", content: "Nuovo intervento — TurnoPronto" },
      {
        property: "og:description",
        content: "Preventivo con calcolo automatico di costi, utile e margine.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NuovoIntervento,
});

function NuovoIntervento() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  return (
    <AppShell
      titolo="Nuovo intervento"
      sottotitolo="Inserisci il preventivo: costi, utile e margine si calcolano da soli."
    >
      <ModuloPreventivo
        etichettaInvio="Salva intervento"
        onSalva={async (dati) => {
          try {
            const id = await creaIntervento({ ...dati, appartamento: dati.appartamento.trim() });
            await queryClient.invalidateQueries({ queryKey: ["interventi"] });
            toast.success("Intervento salvato");
            navigate({ to: "/interventi/$id", params: { id } });
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Salvataggio non riuscito.");
          }
        }}
        onAnnulla={() => navigate({ to: "/interventi" })}
      />
    </AppShell>
  );
}
