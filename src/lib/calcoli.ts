/**
 * Formule economiche di TurnoPronto.
 *
 * costo totale = ore-persona × costo aziendale orario + lavanderia + materiali + trasporto + altri costi
 * utile        = prezzo concordato − costo totale
 * margine %    = utile / prezzo concordato × 100  (non calcolabile se il prezzo è zero)
 *
 * Le ore sono sempre ore-persona complessive della squadra.
 */

export interface VociCosto {
  ore: number;
  costoOrario: number;
  lavanderia: number;
  materiali: number;
  trasporto: number;
  altri: number;
}

export interface Risultato {
  costoManodopera: number;
  costoTotale: number;
  utile: number;
  /** null quando il prezzo concordato è zero (divisione non possibile) */
  margine: number | null;
}

export interface InterventoCalcolabile {
  prezzo: number;
  ore_previste: number;
  costo_orario: number;
  lavanderia_prevista: number;
  materiali_previsti: number;
  trasporto_previsto: number;
  altri_previsti: number;
  consuntivo_registrato: boolean;
  ore_effettive: number | null;
  costo_orario_effettivo: number | null;
  lavanderia_effettiva: number | null;
  materiali_effettivi: number | null;
  trasporto_effettivo: number | null;
  altri_effettivi: number | null;
}

const n = (v: number | null | undefined) => {
  const x = Number(v ?? 0);
  return Number.isFinite(x) ? x : 0;
};

/** Arrotonda al centesimo evitando errori di virgola mobile. */
export function arrotonda(valore: number, decimali = 2): number {
  const f = 10 ** decimali;
  return Math.round((valore + Number.EPSILON) * f) / f;
}

export function costoManodopera(ore: number, costoOrario: number): number {
  return arrotonda(n(ore) * n(costoOrario));
}

export function costoTotale(v: VociCosto): number {
  return arrotonda(
    n(v.ore) * n(v.costoOrario) + n(v.lavanderia) + n(v.materiali) + n(v.trasporto) + n(v.altri),
  );
}

export function utile(prezzo: number, costo: number): number {
  return arrotonda(n(prezzo) - n(costo));
}

export function marginePercentuale(prezzo: number, utileValore: number): number | null {
  const p = n(prezzo);
  if (p === 0) return null;
  return arrotonda((n(utileValore) / p) * 100, 1);
}

export function calcola(prezzo: number, v: VociCosto): Risultato {
  const totale = costoTotale(v);
  const u = utile(prezzo, totale);
  return {
    costoManodopera: costoManodopera(v.ore, v.costoOrario),
    costoTotale: totale,
    utile: u,
    margine: marginePercentuale(prezzo, u),
  };
}

export function vociPreviste(i: InterventoCalcolabile): VociCosto {
  return {
    ore: n(i.ore_previste),
    costoOrario: n(i.costo_orario),
    lavanderia: n(i.lavanderia_prevista),
    materiali: n(i.materiali_previsti),
    trasporto: n(i.trasporto_previsto),
    altri: n(i.altri_previsti),
  };
}

export function vociEffettive(i: InterventoCalcolabile): VociCosto | null {
  if (!i.consuntivo_registrato) return null;
  return {
    ore: n(i.ore_effettive),
    costoOrario: i.costo_orario_effettivo == null ? n(i.costo_orario) : n(i.costo_orario_effettivo),
    lavanderia: n(i.lavanderia_effettiva),
    materiali: n(i.materiali_effettivi),
    trasporto: n(i.trasporto_effettivo),
    altri: n(i.altri_effettivi),
  };
}

export function calcolaPreventivo(i: InterventoCalcolabile): Risultato {
  return calcola(i.prezzo, vociPreviste(i));
}

export function calcolaEffettivo(i: InterventoCalcolabile): Risultato | null {
  const v = vociEffettive(i);
  return v ? calcola(i.prezzo, v) : null;
}

export interface Confronto {
  previsto: Risultato;
  effettivo: Risultato;
  /** effettivo − previsto: positivo = si è speso di più */
  differenzaCosto: number;
  /** effettivo − previsto: negativo = si è guadagnato di meno */
  differenzaUtile: number;
  differenzaOre: number;
}

export function confronta(i: InterventoCalcolabile): Confronto | null {
  const effettivo = calcolaEffettivo(i);
  if (!effettivo) return null;
  const previsto = calcolaPreventivo(i);
  return {
    previsto,
    effettivo,
    differenzaCosto: arrotonda(effettivo.costoTotale - previsto.costoTotale),
    differenzaUtile: arrotonda(effettivo.utile - previsto.utile),
    differenzaOre: arrotonda(n(i.ore_effettive) - n(i.ore_previste)),
  };
}

export interface Riepilogo {
  numeroInterventi: number;
  conConsuntivo: number;
  ricavi: number;
  /** costi effettivi dove registrati, altrimenti previsti */
  costi: number;
  utile: number;
  /** utile totale / ricavi totali × 100; 0 se non ci sono interventi, null se i ricavi sono zero */
  margineMedio: number | null;
  /** somma degli scostamenti di costo sui soli interventi con consuntivo */
  scostamentoCosti: number;
}

export function riepiloga(interventi: InterventoCalcolabile[]): Riepilogo {
  let ricavi = 0;
  let costi = 0;
  let scostamento = 0;
  let conConsuntivo = 0;
  for (const i of interventi) {
    ricavi += n(i.prezzo);
    const prev = calcolaPreventivo(i);
    const eff = calcolaEffettivo(i);
    if (eff) {
      conConsuntivo += 1;
      costi += eff.costoTotale;
      scostamento += eff.costoTotale - prev.costoTotale;
    } else {
      costi += prev.costoTotale;
    }
  }
  ricavi = arrotonda(ricavi);
  costi = arrotonda(costi);
  const u = utile(ricavi, costi);
  return {
    numeroInterventi: interventi.length,
    conConsuntivo,
    ricavi,
    costi,
    utile: u,
    margineMedio: interventi.length === 0 ? 0 : marginePercentuale(ricavi, u),
    scostamentoCosti: arrotonda(scostamento),
  };
}

/* ---------- Consigli ---------- */

/** Margine che consideriamo "sano" per un intervento di pulizia. */
export const MARGINE_OBIETTIVO = 30;

export type Giudizio = "conviene" | "poco" | "non_conviene" | "nessuno";

/**
 * conviene: margine ≥ 30% · poco: margine tra 0 e 30% (escluso) · non_conviene: utile ≤ 0 con costi > 0
 * nessuno: prezzo e costi a zero (niente da valutare)
 */
export function giudizio(prezzo: number, r: Risultato): Giudizio {
  if (n(prezzo) === 0 && r.costoTotale === 0) return "nessuno";
  if (r.utile <= 0) return "non_conviene";
  if (r.margine !== null && r.margine >= MARGINE_OBIETTIVO) return "conviene";
  return "poco";
}

/** Prezzo da chiedere per ottenere il margine obiettivo: costo / (1 − margine/100), arrotondato all'euro in su. */
export function prezzoConsigliato(costo: number, margine = MARGINE_OBIETTIVO): number {
  const c = n(costo);
  if (c <= 0) return 0;
  return Math.ceil(arrotonda(c / (1 - margine / 100)));
}

/** Prezzo minimo per non andare in perdita (copre solo i costi), arrotondato all'euro in su. */
export function prezzoMinimo(costo: number): number {
  return Math.ceil(arrotonda(n(costo)));
}
