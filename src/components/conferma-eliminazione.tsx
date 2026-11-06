import { useState, type ReactNode } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";

export function ConfermaEliminazione({
  appartamento,
  onConferma,
  children,
}: {
  appartamento: string;
  onConferma: () => Promise<void>;
  children: ReactNode;
}) {
  const [aperto, setAperto] = useState(false);
  const [attesa, setAttesa] = useState(false);
  return (
    <AlertDialog open={aperto} onOpenChange={setAperto}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare questo intervento?</AlertDialogTitle>
          <AlertDialogDescription>
            L'intervento «{appartamento}» verrà eliminato definitivamente, insieme a preventivo e
            consuntivo.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={attesa}>Annulla</AlertDialogCancel>
          <AlertDialogAction
            className={buttonVariants({ variant: "destructive" })}
            disabled={attesa}
            onClick={async (e) => {
              e.preventDefault();
              setAttesa(true);
              try {
                await onConferma();
                setAperto(false);
              } finally {
                setAttesa(false);
              }
            }}
          >
            {attesa ? "Eliminazione…" : "Elimina"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
