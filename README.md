# Trackly

App Expo/React Native per tracciare spedizioni di più corrieri in un'unica home, con notifiche locali per singola spedizione e un'estetica ispirata al "liquid glass" di Apple (glassmorphism, bordi smussati, superfici sfocate).

Costruita per restare **gratuita per sempre**: zero aggregatori a quota limitata — solo API dirette dei singoli corrieri (dove esistono gratis) o un semplice link al sito ufficiale del corriere altrimenti. Nessun server proprio necessario per il funzionamento di base (solo, opzionalmente, un piccolo proxy serverless a costo zero — vedi sotto), notifiche locali senza infrastruttura push, storage tutto sul device.

## Stack tecnico

- Expo SDK 54 (managed workflow) + React Native 0.81 + TypeScript + Expo Router
- `expo-sqlite` — persistenza locale delle spedizioni
- `expo-notifications` — notifiche locali (nessun server di push remoto)
- `expo-background-task` + `expo-task-manager` — controllo periodico dello stato ad app chiusa
- `expo-blur` + `expo-linear-gradient` — estetica "vetro smerigliato"
- `react-native-gesture-handler` + `react-native-reanimated` — gesture di swipe sulle card
- `expo-clipboard` — copia il numero di tracking prima di aprire il sito di un corriere senza API
- `@expo/vector-icons`, `expo-linking`, `expo-device`, `expo-font`, `expo-constants` — dipendenze di supporto standard dell'ecosistema Expo
- API dirette di **UPS**, **FedEx** e **DHL** per il tracciamento live (nessun aggregatore terzo)
- `react-dom` + `react-native-web` — build web (Vercel), stessa base di codice di Android/iOS

**Tutte le librerie sopra funzionano dentro Expo Go** — nessuna richiede una development build. Verificato con `npx expo-doctor` (18/18 check superati) e con `npx tsc --noEmit` pulito.

## Avvio in sviluppo

```bash
npm install
npx expo start
```

Scansiona il QR code con l'app Expo Go (Android o iOS). Per testare il tracciamento live, configura prima la tracking API (sezione successiva) — senza configurazione l'app funziona comunque (aggiunta/rimozione/swipe/notifiche locali di test), semplicemente le spedizioni UPS/FedEx/DHL restano con stato "In attesa di dati".

## Type-check e test

```bash
npm run typecheck   # tsc --noEmit, nessun errore
npm run test        # jest: logica di confronto stato e parsing risposte delle 3 API
```

I test coprono i punti più delicati della logica: `hasStatusChanged`/`buildStatusChangeNotification` (quando scatta una notifica e con che testo), il parsing di ciascuna delle tre risposte API (UPS/FedEx/DHL, inclusi input malformati/incompleti che non devono far crashare l'app) e l'encoder base64 usato per l'autenticazione UPS.

## Dati di tracciamento: solo API dirette dei corrieri, niente aggregatori

Niente 17TRACK né altri aggregatori multi-corriere: quelli hanno tutti una quota gratuita limitata (crediti una tantum o rinnovo mensile con tetto basso), quindi non sono "gratis per sempre" in senso stretto. Al loro posto, Trackly integra **solo i corrieri che offrono davvero un'API di tracciamento gratuita, self-service, senza bisogno di un contratto commerciale**:

| Corriere | API diretta | Verificato il |
|---|---|---|
| **UPS** | [developer.ups.com](https://developer.ups.com) — Track API, OAuth2 | 2026-08-17 |
| **FedEx** | [developer.fedex.com](https://developer.fedex.com) — Track API v1, OAuth2, 100.000 richieste/giorno gratis | 2026-08-17 |
| **DHL** | [developer.dhl.com](https://developer.dhl.com) — Unified Tracking API, chiave API semplice, 250 richieste/giorno gratis | 2026-08-17 |

**Tutti gli altri corrieri comuni in Italia — Poste Italiane, BRT, GLS, SDA, TNT (ormai rete FedEx), Amazon Logistics, InPost, Vinted Go — richiedono un contratto/account business per accedere alla loro API di tracciamento.** Non esiste per loro un'opzione self-service gratuita, verificato direttamente sui rispettivi siti/portali sviluppatore. Integrarli scraping i loro siti sarebbe l'unica alternativa, ma è esattamente ciò che il vincolo "legale" di questo progetto esclude.

**La soluzione adottata:** questi corrieri restano comunque nell'app — puoi aggiungerli, rinominarli, eliminarli, vederli nella home con il loro logo — ma invece di uno stato live, aprendo la spedizione trovi un pulsante che copia il numero di tracking negli appunti e apre la pagina di ricerca spedizioni ufficiale del corriere nel browser. Zero notifiche automatiche per questi (non c'è nulla da confrontare), ma restano organizzati in un unico posto. Vedi `src/config/carriers.ts` (campo `trackingMode: 'api' | 'external'`) e la schermata "i" nell'app per il dettaglio.

**Nota di trasparenza sulle tre API dirette:** UPS, FedEx e DHL sono state verificate come "self-serve gratis" tramite i loro portali/documentazione pubblica, ma il parsing delle risposte (`src/api/providers/{ups,fedex,dhl}.ts`) è stato scritto sulla base della documentazione pubblica, non testato contro un account reale (non disponibile in questo ambiente di sviluppo). È scritto in modo difensivo (fallback a "stato sconosciuto" invece di eccezioni su campi mancanti/diversi), ma vale la pena verificarlo con le tue credenziali reali e aggiustare le funzioni `mapXStatus`/`parseXResponse` se la forma reale differisce leggermente.

### Come ottenere le credenziali

- **UPS:** crea un profilo UPS.com gratuito (basta un account spedizioni personale, nessun contratto business) su [developer.ups.com](https://developer.ups.com), registra un'app, ottieni `client_id`/`client_secret`.
- **FedEx:** registrati su [developer.fedex.com](https://developer.fedex.com), crea un progetto, ottieni `client_id`/`client_secret` (la Track API base è gratuita).
- **DHL:** registrati con la sola email su [developer.dhl.com](https://developer.dhl.com), sottoscrivi "Shipment Tracking - Unified Tracking API", ottieni una `DHL-API-Key`.

Puoi configurare anche solo uno o due di questi tre — le spedizioni dei corrieri non configurati mostrano semplicemente "API non configurata" invece di rompere il resto dell'app.

### Configurazione: due opzioni (vedi `.env.example`)

**Opzione consigliata — proxy serverless.** La cartella [`/server`](./server) contiene un Cloudflare Worker minimale che tiene le credenziali di tutti e tre i corrieri come secret lato server e le inoltra; l'app non le vede mai. Resta a costo zero (free tier Cloudflare Workers).

```bash
cd server
npm install
npx wrangler login
npx wrangler secret put UPS_CLIENT_ID
npx wrangler secret put UPS_CLIENT_SECRET
npx wrangler secret put FEDEX_CLIENT_ID
npx wrangler secret put FEDEX_CLIENT_SECRET
npx wrangler secret put DHL_API_KEY
npm run deploy
```

Copia l'URL stampato da `wrangler deploy` (tipo `https://trackly-tracking-proxy.<tuo-subdomain>.workers.dev`) nel file `.env` dell'app:

```
EXPO_PUBLIC_TRACKING_PROXY_URL=https://trackly-tracking-proxy.<tuo-subdomain>.workers.dev
```

**Opzione più semplice, meno sicura — chiamata diretta dal client.** Salta il Worker e imposta invece le credenziali dirette (vedi `.env.example` per i nomi esatti delle variabili). Qualsiasi variabile con prefisso `EXPO_PUBLIC_` viene inclusa in chiaro nel bundle JS compilato — chiunque può estrarla decompilando l'APK. Accettabile per un progetto hobbistico di uso personale, non per credenziali che vuoi proteggere davvero.

## Corrieri inclusi

| Corriere | Modalità |
|---|---|
| UPS | 🟢 Tracking live |
| FedEx | 🟢 Tracking live |
| DHL | 🟢 Tracking live |
| Poste Italiane | 🔗 Link al sito ufficiale |
| BRT (Bartolini) | 🔗 Link al sito ufficiale |
| GLS | 🔗 Link al sito ufficiale |
| SDA Express Courier | 🔗 Link al sito ufficiale |
| TNT | 🔗 Link al sito ufficiale (ormai rete FedEx) |
| Amazon Logistics | 🔗 Link al sito ufficiale (richiede login Amazon) |
| InPost | 🔗 Link al sito ufficiale |
| Vinted Go | 🔗 Link al sito ufficiale |

Estendibile aggiungendo una voce in `src/config/carriers.ts` (+ un logo in `assets/carriers/`) — sia per un nuovo corriere "link al sito", sia per uno nuovo con API diretta gratuita (in tal caso serve anche un nuovo file in `src/api/providers/`).

I loghi in `assets/carriers/` sono marchi delle rispettive aziende, scaricati da Wikimedia Commons e usati solo a scopo referenziale (identificare il corriere reale di ogni spedizione, come fa qualunque app di tracciamento) — dettagli e fonti in [`assets/carriers/NOTICE.md`](./assets/carriers/NOTICE.md). Vinted Go non ha un logo proprio distinto su Commons: viene usato il marchio Vinted (Vinted Go è il servizio di spedizione di Vinted stessa). Prima di una pubblicazione non personale, sostituisci questi loghi con gli asset ufficiali dei rispettivi brand/press-kit.

## Notifiche e controllo in background

- Le notifiche sono **locali** (`expo-notifications`), programmate direttamente sul device — nessun server di push necessario, funzionano dentro Expo Go su Android e iOS.
- `expo-background-task` interroga periodicamente UPS/FedEx/DHL per le sole spedizioni **con tracking live e notifiche attive**, confronta lo stato con l'ultimo salvato (`src/notifications/statusDiff.ts`) e fa scattare una notifica se è cambiato. Le spedizioni "link al sito" sono escluse automaticamente (non c'è nulla da interrogare).
- **Limite onesto:** l'OS decide la cadenza, non è garantita — aspettati da qualche minuto a qualche ora tra un controllo e l'altro, non un aggiornamento istantaneo. È il prezzo per restare a costo zero senza un server che spinge notifiche push.
- **Su Expo Go, il background task funziona in pratica solo su Android.** iOS richiede permessi (`BGTaskScheduler`) che il binario precompilato di Expo Go non può dichiarare; su iOS in Expo Go l'app si aggiornerà comunque quando la apri o fai pull-to-refresh, ma non mentre è chiusa. Per il background reale su iOS serve una development build (`npx expo prebuild` + Xcode, o EAS Build con un dev client) — è un upgrade successivo, non richiesto per testare il resto dell'app in Expo Go.

## Estetica: "liquid glass" compatibile con Expo Go

Il vero Liquid Glass di Apple (iOS 26, `expo-glass-effect`) è un'API nativa iOS senza fallback reale su Android, e l'alternativa di terze parti per Android richiede una development build — in conflitto con il requisito di testare tutto in Expo Go. Qui l'effetto è simulato con `expo-blur` (superficie sfocata semi-trasparente, con blur reale anche su Android tramite `experimentalBlurMethod`) + bordo chiaro sottile + ombra morbida + leggero gradiente di sfondo (`expo-linear-gradient`) — vedi `src/components/GlassCard.tsx`. Non è il rendering nativo Apple, ma un glassmorphism curato e coerente su entrambe le piattaforme. Passare al vetro nativo vero su Android in futuro richiede una development build.

## Spazio pubblicitario (predisposto, disattivato)

`src/config/ads.ts` espone `ADS_ENABLED = false`. Il componente `src/components/AdSlot.tsx` legge questo flag e, se disattivato, non renderizza nulla — zero spazio, zero impatto visivo. Per attivarlo in futuro: imposta `ADS_ENABLED = true` e collega un SDK (es. Google AdMob) o un banner sponsor dentro `AdSlot`.

**Prima di attivarlo davvero** in produzione: serve una Consent Management Platform per il consenso GDPR (obbligatorio in UE) e il rispetto delle policy pubblicitarie di Google Play.

## Come funziona (dentro l'app)

C'è un pulsante "i" in alto a sinistra nella home che apre una schermata con la spiegazione completa per l'utente finale: cos'è l'app, come aggiungere una spedizione, cosa significano le gesture di swipe, la differenza tra corrieri "tracking live" e "link al sito", i limiti delle notifiche in background, e l'elenco corrieri aggiornato in automatico da `src/config/carriers.ts`.

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

Cambia `expo.android.package` / `expo.ios.bundleIdentifier` in `app.json` (attualmente `com.hyperfagianni.trackly`) se vuoi un identificativo diverso prima di pubblicare — le icone in `assets/` sono già la tua identità grafica, non più quelle di default del template Expo.

Materiali già pronti per la scheda Play Store (testo, Data Safety, feature graphic, checklist) in [`store/`](./store), informativa privacy pronta per GitHub Pages in [`docs/`](./docs).

## App web (Vercel) — invece dell'account sviluppatore iOS

Stessa base di codice, nessuna cartella duplicata: Expo Router esporta anche per il web con `npx expo export --platform web`. Verificato di persona (build + smoke test in un browser reale) che l'app gira su web praticamente senza modifiche:

- **SQLite funziona anche su web** tramite l'implementazione WASM di `expo-sqlite` (bundle `wa-sqlite`) — richiede solo `metro.config.js` (già incluso) per far riconoscere a Metro i file `.wasm`, e gli header `Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` (necessari per la persistenza via OPFS) — già configurati sia nel dev server (`metro.config.js`) sia per il deploy (`vercel.json`).
- Gesture di swipe, glass UI, carrier picker, tutto renderizza correttamente su web (`expo-blur`, `expo-linear-gradient`, `react-native-gesture-handler`/`reanimated` hanno tutti un'implementazione web).
- **Compromesso onesto e inevitabile:** `expo-background-task` non ha un equivalente sul web (nessun concetto di "processo in background" per una pagina), quindi è disattivato lì (`Platform.OS === 'web'` in `src/background/backgroundTask.ts`) — la versione web si aggiorna con pull-to-refresh manuale, non con notifiche automatiche ad app chiusa. Avere anche lì notifiche push richiederebbe un server che le invia, in contrasto con l'ethos "gratis per sempre, zero server" di tutto il resto del progetto.
- **Icona corretta anche su "Aggiungi a Home" (iOS/Android/desktop)**: `app/+html.tsx` inietta `manifest.json` + `apple-touch-icon`/icone (in `public/`, generate dalla stessa `assets/icon.png` usata per lo store) nell'head della pagina, così chi salva Trackly sulla home da Safari/Chrome vede il logo reale invece di uno screenshot generico. Richiede `web.output: "static"` in `app.json` — Expo Router ignora `+html.tsx` nel default `"single"` (SPA) — ma non cambia il routing lato client: `vercel.json` reindirizza comunque tutto su `index.html`.

### Deploy su Vercel (gratuito)

Opzione consigliata — collega il repo GitHub direttamente dalla dashboard Vercel (redeploy automatico a ogni push):
1. [vercel.com/new](https://vercel.com/new) → importa `hyperFagianni/Trackly`
2. Vercel legge `vercel.json` da solo (build command, output dir, header COOP/COEP) — nessuna configurazione manuale necessaria
3. Deploy

Oppure da riga di comando:
```bash
npm install -g vercel
vercel login
vercel --prod
```

## Limitazioni note (riepilogo)

- **Copertura corrieri:** solo UPS, FedEx e DHL hanno tracking live e notifiche automatiche — sono i soli con un'API gratuita self-service. Poste Italiane, BRT, GLS, SDA, TNT, Amazon Logistics, InPost e Vinted Go (tra i più usati per l'e-commerce in Italia) offrono solo un link al sito ufficiale, senza stato live né notifiche, perché nessuno di loro pubblica un'API gratuita senza contratto business.
- **Ritardo notifiche in background:** non istantaneo, dipende dalla pianificazione del sistema operativo (minuti-ore); su iOS in Expo Go il background task di fatto non gira affatto (serve dev build).
- **Credenziali API:** l'opzione diretta-dal-client è estraibile da un APK decompilato; l'opzione proxy (consigliata, già implementata in `/server`) evita il problema ma richiede un piccolo deploy Cloudflare Workers separato.
- **Parsing risposte UPS/FedEx/DHL non testato live:** scritto da documentazione pubblica, difensivo ma da riverificare con credenziali reali.
- **DHL: 250 richieste/giorno gratis** (max 1 ogni 5 secondi) — sufficiente per uso personale ma da tenere a mente se aggiungi molte spedizioni DHL.
- **Blur su Android:** `experimentalBlurMethod` di `expo-blur` è etichettato "experimental" da Expo stesso — può avere impatti di performance su liste lunghe.
- **Link ai siti dei corrieri "external":** puntano alla pagina di ricerca spedizioni pubblica di ciascun corriere (verificate il 2026-08-17), ma nessuna prefilla il numero di tracking via URL — l'app lo copia negli appunti e tocca a te incollarlo. Amazon Logistics è un'eccezione: non esiste una pagina pubblica per codice, il link porta allo storico ordini e richiede login al tuo account Amazon.

## Scelte fatte in autonomia (dove il prompt era ambiguo)

- **Solo API dirette dei corrieri, niente aggregatore** (17TRACK o simili): su richiesta esplicita di qualcosa di "gratis per sempre". Conseguenza diretta: solo UPS/FedEx/DHL hanno tracking live; gli altri corrieri diffusi in Italia (senza API self-service gratuita) restano nell'app come "link al sito ufficiale" invece di sparire — sembrava la via di mezzo più utile tra "niente aggregatore" e "lista corrieri dimezzata".
- **TNT trattato come "link al sito FedEx"** invece che integrato con l'API FedEx diretta: TNT è stata assorbita dalla rete FedEx (da aprile 2025 non accetta più nuove registrazioni come piattaforma separata), ma non è stato possibile verificare con certezza che i vecchi codici di tracking TNT si risolvano sempre correttamente tramite l'API FedEx — per prudenza resta "link al sito" invece di rischiare falsi negativi silenziosi.
- **Tema chiaro fisso** (`userInterfaceStyle: "light"`), niente dark mode: il brief chiedeva esplicitamente una "palette chiara e pulita" in stile Apple; costruire due temi non era richiesto e avrebbe raddoppiato il lavoro sull'estetica senza un requisito esplicito.
- **Storico eventi salvato come colonna JSON** dentro la riga `shipments` in SQLite invece di una tabella separata: per il volume di dati di un tracker personale (poche spedizioni, decine di eventi ciascuna) una join non aggiunge valore, solo complessità.
- **Nessuna libreria aggiuntiva per generare ID** (niente `uuid`/`expo-crypto`): un generatore timestamp+random locale (`src/utils/id.ts`) basta per chiavi primarie locali non distribuite. Stesso criterio per il base64 usato nell'auth UPS (`src/utils/base64.ts`): React Native/Hermes non espone `btoa` come i browser, quindi un piccolo encoder locale evita una dipendenza in più.
- **Swipe con gesture "aperta" persistente per riga** (ogni card gestisce il proprio stato, non c'è coordinamento "solo una aperta alla volta"): più semplice, comportamento comunque naturale per liste di questo tipo.
- **Package/bundle id** impostati a `com.hyperfagianni.trackly` (dal repo di destinazione) — cambiali in `app.json` se preferisci altro.

## Struttura del progetto

```
app/                    Schermate (Expo Router: home, add, info, dettaglio)
src/
  api/
    providers/          Client + parsing per ciascuna API diretta (ups, fedex, dhl)
    trackingClient.ts    Dispatcher: sceglie il provider giusto in base al corriere
  background/           Task in background (expo-background-task)
  components/           UI riutilizzabile (card, glass, picker, timeline...)
  config/               Corrieri curati (api/external), flag ads, env, metadati stato
  db/                    SQLite (schema + repository spedizioni)
  notifications/         Servizio notifiche + logica diff stato (testata)
  sync/                  Motore di sincronizzazione condiviso (refresh manuale + background)
  theme/                 Design tokens (colori, spaziature, tipografia)
  types/                 Tipi condivisi
  utils/                 Formattazione date, id, base64
server/                 Cloudflare Worker proxy opzionale (consigliato) per le credenziali API
assets/carriers/        Loghi corrieri + attribuzione
```
