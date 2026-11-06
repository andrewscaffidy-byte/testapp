import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { Campo } from "@/components/campo";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { messaggioErroreAccesso } from "@/lib/errori-accesso";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nuova password — TurnoPronto" },
      {
        name: "description",
        content: "Imposta una nuova password per il tuo account TurnoPronto.",
      },
      { property: "og:title", content: "Nuova password — TurnoPronto" },
      { property: "og:description", content: "Imposta una nuova password per il tuo account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: NuovaPassword,
});

function NuovaPassword() {
  const navigate = useNavigate();
  const [pronto, setPronto] = useState(false);
  const [password, setPassword] = useState("");
  const [conferma, setConferma] = useState("");
  const [errore, setErrore] = useState("");
  const [attesa, setAttesa] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "PASSWORD_RECOVERY" || evento === "SIGNED_IN") setPronto(true);
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session) setPronto(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function invia(e: FormEvent) {
    e.preventDefault();
    setErrore("");
    if (password.length < 8) return setErrore("La password deve avere almeno 8 caratteri.");
    if (password !== conferma) return setErrore("Le password non coincidono.");
    setAttesa(true);
    const { error } = await supabase.auth.updateUser({ password });
    setAttesa(false);
    if (error) return setErrore(messaggioErroreAccesso(error.message));
    toast.success("Password aggiornata");
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-10">
      <Link to="/" className="mb-8">
        <Logo />
      </Link>
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-card sm:p-8">
        <h1 className="text-xl font-semibold">Imposta una nuova password</h1>
        {!pronto ? (
          <p className="mt-2 text-sm text-muted-foreground">
            Apri questa pagina dal link ricevuto via email. Se il link è scaduto,{" "}
            <Link to="/auth" search={{ modo: "recupero" }} className="text-primary hover:underline">
              richiedine uno nuovo
            </Link>
            .
          </p>
        ) : (
          <form onSubmit={invia} noValidate className="mt-6 space-y-4">
            <Campo id="nuova" etichetta="Nuova password" aiuto="Almeno 8 caratteri.">
              <Input
                id="nuova"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 text-base"
              />
            </Campo>
            <Campo id="conferma-nuova" etichetta="Conferma password">
              <Input
                id="conferma-nuova"
                type="password"
                autoComplete="new-password"
                value={conferma}
                onChange={(e) => setConferma(e.target.value)}
                className="h-11 text-base"
              />
            </Campo>
            {errore && (
              <p
                role="alert"
                className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive"
              >
                {errore}
              </p>
            )}
            <Button type="submit" size="lg" className="h-11 w-full" disabled={attesa}>
              {attesa && <Loader2 className="animate-spin" />}
              Salva password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
