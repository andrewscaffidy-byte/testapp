const euro = new Intl.NumberFormat("it-IT", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const numero = new Intl.NumberFormat("it-IT", { maximumFractionDigits: 2 });

export function formatEuro(valore: number): string {
  return euro.format(Number.isFinite(valore) ? valore : 0);
}

export function formatEuroConSegno(valore: number): string {
  if (valore > 0) return `+${formatEuro(valore)}`;
  return formatEuro(valore);
}

export function formatNumero(valore: number): string {
  return numero.format(Number.isFinite(valore) ? valore : 0);
}

export function formatOre(valore: number): string {
  return `${formatNumero(valore)} h`;
}

export function formatPercentuale(valore: number | null): string {
  if (valore === null) return "Non calcolabile";
  return `${new Intl.NumberFormat("it-IT", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(valore)} %`;
}

export function formatData(iso: string): string {
  const [a, m, g] = iso.split("-").map(Number);
  if (!a || !m || !g) return iso;
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(a, m - 1, g));
}

export function formatDataBreve(iso: string): string {
  const [a, m, g] = iso.split("-").map(Number);
  if (!a || !m || !g) return iso;
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(a, m - 1, g));
}

export function oggiISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const gg = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${gg}`;
}

/**
 * Converte un numero scritto all'italiana ("1.234,50", "12,5", "12.5") in number.
 * Restituisce 0 per stringa vuota e NaN se non valido.
 */
export function leggiNumero(testo: string): number {
  let s = testo.trim().replace(/\s|€/g, "");
  if (s === "") return 0;
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(",", ".");
  }
  if (!/^\d+(\.\d+)?$/.test(s)) return Number.NaN;
  return Number(s);
}

/** Valore numerico da mostrare in un campo modificabile (virgola decimale). */
export function numeroPerCampo(valore: number | null | undefined): string {
  if (valore === null || valore === undefined) return "";
  return String(valore).replace(".", ",");
}
