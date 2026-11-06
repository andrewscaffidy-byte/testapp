import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { leggiNumero } from "@/lib/formato";

export type Intervento = Database["public"]["Tables"]["interventi"]["Row"];
export type NuovoIntervento = Database["public"]["Tables"]["interventi"]["Insert"];
export type ModificaIntervento = Database["public"]["Tables"]["interventi"]["Update"];

export const interventiQuery = () =>
  queryOptions({
    queryKey: ["interventi"],
    queryFn: async (): Promise<Intervento[]> => {
      const { data, error } = await supabase
        .from("interventi")
        .select("*")
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw new Error("Impossibile caricare gli interventi.");
      return data ?? [];
    },
  });

export const interventoQuery = (id: string) =>
  queryOptions({
    queryKey: ["interventi", id],
    queryFn: async (): Promise<Intervento | null> => {
      const { data, error } = await supabase
        .from("interventi")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      if (error) throw new Error("Impossibile caricare l'intervento.");
      return data;
    },
  });

export const profiloQuery = () =>
  queryOptions({
    queryKey: ["profilo"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("profiles")
        .select("nome_impresa")
        .eq("id", u.user.id)
        .maybeSingle();
      return { email: u.user.email ?? "", nomeImpresa: data?.nome_impresa ?? "" };
    },
  });

export async function creaIntervento(valori: NuovoIntervento) {
  const { data, error } = await supabase.from("interventi").insert(valori).select("id").single();
  if (error) throw new Error("Salvataggio non riuscito. Riprova.");
  return data.id;
}

export async function aggiornaIntervento(id: string, valori: ModificaIntervento) {
  const { error } = await supabase.from("interventi").update(valori).eq("id", id);
  if (error) throw new Error("Aggiornamento non riuscito. Riprova.");
}

export async function eliminaIntervento(id: string) {
  const { error } = await supabase.from("interventi").delete().eq("id", id);
  if (error) throw new Error("Eliminazione non riuscita. Riprova.");
}

/* ---------- Validazione dei moduli ---------- */

const MASSIMO = 999999;

export const campoImporto = (etichetta: string) =>
  z
    .string()
    .max(20, `${etichetta}: valore troppo lungo`)
    .transform((s) => leggiNumero(s))
    .refine((v) => !Number.isNaN(v), `${etichetta}: inserisci un numero valido (es. 12,50)`)
    .refine((v) => v >= 0, `${etichetta}: il valore non può essere negativo`)
    .refine((v) => v <= MASSIMO, `${etichetta}: valore troppo alto`);

export const preventivoSchema = z.object({
  appartamento: z
    .string()
    .trim()
    .min(1, "Inserisci il nome interno dell'appartamento")
    .max(120, "Il nome può avere al massimo 120 caratteri"),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Inserisci una data valida"),
  prezzo: campoImporto("Prezzo concordato"),
  ore_previste: campoImporto("Ore-persona previste"),
  costo_orario: campoImporto("Costo per ora-persona"),
  lavanderia_prevista: campoImporto("Lavanderia"),
  materiali_previsti: campoImporto("Materiali"),
  trasporto_previsto: campoImporto("Trasporto"),
  altri_previsti: campoImporto("Altri costi"),
});

export const consuntivoSchema = z.object({
  ore_effettive: campoImporto("Ore-persona effettive"),
  costo_orario_effettivo: campoImporto("Costo per ora-persona"),
  lavanderia_effettiva: campoImporto("Lavanderia"),
  materiali_effettivi: campoImporto("Materiali"),
  trasporto_effettivo: campoImporto("Trasporto"),
  altri_effettivi: campoImporto("Altri costi"),
});

export type ErroriCampi = Record<string, string>;

export function erroriDa(err: z.ZodError): ErroriCampi {
  const out: ErroriCampi = {};
  for (const issue of err.issues) {
    const k = String(issue.path[0] ?? "");
    if (!out[k]) out[k] = issue.message;
  }
  return out;
}
