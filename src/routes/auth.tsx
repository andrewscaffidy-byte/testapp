import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Loader2, MailCheck } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { z } from "zod";

import { Campo } from "@/components/campo";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { messaggioErroreAccesso } from "@/lib/errori-accesso";
import { cn } from "@/lib/utils";

type Modo = "accesso" | "registrazione" | "recupero";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { modo?: Modo } => {
    const m = s["modo"];
    return m === "registrazione" || m === "recupero" || m === "accesso" ? { modo: m } : {};
  },
  head: () => ({
    meta: [
      { title: "Accedi o registra la tua impresa — TurnoPronto" },
      {
        name: "description",
        content: "Accedi a TurnoPronto o crea l'account della tua impresa di pulizie.",
      },
      { property: "og:title", content: "Accedi a TurnoPronto" },
      {
        property: "og:description",
        content: "Accesso e registrazione per imprese di pulizia di case vacanza.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaginaAccesso,
});

const emailSchema = z
  .string()
  .trim()
  .email("Inserisci un indirizzo email valido")
  .max(255, "Email troppo lunga");

const registrazioneSchema = z
  .object({
    nomeImpresa: z
      .string()
      .trim()
      .min(2, "Inserisci il nome dell'impresa")
      .max(120, "Massimo 120 caratteri"),
    email: emailSchema,
    password: z
      .string()
      .min(8, "La password deve avere almeno 8 caratteri")
      .max(72, "Massimo 72 caratteri"),
    conferma: z.string(),
  })
  .refine((v) => v.password === v.conferma, {
    path: ["conferma"],
    message: "Le password non coincidono",
  });

const accessoSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Inserisci la password"),
});

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z"
      />
      <path
        fill="#34A853"
        d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.3 1.1-3.8 1.1-2.9 0-5.4-2-6.3-4.6H2.1v2.8A11 11 0 0 0 12 23z"
      />
      <path fill="#FBBC05" d="M5.7 14.1a6.6 6.6 0 0 1 0-4.2V7.1H2.1a11 11 0 0 0 0 9.8l3.6-2.8z" />
      <path
        fill="#EA4335"
        d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.1-3.1A11 11 0 0 0 2.1 7.1l3.6 2.8C6.6 7.3 9.1 5.4 12 5.4z"
      />
    </svg>
  );
}

const campiVuoti = { nomeImpresa: "", email: "", password: "", conferma: "" };

function PaginaAccesso() {
  const { modo: modoIniziale } = Route.useSearch();
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>(modoIniziale ?? "accesso");
  const [campi, setCampi] = useState(campiVuoti);
  const [errori, setErrori] = useState<Partial<Record<keyof typeof campiVuoti, string>>>({});
  const [erroreGenerale, setErroreGenerale] = useState("");
  const [attesa, setAttesa] = useState(false);
  const [inviata, setInviata] = useState<"" | "conferma" | "recupero">("");

  useEffect(() => {
    let attivo = true;
    supabase.auth.getUser().then(({ data }) => {
      if (attivo && data.user) navigate({ to: "/dashboard", replace: true });
    });
    const { data } = supabase.auth.onAuthStateChange((evento, sessione) => {
      if (evento === "SIGNED_IN" && sessione) navigate({ to: "/dashboard", replace: true });
    });
    return () => {
      attivo = false;
      data.subscription.unsubscribe();
    };
  }, [navigate]);

  const set = (k: keyof typeof campi) => (v: string) => {
    setCampi((p) => ({ ...p, [k]: v }));
    if (errori[k]) setErrori((e) => ({ ...e, [k]: "" }));
  };

  const cambiaModo = (m: Modo) => {
    setModo(m);
    setErrori({});
    setErroreGenerale("");
    setInviata("");
  };

  async function invia(e: FormEvent) {
    e.preventDefault();
    setErroreGenerale("");
    setAttesa(true);
    try {
      if (modo === "registrazione") {
        const r = registrazioneSchema.safeParse(campi);
        if (!r.success) return setErrori(mappa(r.error));
        const { data, error } = await supabase.auth.signUp({
          email: r.data.email,
          password: r.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { nome_impresa: r.data.nomeImpresa },
          },
        });
        if (error) return setErroreGenerale(messaggioErroreAccesso(error.message));
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          return setErroreGenerale("Esiste già un account con questa email. Prova ad accedere.");
        }
        if (!data.session) setInviata("conferma");
      } else if (modo === "accesso") {
        const r = accessoSchema.safeParse(campi);
        if (!r.success) return setErrori(mappa(r.error));
        const { error } = await supabase.auth.signInWithPassword(r.data);
        if (error) return setErroreGenerale(messaggioErroreAccesso(error.message));
        navigate({ to: "/dashboard", replace: true });
      } else {
        const r = emailSchema.safeParse(campi.email);
        if (!r.success)
          return setErrori({ email: r.error.issues[0]?.message ?? "Email non valida" });
        const { error } = await supabase.auth.resetPasswordForEmail(r.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) return setErroreGenerale(messaggioErroreAccesso(error.message));
        setInviata("recupero");
      }
    } finally {
      setAttesa(false);
    }
  }

  async function accediConGoogle() {
    setErroreGenerale("");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/auth`,
    });
    if (result.error) {
      setErroreGenerale("Accesso con Google non riuscito. Riprova.");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/dashboard", replace: true });
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.1fr]">
      <div className="relative hidden bg-hero p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <Link to="/" aria-label="Torna alla pagina iniziale">
          <Logo tone="inverse" />
        </Link>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">
            Ogni intervento, con il suo margine reale.
          </h2>
          <p className="mt-4 opacity-85">
            Preventivo e consuntivo fianco a fianco, per capire quali appartamenti ti fanno
            guadagnare davvero.
          </p>
        </div>
        <p className="text-xs opacity-70">I dati della tua impresa sono visibili solo a te.</p>
      </div>

      <div className="flex flex-col items-center justify-center px-4 py-10 sm:px-8">
        <div className="mb-8 lg:hidden">
          <Link to="/">
            <Logo />
          </Link>
        </div>
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-card sm:p-8">
          {inviata ? (
            <div className="text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary">
                <MailCheck className="size-6" />
              </span>
              <h1 className="mt-4 text-xl font-semibold">Controlla la tua email</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {inviata === "conferma"
                  ? `Abbiamo inviato un link di conferma a ${campi.email}. Aprilo per attivare l'account, poi accedi.`
                  : `Se esiste un account per ${campi.email}, riceverai un link per impostare una nuova password.`}
              </p>
              <Button
                variant="outline"
                className="mt-6 w-full"
                onClick={() => cambiaModo("accesso")}
              >
                Torna all'accesso
              </Button>
            </div>
          ) : (
            <>
              {modo !== "recupero" && (
                <div className="mb-6 grid grid-cols-2 rounded-lg bg-muted p-1" role="tablist">
                  {(["accesso", "registrazione"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      role="tab"
                      aria-selected={modo === m}
                      onClick={() => cambiaModo(m)}
                      className={cn(
                        "rounded-md py-2 text-sm font-medium transition-colors",
                        modo === m
                          ? "bg-card text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {m === "accesso" ? "Accedi" : "Registrati"}
                    </button>
                  ))}
                </div>
              )}

              <h1 className="text-xl font-semibold">
                {modo === "accesso" && "Bentornato"}
                {modo === "registrazione" && "Crea l'account della tua impresa"}
                {modo === "recupero" && "Recupera la password"}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {modo === "accesso" && "Accedi per vedere i tuoi interventi."}
                {modo === "registrazione" && "Un account per ogni impresa. I dati restano privati."}
                {modo === "recupero" && "Ti invieremo un link per impostare una nuova password."}
              </p>

              <form onSubmit={invia} noValidate className="mt-6 space-y-4">
                {modo === "registrazione" && (
                  <Campo id="nomeImpresa" etichetta="Nome dell'impresa" errore={errori.nomeImpresa}>
                    <Input
                      id="nomeImpresa"
                      autoComplete="organization"
                      value={campi.nomeImpresa}
                      onChange={(e) => set("nomeImpresa")(e.target.value)}
                      className="h-11 text-base"
                      maxLength={120}
                    />
                  </Campo>
                )}
                <Campo id="email" etichetta="Email" errore={errori.email}>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={campi.email}
                    onChange={(e) => set("email")(e.target.value)}
                    className="h-11 text-base"
                  />
                </Campo>
                {modo !== "recupero" && (
                  <Campo
                    id="password"
                    etichetta="Password"
                    errore={errori.password}
                    aiuto={modo === "registrazione" ? "Almeno 8 caratteri." : undefined}
                  >
                    <Input
                      id="password"
                      type="password"
                      autoComplete={modo === "accesso" ? "current-password" : "new-password"}
                      value={campi.password}
                      onChange={(e) => set("password")(e.target.value)}
                      className="h-11 text-base"
                    />
                  </Campo>
                )}
                {modo === "registrazione" && (
                  <Campo id="conferma" etichetta="Conferma password" errore={errori.conferma}>
                    <Input
                      id="conferma"
                      type="password"
                      autoComplete="new-password"
                      value={campi.conferma}
                      onChange={(e) => set("conferma")(e.target.value)}
                      className="h-11 text-base"
                    />
                  </Campo>
                )}

                {erroreGenerale && (
                  <p
                    role="alert"
                    className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive"
                  >
                    {erroreGenerale}
                  </p>
                )}

                <Button type="submit" size="lg" className="h-11 w-full text-base" disabled={attesa}>
                  {attesa && <Loader2 className="animate-spin" />}
                  {modo === "accesso" && "Accedi"}
                  {modo === "registrazione" && "Crea account"}
                  {modo === "recupero" && "Invia link"}
                </Button>
              </form>

              {modo === "accesso" && (
                <button
                  type="button"
                  onClick={() => cambiaModo("recupero")}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  Password dimenticata?
                </button>
              )}
              {modo === "recupero" && (
                <button
                  type="button"
                  onClick={() => cambiaModo("accesso")}
                  className="mt-3 text-sm text-primary hover:underline"
                >
                  Torna all'accesso
                </button>
              )}

              {modo !== "recupero" && (
                <>
                  <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="h-px flex-1 bg-border" /> oppure{" "}
                    <span className="h-px flex-1 bg-border" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-11 w-full"
                    onClick={accediConGoogle}
                  >
                    <GoogleIcon /> Continua con Google
                  </Button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function mappa(err: z.ZodError): Partial<Record<keyof typeof campiVuoti, string>> {
  const out: Record<string, string> = {};
  for (const i of err.issues) {
    const k = String(i.path[0] ?? "");
    if (!out[k]) out[k] = i.message;
  }
  return out;
}
