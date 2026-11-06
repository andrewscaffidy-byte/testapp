# Margine Pulito

Crea una vera applicazione web chiamata TurnoPronto, interamente in italiano, responsive e ottimizzata soprattutto per smartphone e computer. È destinata a piccole imprese di pulizie con 2-10 addetti che lavorano per appartamenti Airbnb, B&B e case vacanza.

OBIETTIVO: aiutare il titolare a capire quanto guadagna realmente su ogni intervento di pulizia, confrontando costi preventivati e costi effettivi.

DESIGN: aspetto professionale, moderno, semplice e rassicurante. Colori verde petrolio, bianco e grigio chiaro. Menu laterale su desktop e navigazione semplice su smartphone. Tutti i testi devono essere in italiano. Non usare inglese nell'interfaccia.

FUNZIONI:

1. Pagina di accesso e registrazione per ogni impresa.

2. Dashboard iniziale con numero di interventi registrati, ricavi, costi e margine medio. Se non ci sono dati, mostra zero e uno stato vuoto, mai statistiche inventate.

3. Possibilità di creare un nuovo intervento indicando nome interno dell'appartamento, data, prezzo concordato, ore-persona previste, costo aziendale per ora-persona, lavanderia, materiali, trasporto e altri costi.

4. Calcolo automatico dei costi previsti, utile previsto e margine percentuale previsto.

5. Possibilità di inserire successivamente le ore e i costi effettivi dello stesso intervento.

6. Confronto chiaro tra preventivo e risultato effettivo: differenza di costo, utile reale e margine reale.

7. Storico degli interventi con ricerca e possibilità di modificarli o eliminarli.

FORMULE: costo totale = ore-persona × costo aziendale orario + lavanderia + materiali + trasporto + altri costi. Utile = prezzo concordato - costo totale. Margine percentuale = utile / prezzo concordato × 100. Se il prezzo è zero, non dividere per zero. Le ore devono essere ore-persona complessive della squadra.

DATI E SICUREZZA: usa Lovable Cloud per database e autenticazione. Ogni impresa deve avere un proprio account e può vedere esclusivamente i propri dati. Configura correttamente le regole di sicurezza e isolamento dei dati tra imprese. Non rendere pubblici i dati degli interventi. Non raccogliere dati personali degli ospiti degli appartamenti.

IMPORTANTE: crea un MVP realmente funzionante, non una semplice immagine o demo statica. Prima di concludere verifica che registrazione, accesso, salvataggio, modifica, eliminazione e calcoli funzionino. Non aggiungere pagamenti, abbonamenti o funzioni superflue. Non pubblicare ancora l'applicazione senza che io abbia verificato il risultato.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/52b9c697-a215-5870-9890-d997cd102a60).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
