# Data Safety (Google Play Console) — come rispondere

Il modulo "Sicurezza dei dati" va compilato direttamente in Play Console (non è automatizzabile da fuori) — questa pagina ti dà le risposte corrette e il perché, così lo compili in pochi minuti senza dubbi.

## Riepilogo
**"Questa app raccoglie o condivide nessuno dei tipi di dati richiesti?"** → **Sì, puoi selezionare "Nessun dato raccolto"** per praticamente tutte le categorie, per questo motivo:

- Le spedizioni (numero, corriere, nome, stato) sono salvate **solo nel database locale del telefono** (SQLite) — non arrivano mai a un server dello sviluppatore.
- Le chiamate alle API di UPS/FedEx/DHL (o al proxy Cloudflare Worker opzionale) inviano solo *numero di tracking + codice corriere* direttamente a quei corrieri (o al proxy che le inoltra senza salvarle) — non è un dato che identifica te come persona, e comunque non transita né si ferma su un server gestito da te come sviluppatore.
- Nessun SDK di analytics, crash reporting, advertising o attribution è integrato.
- Nessun account, nessun login, nessun identificativo pubblicitario raccolto.

## Come compilare, categoria per categoria

| Categoria Play Console | Risposta | Perché |
|---|---|---|
| Posizione | Non raccolta | L'app non richiede né usa mai la posizione del dispositivo |
| Informazioni personali | Non raccolta | Nessun nome, email, indirizzo richiesto dall'app stessa |
| Informazioni finanziarie | Non raccolta | Nessun pagamento in-app, nessuna carta richiesta |
| Salute e fitness | Non raccolta | Non applicabile |
| Messaggi | Non raccolta | Non applicabile |
| Foto e video | Non raccolta | Non applicabile |
| File audio | Non raccolta | Non applicabile |
| File e documenti | Non raccolta | Non applicabile |
| Calendario | Non raccolta | Non applicabile |
| Contatti | Non raccolta | Non applicabile |
| Attività dell'app | Non raccolta | Nessun analytics/tracciamento dell'uso |
| Informazioni sul dispositivo o altri ID | Non raccolta | Nessun identificativo pubblicitario o device ID raccolto/inviato a te come sviluppatore |

Se Play Console ti chiede specificamente dei "numeri di tracking spedizione" come dato — non rientrano in nessuna delle categorie standard elencate da Google (non sono dati che identificano una persona); dichiarali eventualmente come "Altri dati" con finalità "Funzionalità dell'app", condivisi con "Terze parti" (i corrieri stessi) solo per fornire il servizio, non per pubblicità o profilazione, senza raccolta/conservazione lato tuo.

## Sicurezza in transito
Tutte le chiamate (dirette ai corrieri o tramite il proxy Cloudflare Worker) avvengono su HTTPS → rispondi "Sì" a "I dati sono crittografati in transito".

## Richiesta di eliminazione dei dati
Poiché non c'è alcun dato lato server, puoi rispondere che l'utente può eliminare i propri dati **direttamente nell'app** in qualsiasi momento (elimina la singola spedizione, o disinstalla l'app per rimuovere tutto).
