import { describe, expect, it } from "vitest";

import {
  calcola,
  confronta,
  giudizio,
  marginePercentuale,
  prezzoConsigliato,
  prezzoMinimo,
  riepiloga,
  type InterventoCalcolabile,
} from "@/lib/calcoli";
import { leggiNumero } from "@/lib/formato";

const base: InterventoCalcolabile = {
  prezzo: 120,
  ore_previste: 3,
  costo_orario: 18,
  lavanderia_prevista: 15,
  materiali_previsti: 5,
  trasporto_previsto: 6,
  altri_previsti: 2,
  consuntivo_registrato: false,
  ore_effettive: null,
  costo_orario_effettivo: null,
  lavanderia_effettiva: null,
  materiali_effettivi: null,
  trasporto_effettivo: null,
  altri_effettivi: null,
};

describe("formule TurnoPronto", () => {
  it("costo totale = ore-persona × costo orario + lavanderia + materiali + trasporto + altri", () => {
    const r = calcola(120, {
      ore: 3,
      costoOrario: 18,
      lavanderia: 15,
      materiali: 5,
      trasporto: 6,
      altri: 2,
    });
    expect(r.costoManodopera).toBe(54);
    expect(r.costoTotale).toBe(82);
  });

  it("utile = prezzo concordato − costo totale", () => {
    const r = calcola(120, {
      ore: 3,
      costoOrario: 18,
      lavanderia: 15,
      materiali: 5,
      trasporto: 6,
      altri: 2,
    });
    expect(r.utile).toBe(38);
  });

  it("margine % = utile / prezzo × 100", () => {
    const r = calcola(120, {
      ore: 3,
      costoOrario: 18,
      lavanderia: 15,
      materiali: 5,
      trasporto: 6,
      altri: 2,
    });
    expect(r.margine).toBe(31.7);
  });

  it("con prezzo zero non divide per zero e il margine non è calcolabile", () => {
    expect(marginePercentuale(0, -50)).toBeNull();
    const r = calcola(0, {
      ore: 2,
      costoOrario: 20,
      lavanderia: 0,
      materiali: 0,
      trasporto: 0,
      altri: 0,
    });
    expect(r.utile).toBe(-40);
    expect(r.margine).toBeNull();
  });

  it("confronta preventivo ed effettivo: differenza di costo, utile reale e margine reale", () => {
    const c = confronta({
      ...base,
      consuntivo_registrato: true,
      ore_effettive: 4,
      costo_orario_effettivo: 18,
      lavanderia_effettiva: 15,
      materiali_effettivi: 7,
      trasporto_effettivo: 6,
      altri_effettivi: 0,
    });
    expect(c).not.toBeNull();
    expect(c!.effettivo.costoTotale).toBe(100);
    expect(c!.differenzaCosto).toBe(18);
    expect(c!.effettivo.utile).toBe(20);
    expect(c!.effettivo.margine).toBe(16.7);
    expect(c!.differenzaOre).toBe(1);
  });

  it("senza consuntivo non c'è confronto", () => {
    expect(confronta(base)).toBeNull();
  });

  it("riepilogo vuoto mostra zero", () => {
    const r = riepiloga([]);
    expect(r.numeroInterventi).toBe(0);
    expect(r.ricavi).toBe(0);
    expect(r.costi).toBe(0);
    expect(r.margineMedio).toBe(0);
  });

  it("riepilogo usa i costi effettivi quando registrati", () => {
    const r = riepiloga([
      base,
      {
        ...base,
        consuntivo_registrato: true,
        ore_effettive: 4,
        costo_orario_effettivo: 18,
        lavanderia_effettiva: 15,
        materiali_effettivi: 7,
        trasporto_effettivo: 6,
        altri_effettivi: 0,
      },
    ]);
    expect(r.ricavi).toBe(240);
    expect(r.costi).toBe(182);
    expect(r.utile).toBe(58);
    expect(r.margineMedio).toBe(24.2);
    expect(r.scostamentoCosti).toBe(18);
  });

  it("legge i numeri scritti con la virgola", () => {
    expect(leggiNumero("12,5")).toBe(12.5);
    expect(leggiNumero("1.234,50")).toBe(1234.5);
    expect(leggiNumero("")).toBe(0);
    expect(Number.isNaN(leggiNumero("abc"))).toBe(true);
    expect(Number.isNaN(leggiNumero("-3"))).toBe(true);
  });
});

describe("consigli", () => {
  const voci = { ore: 3, costoOrario: 18, lavanderia: 15, materiali: 5, trasporto: 6, altri: 2 };
  it("prezzo consigliato = costo / 0,7 arrotondato all'euro in su", () => {
    expect(prezzoConsigliato(82)).toBe(118);
    expect(prezzoMinimo(82.1)).toBe(83);
  });
  it("margine ≥ 30% conviene", () => {
    expect(giudizio(120, calcola(120, voci))).toBe("conviene");
  });
  it("margine sotto 30% conviene poco", () => {
    expect(giudizio(100, calcola(100, voci))).toBe("poco");
  });
  it("utile negativo o zero non conviene", () => {
    expect(giudizio(80, calcola(80, voci))).toBe("non_conviene");
    expect(giudizio(0, calcola(0, voci))).toBe("non_conviene");
  });
});
