<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — traduzione nel browser attenta alla privacy" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Leggi pagine e sottotitoli con il modello che scegli tu.</strong><br>Open source · La tua chiave API · Nessun server intermediario · Nessuna telemetria</p>
<p align="center">
  <a href="../README.md"><kbd>English</kbd></a>
  <a href="./zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./zh-TW.md"><kbd>繁體中文</kbd></a>
  <a href="./ja.md"><kbd>日本語</kbd></a>
  <a href="./ko.md"><kbd>한국어</kbd></a>
  <a href="./es.md"><kbd>Español</kbd></a>
  <a href="./fr.md"><kbd>Français</kbd></a><br>
  <a href="./de.md"><kbd>Deutsch</kbd></a>
  <a href="./pt-BR.md"><kbd>Português (Brasil)</kbd></a>
  <a href="./it.md"><kbd><b>Italiano</b></kbd></a>
  <a href="./ru.md"><kbd>Русский</kbd></a>
  <a href="./tr.md"><kbd>Türkçe</kbd></a>
  <a href="./vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./id.md"><kbd>Bahasa Indonesia</kbd></a>
</p>
<p align="center"><a href="#installation">Installa</a> · <a href="#configuration">Configura</a> · <a href="../CHANGELOG.md">Novità</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Segnalazioni</a></p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Ultima versione"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Perché BrowserTranslate?

Usa il fornitore che preferisci senza abbonamenti obbligatori all’estensione o server intermediari gestiti dal progetto.

- **Il tuo modello e la tua chiave:** collega un endpoint compatibile con OpenAI o un ambiente locale. La compatibilità dipende da endpoint e modello.
- **Connessione diretta:** il testo passa dal browser al fornitore scelto. Non gestiamo un relay.
- **Nessuna telemetria:** niente analisi dell’utilizzo, segnalazioni di errore remote o registri remoti dell’estensione.
- **Prompt di base modificabile:** consulta quello predefinito e crea modelli di prompt personali. Una base comune serve tutti i modi LLM; l’estensione gestisce ancora le regole interne del dizionario e del formato.

<a id="features"></a>
## Funzionalità

- **Inizia senza chiave API:** Microsoft e Google sono abilitati; una nuova installazione usa Microsoft per tutti e tre i modi. Sono endpoint pubblici non ufficiali: leggi le [avvertenze](#free-engines).
- **Un motore per ogni attività:** selezioni, pagine intere e sottotitoli possono usare fornitori diversi. Mantieni più configurazioni senza reinserirle al cambio.
- **Traduzione della selezione:** seleziona testo e premi l’icona mobile, oppure usa la modalità scorciatoie. Il testo normale arriva in streaming con l’originale sopra. La scheda permette copia, nuova traduzione e scelte temporanee di fornitore o lingua. Non modifica le impostazioni globali; ritradurre ignora la cache.
- **Scheda stabile e spostabile:** dimensioni in Generali → Aspetto. Originale e traduzione scorrono separatamente; l’originale occupa al massimo il 30% del corpo condiviso. Durante l’attesa compare una vista compatta. Fissala per mantenerla aperta mentre scorri o clicchi altrove e spostala con la maniglia.
- **Pagina bilingue:** inserisce la traduzione sotto l’originale nel contenuto principale, normalmente escludendo navigazione, intestazioni e piè di pagina. Il lavoro procede intorno alla porzione visibile durante lo scorrimento. Usa Pagina attuale → Traduzione bilingue nel popup, oppure **Alt+A** in modalità scorciatoie.
- **Dizionario per selezioni brevi:** un modello può fornire traduzione, pronuncia, categoria grammaticale, significati ed esempio. Paragrafi evidenti, più righe e testo simile a codice ricevono solo istruzioni di traduzione. I servizi classici non producono voci di dizionario.
- **Testo multilingue consentito:** lingua di origine e destinazione uguali non bloccano la richiesta. L’adattamento regionale dipende dal modello o servizio.
- **Configurazione e cache locali:** durata configurabile in Impostazioni → Dati. Importa/esporta impostazioni e prompt in JSON; cache esclusa e chiavi API incluse solo su richiesta esplicita.
- **Interfaccia compatta:** tema chiaro/scuro automatico o manuale e cinque pagine — Generali, Traduzione, Fornitori, Sottotitoli, Dati. Font di sistema per l’interfaccia, monospaziati per codice ed endpoint.

<a id="subtitles"></a>
### Sottotitoli video

Traduce tracce esistenti su **YouTube**, **registrazioni cloud di Zoom**, **registrazioni dei corsi Canvas** e lettori compatibili che espongono sottotitoli tramite `<track>`/TextTrack. Dipende dal lettore e dall’accessibilità della traccia; non tutti i lettori incorporati sono stati provati. **Non trascrive l’audio.**

Premi l’icona di traduzione del lettore e abilita i sottotitoli tradotti. Se manca una barra adatta, il pulsante appare in un angolo del video. Su YouTube, attiva prima i sottotitoli nativi (CC) per caricare la traccia; anche altri lettori potrebbero richiederne l’attivazione. Sono utilizzabili tracce del creatore e sottotitoli automatici supportati; i frammenti ASR progressivi vengono uniti in frasi.

Originale e traduzione sono sovrapposti al video e spostabili dalla maniglia. La posizione è ricordata anche a schermo intero ed evita i controlli visibili. La traduzione privilegia la zona della riproduzione e si riorganizza dopo uno spostamento. Le etichette dei parlanti riconosciute vengono preservate senza tradurle. La latenza dipende da video e fornitore, senza un tempo fisso garantito.

Il menu del lettore e **Impostazioni → Sottotitoli** regolano vista bilingue/solo originale/solo traduzione, ordine, opacità e dimensione, colore, font e spessore delle due righe. Nelle impostazioni trovi anteprima live, valori precisi, piccola tavolozza, input HEX e ripristino.

<a id="languages"></a>
### Lingue

**56 destinazioni di traduzione** sono indipendenti dalle **14 lingue dell’interfaccia** elencate sopra. L’interfaccia può seguire la lingua del browser. Nei selettori di popup, impostazioni e scheda puoi cercare nomi nativi, inglesi o localizzati, codici e varianti regionali dell’inglese. I nomi RTL mantengono la direzione senza disallineare le righe.

L’inglese distingue **Stati Uniti, Regno Unito e Australia**; il vecchio `en` generico migra all’inglese statunitense. Il cinese distingue **semplificato e tradizionale**. I LLM ricevono istruzioni regionali su ortografia e lessico. Se un servizio gratuito non supporta la variante, usa silenziosamente l’inglese generico senza cambiare fornitore.

<a id="architecture"></a>
## Architettura

<p align="center"><img src="../assets/framework.png" alt="Architettura di BrowserTranslate e collegamenti diretti ai fornitori" width="760"></p>

Le richieste LLM e di traduzione automatica partono dal **service worker in background**. Il JavaScript del sito non riceve la chiave API. Gli script di contenuto visualizzano i risultati e integrano pagine e lettori; il recupero di sottotitoli specifici del sito può avvenire anche nel contesto di contenuto o pagina. Il progetto non gestisce intermediari.

<a id="installation"></a>
## Installazione

Per **browser desktop basati su Chromium**, fra cui Chrome, Edge, Brave e Arc. Firefox non è attualmente supportato.

1. Scarica l’ultimo `.zip` da [Releases](https://github.com/Lewen-Cai/browser-translate/releases).
2. Estrailo in una cartella da conservare.
3. Apri `chrome://extensions` o la gestione estensioni, abilita **Modalità sviluppatore**, scegli **Carica estensione non pacchettizzata** e seleziona la cartella.

### Aggiornamento manuale

Le estensioni non pacchettizzate non si aggiornano automaticamente. Estrai il nuovo archivio sopra la cartella esistente, premi **Ricarica** e aggiorna le pagine aperte. Su Windows/macOS, l’installazione gestita di estensioni auto-ospitate richiede in genere criteri aziendali; caricare una cartella estratta è una procedura distinta.

L’intestazione delle impostazioni mostra versione e controllo manuale. GitHub viene interrogato solo premendo il pulsante; se esiste una versione successiva, viene offerto l’archivio senza installarlo. Il popup non ripete il numero di versione.

<a id="configuration"></a>
## Configurazione

All’inizio tutti i modi usano Microsoft. Per usare il tuo modello:

1. Apri il popup e l’icona delle impostazioni.
2. In **Fornitori**, abilita il servizio e inserisci endpoint, modello e chiave API. Gli ambienti locali non richiedono la chiave. Le righe attive mostrano stato/latenza tramite una verifica che contatta il fornitore.
3. In **Traduzione → Motori di traduzione**, assegna separatamente selezione, pagina intera e sottotitoli.
4. Scegli la lingua e seleziona testo su una pagina supportata. Per la tastiera, attiva la modalità scorciatoie in **Generali**: **Alt+T** per la selezione e **Alt+A** per la pagina. Entrambe funzionano solo in questa modalità.

Il popup offre destinazione, interruttore della pagina e motori. Attivazione e scorciatoie sono solo nelle impostazioni. Le pagine non supportate disabilitano la traduzione; uno script assente produce un invito a ricaricare. Prompt e assegnazioni sono in Traduzione, credenziali in Fornitori, aspetto dei sottotitoli in Sottotitoli, cache/import/export in Dati.

### Fornitori e ragionamento

Preimpostazioni: **OpenAI, Claude, Gemini, DeepSeek, Moonshot, Zhipu, Qwen, SiliconFlow, OpenRouter, Mistral, opencode**. In locale: **LM Studio, Ollama, llama.cpp, vLLM**. Altri servizi compatibili possono usare endpoint personalizzati.

Gli endpoint distinguono regioni e piani: opencode Zen/Go, Qwen a Pechino, Singapore, Hong Kong e Virginia, oltre a Token Plan. Account, chiavi e cataloghi non sono necessariamente intercambiabili. I fornitori supportati consentono anche URL specifici di un workspace.

Dove supportato, l’estensione richiede il ragionamento disattivato per impostazione predefinita e offre **Low / Medium / High / XHigh / Max**, mappati sui parametri del fornitore. Per server personalizzati/locali scegli il formato del parametro o **Non inviare nulla**. Senza un controllo compatibile si applica il valore del server. Supporto, latenza e fatturazione dei token dipendono da endpoint/modello, non solo dal controllo nell’interfaccia.

<a id="prompts"></a>
### Prompt di base

In **Traduzione → Prompt di base**, elenco ed editor sono affiancati, oppure impilati nelle finestre strette. Il predefinito è visibile ma di sola lettura. **Nuovo** permette di partire dal predefinito o da zero; l’aiuto è nella scheda, sotto l’editor. Selezionare un modello di prompt lo apre soltanto; quello in uso è segnalato separatamente.

- **Salva e applica** salva e usa subito la bozza.
- **Salva modifiche** aggiorna il prompt già in uso.
- **Applica prompt** usa un modello salvato; è disabilitato se già in uso.
- **Annulla** scarta le modifiche locali.
- **Azioni del modello** include salvataggio senza applicazione, duplicazione, sostituzione della bozza con il testo predefinito ed eliminazione. Le operazioni distruttive richiedono conferma; eliminare il modello attivo ripristina il predefinito.

Le istruzioni personali **sostituiscono** la base, non vi si aggiungono. L’estensione fornisce ancora lingua, convenzioni regionali, instradamento e formato; i protocolli interni non sono modificabili. Istruzioni in conflitto o modelli meno capaci possono dare risultati imperfetti. `{{...}}` resta letterale, senza sostituzione di variabili.

Fino a **20 modelli di prompt**, ciascuno con **12.000 caratteri**, salvati localmente. Valgono solo per LLM, non per Microsoft/Google convenzionali. Le modifiche usano cache distinte; l’export include modelli e scelta attiva.

<a id="validation"></a>
### Validazione delle risposte

I passaggi evidenti non ricevono istruzioni da dizionario. Per selezioni brevi, la voce deve corrispondere all’intera selezione e non a una parola estratta. L’output strutturato sospetto viene trattenuto e verificato; la scheda riceve un tipo esplicito anziché dedurlo da `{`.

Una risposta di selezione non valida riceve al massimo **una richiesta correttiva in testo semplice**. I lotti pagina/sottotitoli non validi passano a **una richiesta testuale per segmento non in cache**. Questo può consumare token aggiuntivi; i tentativi di trasporto sono separati. Errori persistenti mostrano un messaggio, non il JSON del protocollo, e non vengono memorizzati.

Gli ID dei lotti devono essere completi e univoci; i risultati sono riportati nell’ordine di input senza convertire forzatamente numeri o oggetti in traduzioni. Le chiavi legate al protocollo e la verifica in lettura isolano i vecchi risultati non controllati. Le strutture presenti nell’originale restano traducibili come testo.

**La verifica del formato non garantisce il significato né rileva ogni omissione.** Le etichette linguistiche sono indizi locali, con una valutazione prudente delle scritture miste; non bloccano né instradano richieste.

<a id="free-engines"></a>
### Servizi gratuiti

Microsoft e Google usano `edge.microsoft.com` e `translate-pa.googleapis.com`.

- **Non sono API ufficiali:** servono le funzioni web/browser dei fornitori, senza contratto pubblico per questa estensione.
- **Nessuna affiliazione o approvazione:** il progetto non è affiliato, sponsorizzato o approvato da Microsoft/Google. I marchi identificano il servizio e appartengono ai titolari.
- **Disponibilità non garantita:** possono cambiare o cessare senza preavviso. Puoi passare al tuo modello, la cui disponibilità dipende dal suo fornitore.
- **Il testo viene inviato al servizio:** si applicano i suoi termini e la sua privacy. Per contenuti sensibili scegli un endpoint appropriato sotto il tuo controllo.
- **Nessuna garanzia:** forniti così come sono, a tuo rischio. Per uso commerciale o elevati volumi, scegli API ufficiali con le licenze necessarie.

Microsoft è predefinito per rendere utile il primo avvio. Assegnando un modo al proprio modello, quel modo non usa più questi endpoint pubblici.

<a id="privacy"></a>
## Privacy e dati locali

L’assenza di intermediari e telemetria **non significa che tutto sia elaborato localmente**. I fornitori cloud ricevono il testo richiesto; un ambiente locale può mantenere l’elaborazione sul computer. Il recupero dei sottotitoli contatta il sito video e il controllo manuale contatta GitHub. I servizi ricevono i normali metadati di rete, come l’indirizzo IP.

Impostazioni, chiavi e cache sono in `chrome.storage.local`. **L’estensione non cifra le chiavi API.** L’export le esclude per impostazione predefinita; includerle crea un file in chiaro da custodire. La cache non è esportata e non esiste una cronologia delle traduzioni consultabile.

<a id="development"></a>
## Sviluppo

```bash
pnpm install
pnpm dev          # Compilazione continua: .output/chrome-mv3-dev/
pnpm test         # Test in modalità osservazione
pnpm test:run     # Esecuzione singola dei test
pnpm typecheck    # Tipi WXT + TypeScript
pnpm lint
pnpm build        # Produzione: .output/chrome-mv3/
```

Carica la cartella di output come estensione non pacchettizzata. Dopo un cambio di build ricarica estensione e pagine. Consulta [CHANGELOG.md](../CHANGELOG.md) e usa [Issues](https://github.com/Lewen-Cai/browser-translate/issues) per errori o richieste, rimuovendo chiavi API e contenuti privati.

<a id="acknowledgements"></a>
## Ringraziamenti

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; un ottimo progetto da cui abbiamo imparato durante lo sviluppo.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; loghi dei fornitori. I marchi restano dei rispettivi titolari e identificano soltanto i servizi.

<a id="license"></a>
## Licenza

[GPL-3.0](../LICENSE). Le opere derivate distribuite devono rispettare gli obblighi di codice sorgente e licenza. Le risorse di terzi conservano le rispettive licenze.
