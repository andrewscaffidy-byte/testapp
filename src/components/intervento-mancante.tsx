import { Link } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { Riquadro } from "@/components/indicatori";
import { Button } from "@/components/ui/button";

export function InterventoMancante() {
  return (
    <AppShell titolo="Intervento non trovato">
      <Riquadro className="py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Questo intervento non esiste o è stato eliminato.
        </p>
        <Button asChild className="mt-5">
          <Link to="/interventi">Vai allo storico</Link>
        </Button>
      </Riquadro>
    </AppShell>
  );
}
