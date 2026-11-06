import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { ClipboardList, LayoutDashboard, LogOut, PlusCircle } from "lucide-react";
import type { ReactNode } from "react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { profiloQuery } from "@/lib/interventi";

const voci = [
  {
    to: "/dashboard",
    etichetta: "Riepilogo",
    breve: "Riepilogo",
    icona: LayoutDashboard,
    esatto: true,
  },
  {
    to: "/interventi/nuovo",
    etichetta: "Nuovo intervento",
    breve: "Nuovo",
    icona: PlusCircle,
    esatto: true,
  },
  {
    to: "/interventi",
    etichetta: "Storico interventi",
    breve: "Storico",
    icona: ClipboardList,
    esatto: false,
  },
] as const;

function attiva(to: string, percorso: string) {
  if (to === "/interventi")
    return percorso.startsWith("/interventi") && percorso !== "/interventi/nuovo";
  return percorso === to;
}

function useEsci() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  return async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
}

export function AppShell({
  titolo,
  sottotitolo,
  azioni,
  children,
}: {
  titolo: string;
  sottotitolo?: string;
  azioni?: ReactNode;
  children: ReactNode;
}) {
  const { data: profilo } = useQuery(profiloQuery());
  const esci = useEsci();
  const percorso = useLocation({ select: (l) => l.pathname.replace(/\/+$/, "") || "/" });
  const nome = profilo?.nomeImpresa || profilo?.email || "";

  return (
    <div className="min-h-screen bg-background">
      {/* Menu laterale (computer) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="px-6 pb-6 pt-7">
          <Link to="/dashboard" aria-label="TurnoPronto, vai al riepilogo">
            <Logo tone="inverse" />
          </Link>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Menu principale">
          {voci.map((v) => (
            <Link
              key={v.to}
              to={v.to}
              data-attivo={attiva(v.to, percorso)}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[attivo=true]:bg-sidebar-accent data-[attivo=true]:text-sidebar-accent-foreground"
            >
              <v.icona className="size-[18px]" />
              {v.etichetta}
            </Link>
          ))}
        </nav>
        <div className="border-t border-sidebar-border px-4 py-4">
          <p className="text-xs text-sidebar-muted">Impresa</p>
          <p className="truncate text-sm font-semibold" title={nome}>
            {nome || "—"}
          </p>
          <button
            type="button"
            onClick={esci}
            className="mt-3 inline-flex items-center gap-2 text-sm text-sidebar-muted transition-colors hover:text-sidebar-foreground"
          >
            <LogOut className="size-4" /> Esci
          </button>
        </div>
      </aside>

      {/* Barra superiore (smartphone) */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-card/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/dashboard" aria-label="TurnoPronto, vai al riepilogo">
          <Logo />
        </Link>
        <Button variant="ghost" size="sm" onClick={esci} aria-label="Esci dall'account">
          <LogOut /> Esci
        </Button>
      </header>

      <div className="lg:pl-64">
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{titolo}</h1>
              {sottotitolo && <p className="mt-1 text-sm text-muted-foreground">{sottotitolo}</p>}
            </div>
            {azioni && <div className="flex flex-wrap gap-2">{azioni}</div>}
          </div>
          {children}
        </main>
      </div>

      {/* Navigazione in basso (smartphone) */}
      <nav
        className="pb-safe fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t bg-card lg:hidden"
        aria-label="Menu principale"
      >
        {voci.map((v) => (
          <Link
            key={v.to}
            to={v.to}
            data-attivo={attiva(v.to, percorso)}
            className="flex flex-col items-center gap-1 py-2.5 text-xs font-medium text-muted-foreground data-[attivo=true]:text-primary"
          >
            <v.icona className="size-5" />
            {v.breve}
          </Link>
        ))}
      </nav>
    </div>
  );
}
