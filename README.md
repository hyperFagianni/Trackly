# Trackly

App Expo/React Native per tracciare spedizioni di più corrieri in un'unica home, con notifiche locali per singola spedizione e un'estetica ispirata al "liquid glass" di Apple (glassmorphism, bordi smussati, superfici sfocate).

Costruita per restare **gratuita da gestire**: nessun server proprio necessario per il funzionamento di base (solo, opzionalmente, un piccolo proxy serverless a costo zero — vedi sotto), notifiche locali senza infrastruttura push, storage tutto sul device.

## Stack tecnico

- Expo SDK 54 (managed workflow) + React Native 0.81 + TypeScript + Expo Router
- `expo-sqlite` — persistenza locale delle spedizioni
- `expo-notifications` — notifiche locali (nessun server di push remoto)
- `expo-background-task` + `expo-task-manager` — controllo periodico dello stato ad app chiusa
- `expo-blur` + `expo-linear-gradient` — estetica "vetro smerigliato"
- `react-native-gesture-handler` + `react-native-reanimated` — gesture di swipe sulle card
- `@expo/vector-icons`, `expo-linking`, `expo-device`, `expo-font`, `expo-constants` — dipendenze di supporto standard dell'ecosistema Expo
- [17TRACK](https://www.17track.net) come aggregatore di tracciamento multi-corriere

**Tutte le librerie sopra funzionano dentro Expo Go** — nessuna richiede una development build. Verificato con `npx expo-doctor` (18/18 check superati) e con `npx tsc --noEmit` pulito.

## Avvio in sviluppo

```bash
npm install
npx expo start
```

Scansiona il QR code con l'app Expo Go (Android o iOS). Per testare il tracciamento reale, configura prima la tracking API (sezione successiva) — senza configurazione l'app funziona comunque (aggiunta/rimozione/swipe/notifiche locali di test), semplicemente le spedizioni restano con stato "In attesa di dati".

## Type-check e test

```bash
npm run typecheck   # tsc --noEmit, nessun errore
npm run test        # jest: logica di confronto stato e parsing risposte API
```

I test coprono i due punti più delicati della logica: `hasStatusChanged`/`buildStatusChangeNotification` (quando scatta una notifica e con che testo) e `parseTrackInfo` (interpretazione della risposta 17TRACK, inclusi input malformati/incompleti che non devono far crashare l'app).

## Dati di tracciamento: perché 17TRACK

Non esiste un'unica API pubblica gratuita che copra tutti i corrieri. [17TRACK](https://api.17track.net/en/doc) è l'aggregatore che usano anche molte app commerciali di questo tipo: copre migliaia di corrieri con un'unica integrazione, ha un piano gratuito, e la struttura a "corriere curato + estendibile" richiesta si adatta bene al suo modello (`carrier code` numerico per corriere).

**⚠️ Importante, scoperto durante lo sviluppo (agosto 2026):** 17TRACK ha cambiato la propria policy free il 7 gennaio 2026. Gli account creati prima di quella data hanno ancora 100 tracciamenti gratuiti al mese (rinnovo mensile). **I nuovi account (quindi il tuo, quando ti registrerai ora) ottengono invece 200 crediti gratuiti una tantum, non rinnovabili mensilmente.** Verifica i limiti aggiornati sul tuo pannello 17TRACK prima di affidarti al piano gratuito per un uso continuativo — potresti dover passare a un piano a pagamento se superi la soglia, oppure integrare in futuro le API dirette e gratuite di UPS/FedEx per quei due corrieri specifici.

Per conservare quota, l'app registra un numero di tracking una sola volta (alla creazione) e nei controlli successivi (pull-to-refresh, background task) chiama solo `gettrackinfo`, non `register` di nuovo.

### Come ottenere una chiave

1. Registrati su [17track.net/en/api](https://www.17track.net/en/api), verifica l'email, entra nel pannello.
2. Copia il token dalla sezione Impostazioni.
3. Configuralo con una delle due opzioni sotto.

### Configurazione: due opzioni (vedi `.env.example`)

**Opzione consigliata — proxy serverless.** La cartella [`/server`](./server) contiene un Cloudflare Worker minimale che tiene la chiave 17TRACK come secret lato server e la inoltra; l'app non la vede mai. Resta a costo zero (free tier Cloudflare Workers).

```bash
cd server
npm install
npx wrangler login
npx wrangler secret put TRACK17_API_KEY   # incolla qui la tua chiave 17TRACK
npm run deploy
```

Copia l'URL stampato da `wrangler deploy` (tipo `https://trackly-tracking-proxy.<tuo-subdomain>.workers.dev`) nel file `.env` dell'app:

```
EXPO_PUBLIC_TRACKING_PROXY_URL=https://trackly-tracking-proxy.<tuo-subdomain>.workers.dev
```

**Opzione più semplice, meno sicura — chiamata diretta dal client.** Salta il Worker e imposta invece:

```
EXPO_PUBLIC_TRACKING_API_KEY=la-tua-chiave-17track
```

Qualsiasi variabile con prefisso `EXPO_PUBLIC_` viene inclusa in chiaro nel bundle JS compilato — chiunque può estrarla decompilando l'APK. Accettabile per un progetto hobbistico di uso personale, non per una chiave che vuoi proteggere davvero.

Il codice che parla con 17TRACK è in `src/api/trackingClient.ts` e `src/config/env.ts`; il parsing della risposta è in `src/api/parseTrackInfo.ts`. **Nota di trasparenza:** il parsing è stato scritto sulla base della documentazione pubblica 17TRACK v2.4, non testato contro una risposta reale (in questo ambiente di sviluppo non era disponibile una chiave API). È scritto in modo difensivo (fallback a "stato sconosciuto" invece di eccezioni su campi mancanti/diversi), ma vale la pena verificarlo con un vero account non appena ne hai uno, e aggiustare la mappatura in `mapApiStatus`/`parseAcceptedItem` se la forma reale differisce.

## Corrieri inclusi

Lista curata iniziale (estendibile aggiungendo una voce in `src/config/carriers.ts` + un logo in `assets/carriers/`):

| Corriere | Codice 17TRACK |
|---|---|
| Poste Italiane | 9071 |
| BRT (Bartolini) | 100026 |
| GLS | 100024 |
| SDA Express Courier | 100019 |
| DHL | 100001 |
| UPS | 100002 |
| FedEx | 100003 |
| TNT | 100004 |
| Amazon Logistics | 100308 |

Codici incrociati con il file di riferimento pubblico 17TRACK (`apicarrier.all.json`) il 2026-08-17; 17TRACK lo aggiorna periodicamente, ri-verifica se un corriere smette di risolversi.

I loghi in `assets/carriers/` sono marchi delle rispettive aziende, scaricati da Wikimedia Commons e usati solo a scopo referenziale (identificare il corriere reale di ogni spedizione, come fa qualunque app di tracciamento) — dettagli e fonti in [`assets/carriers/NOTICE.md`](./assets/carriers/NOTICE.md). Prima di una pubblicazione non personale, sostituiscili con gli asset ufficiali dei rispettivi brand/press-kit.

## Notifiche e controllo in background

- Le notifiche sono **locali** (`expo-notifications`), programmate direttamente sul device — nessun server di push necessario, funzionano dentro Expo Go su Android e iOS.
- `expo-background-task` interroga periodicamente 17TRACK per le sole spedizioni con notifiche attive, confronta lo stato con l'ultimo salvato (`src/notifications/statusDiff.ts`) e fa scattare una notifica se è cambiato.
- **Limite onesto:** l'OS decide la cadenza, non è garantita — aspettati da qualche minuto a qualche ora tra un controllo e l'altro, non un aggiornamento istantaneo. È il prezzo per restare a costo zero senza un server che spinge notifiche push.
- **Su Expo Go, il background task funziona in pratica solo su Android.** iOS richiede permessi (`BGTaskScheduler`) che il binario precompilato di Expo Go non può dichiarare; su iOS in Expo Go l'app si aggiornerà comunque quando la apri o fai pull-to-refresh, ma non mentre è chiusa. Per il background reale su iOS serve una development build (`npx expo prebuild` + Xcode, o EAS Build con un dev client) — è un upgrade successivo, non richiesto per testare il resto dell'app in Expo Go.

## Estetica: "liquid glass" compatibile con Expo Go

Il vero Liquid Glass di Apple (iOS 26, `expo-glass-effect`) è un'API nativa iOS senza fallback reale su Android, e l'alternativa di terze parti per Android richiede una development build — in conflitto con il requisito di testare tutto in Expo Go. Qui l'effetto è simulato con `expo-blur` (superficie sfocata semi-trasparente, con blur reale anche su Android tramite `experimentalBlurMethod`) + bordo chiaro sottile + ombra morbida + leggero gradiente di sfondo (`expo-linear-gradient`) — vedi `src/components/GlassCard.tsx`. Non è il rendering nativo Apple, ma un glassmorphism curato e coerente su entrambe le piattaforme. Passare al vetro nativo vero su Android in futuro richiede una development build.

## Spazio pubblicitario (predisposto, disattivato)

`src/config/ads.ts` espone `ADS_ENABLED = false`. Il componente `src/components/AdSlot.tsx` legge questo flag e, se disattivato, non renderizza nulla — zero spazio, zero impatto visivo. Per attivarlo in futuro: imposta `ADS_ENABLED = true` e collega un SDK (es. Google AdMob) o un banner sponsor dentro `AdSlot`.

**Prima di attivarlo davvero** in produzione: serve una Consent Management Platform per il consenso GDPR (obbligatorio in UE) e il rispetto delle policy pubblicitarie di Google Play.

## Build per test su Google Play

Opzione A — EAS Build (gratuito, ~15 build Android/mese):
```bash
npm install -g eas-cli
eas login
eas build --platform android --profile preview
```
Genera un APK installabile direttamente (profilo `preview` in `eas.json`). Per l'AAB di produzione: `eas build --platform android --profile production`.

Opzione B — in locale:
```bash
npx expo prebuild
# poi apri /android in Android Studio, o esegui Gradle da riga di comando
```

Prima della pubblicazione in produzione su Google Play Console serve una fase di closed/internal testing (obbligatoria per i nuovi account sviluppatore personali).

Cambia `expo.android.package` / `expo.ios.bundleIdentifier` in `app.json` (attualmente `com.hyperfagianni.trackly`) se vuoi un identificativo diverso, e sostituisci le icone in `assets/` (attualmente quelle di default del template Expo) con un'identità grafica tua prima di pubblicare.

## Limitazioni note (riepilogo)

- **Ritardo notifiche in background:** non istantaneo, dipende dalla pianificazione del sistema operativo (minuti-ore); su iOS in Expo Go il background task di fatto non gira affatto (serve dev build).
- **Chiave API:** l'opzione diretta-dal-client è estraibile da un APK decompilato; l'opzione proxy (consigliata, già implementata in `/server`) evita il problema ma richiede un piccolo deploy Cloudflare Workers separato.
- **Quota 17TRACK:** i nuovi account hanno 200 crediti una tantum (non mensili) — verifica la tua situazione sul pannello 17TRACK.
- **Parsing risposta 17TRACK non testato live:** scritto da documentazione pubblica, difensivo ma da riverificare con un account reale.
- **Blur su Android:** `experimentalBlurMethod` di `expo-blur` è etichettato "experimental" da Expo stesso — può avere impatti di performance su liste lunghe.
- **Icone app:** ancora quelle di default del template Expo; da sostituire prima di una pubblicazione reale.

## Scelte fatte in autonomia (dove il prompt era ambiguo)

- **Tema chiaro fisso** (`userInterfaceStyle: "light"`), niente dark mode: il brief chiedeva esplicitamente una "palette chiara e pulita" in stile Apple; costruire due temi non era richiesto e avrebbe raddoppiato il lavoro sull'estetica senza un requisito esplicito.
- **Storico eventi salvato come colonna JSON** dentro la riga `shipments` in SQLite invece di una tabella separata: per il volume di dati di un tracker personale (poche spedizioni, decine di eventi ciascuna) una join non aggiunge valore, solo complessità.
- **Un solo `register` per spedizione** (alla creazione), poi solo `gettrackinfo`: scelta per conservare la quota 17TRACK ora molto più stretta del previsto (vedi sopra), dato che la doc ufficiale segnala il register come idempotente/richiamabile ma non è gratis in termini di quota.
- **Nessuna libreria aggiuntiva per generare ID** (niente `uuid`/`expo-crypto`): un generatore timestamp+random locale (`src/utils/id.ts`) basta per chiavi primarie locali non distribuite.
- **Swipe con gesture "aperta" persistente per riga** (ogni card gestisce il proprio stato, non c'è coordinamento "solo una aperta alla volta"): più semplice, comportamento comunque naturale per liste di questo tipo.
- **Package/bundle id** impostati a `com.hyperfagianni.trackly` (dal repo di destinazione) — cambiali in `app.json` se preferisci altro.

## Struttura del progetto

```
app/                    Schermate (Expo Router: home, add, dettaglio)
src/
  api/                  Client HTTP 17TRACK + parsing risposte
  background/           Task in background (expo-background-task)
  components/           UI riutilizzabile (card, glass, picker, timeline...)
  config/               Corrieri curati, flag ads, env, metadati stato
  db/                    SQLite (schema + repository spedizioni)
  notifications/         Servizio notifiche + logica diff stato (testata)
  sync/                  Motore di sincronizzazione condiviso (refresh manuale + background)
  theme/                 Design tokens (colori, spaziature, tipografia)
  types/                 Tipi condivisi
  utils/                 Formattazione date, id
server/                 Cloudflare Worker proxy opzionale (consigliato) per la chiave 17TRACK
assets/carriers/        Loghi corrieri + attribuzione
```
