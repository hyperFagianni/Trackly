# Checklist pubblicazione Google Play (closed/internal testing)

## Fatto (da Claude)
- [x] Progetto collegato a EAS (`eas init`) — project ID in `app.json`
- [x] `eas.json` con profilo `production` (AAB, versionCode auto-incrementante)
- [x] Icona app, adaptive icon Android, favicon aggiornati con il tuo logo
- [x] Testo scheda Play Store pronto: [`store/listing-it.md`](./listing-it.md)
- [x] Bozza risposte Data Safety: [`store/data-safety-it.md`](./data-safety-it.md)
- [x] Feature graphic 1024×500: [`store/feature-graphic.png`](./feature-graphic.png)
- [x] Informativa privacy pronta per GitHub Pages: [`docs/privacy.html`](../docs/privacy.html)

## Bloccato, serve tu
- [ ] **Build EAS**: il piano gratuito ha già esaurito la quota build Android di questo mese (si rinnova l'1 settembre 2026). Opzioni:
  - Aspettare il rinnovo e poi lanciare `npx eas-cli build --platform android --profile production`
  - Passare a un piano EAS a pagamento (build immediata)
  - Build locale gratuita: richiede un JDK installato e `JAVA_HOME` configurato (l'Android SDK c'è già su questa macchina, ma manca un JDK raggiungibile) — poi `npx expo prebuild` + `cd android && ./gradlew bundleRelease`. Dimmi se vuoi che imposti questa strada, comporta installare/configurare un JDK sul tuo PC.
- [ ] **Account sviluppatore Google Play**: registrazione (una tantum, ~25$) su [play.google.com/console](https://play.google.com/console) — richiede i tuoi dati/pagamento, non automatizzabile da qui.
- [ ] **Abilitare GitHub Pages** per l'informativa privacy: Settings del repo → Pages → Source: "Deploy from a branch" → Branch: `main`, cartella `/docs` → Save. L'URL sarà `https://hyperfagianni.github.io/Trackly/privacy.html`.
- [ ] **Creare l'app in Play Console** e compilare:
  - Scheda store: incolla da [`store/listing-it.md`](./listing-it.md)
  - Sicurezza dei dati: segui [`store/data-safety-it.md`](./data-safety-it.md)
  - Questionario classificazione contenuti: risposte guidate in `listing-it.md`
  - URL informativa privacy: il link GitHub Pages qui sopra
  - Feature graphic e icona: file già pronti in `store/` e `assets/`
  - Screenshot: minimo 2 (consigliati 4-8) — mandameli quando li hai da un test reale sul telefono e li preparo/ritaglio
- [ ] **Caricare l'AAB** (una volta pronto) nel canale **Test interno** o **Test chiuso** — obbligatorio per i nuovi account sviluppatore personali prima della produzione
- [ ] **Aggiungere te stesso/i tester** come tester email nel canale di test scelto

## Nota sul bundle identifier
`com.hyperfagianni.trackly` è già impostato in `app.json`. Una volta caricato il primo AAB su Play Console, **non è più modificabile** per quell'app — verifica che ti vada bene prima di procedere.
