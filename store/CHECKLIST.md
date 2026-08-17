# Checklist pubblicazione Google Play (closed/internal testing)

## Fatto (da Claude)
- [x] Progetto collegato a EAS (`eas init`) — project ID in `app.json`
- [x] `eas.json` con profilo `production` (AAB, versionCode auto-incrementante)
- [x] Icona app, adaptive icon Android, favicon aggiornati con il tuo logo
- [x] Testo scheda Play Store pronto: [`store/listing-it.md`](./listing-it.md)
- [x] Bozza risposte Data Safety: [`store/data-safety-it.md`](./data-safety-it.md)
- [x] Feature graphic 1024×500: [`store/feature-graphic.png`](./feature-graphic.png)
- [x] Informativa privacy pronta per GitHub Pages: [`docs/privacy.html`](../docs/privacy.html)
- [x] **AAB di produzione buildato in locale** (quota EAS gratuita esaurita per questo mese, vedi sotto) — firmato con una keystore di release vera, non quella di debug. File: `android/app/build/outputs/bundle/release/app-release.aab` (~59 MB). Verificato che l'impronta SHA256 del certificato incorporato nell'AAB corrisponde esattamente a quella della keystore — firma corretta confermata.
- [x] JDK 17 (Temurin) e Android SDK configurati su questo PC per build locali future (`JAVA_HOME`/`ANDROID_HOME` impostati a livello utente)

## ⚠️ Keystore di release — leggi prima di continuare
Generata una keystore vera (non quella di debug, che Play Console rifiuta) in:
```
C:\Users\User\trackly-android-keystore\trackly-release.keystore
```
Password e alias salvati in chiaro in `C:\Users\User\trackly-android-keystore\CREDENTIALS-KEEP-SAFE.txt` — **spostali in un password manager e fai un backup del file `.keystore` stesso (cloud cifrato, chiavetta, ecc.) il prima possibile.** Se perdi questo file o le password, non potrai più pubblicare aggiornamenti per questa app su Play Store con lo stesso annuncio — Google non può recuperarlo per te.

Le credenziali sono anche in `C:\Users\User\.gradle\gradle.properties` (fuori dal repo, per permettere alla build Gradle di trovarle automaticamente).

**Nota tecnica:** la cartella `android/` è rigenerabile (`.gitignore`d, ricreata da `expo prebuild`). Se in futuro esegui `npx expo prebuild --clean`, la modifica che ho fatto ad `android/app/build.gradle` per usare questa keystore andrà perduta insieme al resto della cartella — dimmelo quando succede e la reimposto in un attimo (bastano poche righe).

## Bloccato, serve tu
- [ ] **Account sviluppatore Google Play**: fatto ✅ (mi hai detto di averlo già).
- [ ] **Abilitare GitHub Pages** per l'informativa privacy: Settings del repo → Pages → Source: "Deploy from a branch" → Branch: `main`, cartella `/docs` → Save. L'URL sarà `https://hyperfagianni.github.io/Trackly/privacy.html`.
- [ ] **Creare l'app in Play Console, compilare la scheda, e caricare l'AAB** — passi dettagliati punto per punto in [`store/play-console-steps-it.md`](./play-console-steps-it.md)
- [ ] Screenshot: minimo 2 (consigliati 4-8) — mandameli quando li hai da un test reale sul telefono e li preparo/ritaglio

## Per le prossime build (dopo la prima release)
Ora che JDK/Android SDK/keystore sono configurati su questo PC, per rigenerare l'AAB dopo modifiche al codice:
```bash
cd android
./gradlew bundleRelease
```
(assicurati che `JAVA_HOME`/`ANDROID_HOME` puntino a `C:\Program Files\Eclipse Adoptium\jdk-17.0.20.8-hotspot` e `%LOCALAPPDATA%\Android\Sdk` — sono già impostati a livello utente, ma questa sessione ha dovuto impostarli inline per via di come funziona questo ambiente). Ricorda di alzare `versionCode`/`versionName` in `android/app/build.gradle` (o lascia fare a me) prima di ogni nuovo upload.

## Nota sul bundle identifier
`com.hyperfagianni.trackly` è già impostato in `app.json`. Una volta caricato il primo AAB su Play Console, **non è più modificabile** per quell'app — verifica che ti vada bene prima di procedere.
