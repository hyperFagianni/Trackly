# Play Console — passi dettagliati per il primo caricamento

Presuppone che tu abbia già: account sviluppatore Google Play attivo, GitHub Pages abilitato per `docs/privacy.html` (vedi README), e `android/app/build/outputs/bundle/release/app-release.aab` generato.

## A. Creare l'app

1. Vai su [play.google.com/console](https://play.google.com/console)
2. **Crea app** (Create app) dal dashboard
3. Compila:
   - Nome dell'app: `Trackly - Spedizioni` (modificabile dopo)
   - Lingua predefinita: Italiano
   - Tipo: App
   - Gratuita o a pagamento: **Gratuita**
   - Spunta le dichiarazioni richieste (Linee guida per gli sviluppatori, leggi export USA)
4. **Crea app**

## B. Scheda Play Store principale

Menu laterale → **Presenza sullo store** → **Scheda Play Store principale**:

1. Descrizione breve → incolla da [`listing-it.md`](./listing-it.md)
2. Descrizione completa → incolla da [`listing-it.md`](./listing-it.md)
3. Icona dell'app → carica `assets/icon.png` (1024×1024; se Play Console chiede esattamente 512×512, dimmelo e te lo ridimensiono)
4. Grafica in evidenza (1024×500) → carica `store/feature-graphic.png`
5. Screenshot telefono → minimo 2, consigliati 4-8 (mandameli quando li hai)
6. Categoria → **Strumenti** (alternativa: Shopping)
7. Dettagli di contatto → la tua email di supporto
8. Informativa sulla privacy → l'URL GitHub Pages (`https://hyperfagianni.github.io/Trackly/privacy.html`)
9. **Salva**

## C. Classificazione dei contenuti

Menu laterale → **Presenza sullo store** (o **Norme** a seconda della versione UI) → **Classificazione dei contenuti**:

1. Email di contatto
2. Categoria: la più vicina a "Utility/Produttività"
3. Questionario IARC — per Trackly rispondi **No** a tutto (violenza, contenuti sessuali, gioco d'azzardo, contenuti generati dagli utenti, condivisione posizione con altri utenti, ecc.) — vedi il dettaglio in [`listing-it.md`](./listing-it.md)
4. **Salva e invia** → riceverai una classificazione automatica (dovrebbe risultare "Per tutti"/PEGI 3)

## D. Sicurezza dei dati (Data safety)

Menu laterale → **Presenza sullo store** → **Sicurezza dei dati**:

Segui [`data-safety-it.md`](./data-safety-it.md) categoria per categoria — per Trackly quasi tutto è "Nessun dato raccolto". Poi:
- Dati cifrati in transito: **Sì**
- L'utente può richiedere l'eliminazione dei dati: **Sì** (si spiega che avviene eliminando la spedizione o disinstallando l'app)
- **Salva**

## E. Contenuti dell'app — altre dichiarazioni obbligatorie

Menu laterale → **Norme** → **Contenuti dell'app**, di solito include queste sotto-sezioni da completare tutte:
- **Annunci**: dichiara che l'app **non contiene** pubblicità (per ora — `ADS_ENABLED=false`)
- **Pubblico di destinazione e contenuti**: seleziona una fascia d'età generica per adulti/tutti, non un'app pensata specificamente per bambini
- **Contenuti generati dagli utenti**: non applicabile
- Le altre sezioni (COVID-19, contenuti governativi, ecc.) sono quasi certamente non applicabili — seleziona "No"/"Non applicabile" dove richiesto

Play Console non ti lascia procedere al rilascio finché tutte queste sezioni non hanno lo stato "Completato" nel pannello principale.

## F. Caricare l'AAB e avviare il test

Menu laterale → **Rilascio** (Release) → **Test** → **Test interno** (Internal testing — il più semplice per iniziare, fino a 100 tester, nessuna revisione preventiva):

1. **Crea nuova versione** (Create new release)
2. Carica `android/app/build/outputs/bundle/release/app-release.aab`
3. Note di rilascio: es. "Prima versione di test"
4. **Salva** → **Rivedi versione** (Review release)
5. Tab **Tester** dello stesso canale → crea una lista email (la tua, ed eventuali altri tester) → **Salva**
6. **Avvia il rollout in Test interno**

## G. Installare l'app come tester

Dopo l'attivazione, Play Console mostra un **link di partecipazione al test** (opt-in URL) sotto la tab Tester — condividilo (anche solo con te stesso) per poter installare l'app dal Play Store risultando come tester. Senza questo link l'app non è visibile a nessuno.

## H. Passaggio a produzione

Quando il test ti soddisfa, puoi promuovere la stessa build (o caricarne una nuova con `versionCode` più alto) al canale **Produzione**. Per un account sviluppatore nuovo, Google richiede tipicamente prima un periodo di **test chiuso** con almeno alcuni tester per un certo numero di giorni prima di sbloccare la produzione — i requisiti esatti li mostra Play Console stesso nel tuo caso specifico.

## Nota sulle versioni successive

Ogni nuovo AAB caricato deve avere un `versionCode` più alto del precedente (in `android/app/build.gradle`, o lascialo gestire a me). `eas.json` ha già `autoIncrement: true` per le build EAS; per le build locali te lo ricordo/aggiorno io a ogni rebuild.
