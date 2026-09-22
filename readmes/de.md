<p align="center"><img src="../assets/banner.png" alt="BrowserTranslate — datenschutzorientierte Übersetzung im Browser" width="900"></p>
<h1 align="center">BrowserTranslate</h1>
<p align="center"><strong>Webseiten und Untertitel mit dem Modell deiner Wahl lesen.</strong><br>Open Source · Eigener API-Schlüssel · Kein Relay · Keine Telemetrie</p>
<p align="center">
  <a href="../README.md"><kbd>English</kbd></a>
  <a href="./zh-CN.md"><kbd>简体中文</kbd></a>
  <a href="./zh-TW.md"><kbd>繁體中文</kbd></a>
  <a href="./ja.md"><kbd>日本語</kbd></a>
  <a href="./ko.md"><kbd>한국어</kbd></a>
  <a href="./es.md"><kbd>Español</kbd></a>
  <a href="./fr.md"><kbd>Français</kbd></a><br>
  <a href="./de.md"><kbd><b>Deutsch</b></kbd></a>
  <a href="./pt-BR.md"><kbd>Português (Brasil)</kbd></a>
  <a href="./it.md"><kbd>Italiano</kbd></a>
  <a href="./ru.md"><kbd>Русский</kbd></a>
  <a href="./tr.md"><kbd>Türkçe</kbd></a>
  <a href="./vi.md"><kbd>Tiếng Việt</kbd></a>
  <a href="./id.md"><kbd>Bahasa Indonesia</kbd></a>
</p>
<p align="center"><a href="#installation">Installation</a> · <a href="#configuration">Einrichtung</a> · <a href="../CHANGELOG.md">Änderungen</a> · <a href="https://github.com/Lewen-Cai/browser-translate/issues">Probleme melden</a></p>
<p align="center">
  <a href="https://github.com/Lewen-Cai/browser-translate/releases/latest"><img src="https://img.shields.io/github/v/release/Lewen-Cai/browser-translate?style=flat-square&amp;color=2563eb" alt="Neueste Veröffentlichung"></a>
  <a href="../LICENSE"><img src="https://img.shields.io/badge/license-GPL--3.0-2563eb?style=flat-square" alt="GPL-3.0"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml"><img src="https://github.com/Lewen-Cai/browser-translate/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
  <a href="https://github.com/Lewen-Cai/browser-translate/stargazers"><img src="https://img.shields.io/github/stars/Lewen-Cai/browser-translate?style=flat-square" alt="GitHub stars"></a>
</p>

<a id="why"></a>
## Warum BrowserTranslate?

Nutze deinen bevorzugten Anbieter ohne Pflichtabonnement für diese Erweiterung und ohne einen von uns betriebenen Vermittlungsserver.

- **Dein Modell, dein Schlüssel:** OpenAI-kompatible Endpunkte und lokale Laufzeitumgebungen. Die Kompatibilität hängt vom Endpunkt und Modell ab.
- **Direkte Verbindung:** Texte gehen vom Browser zum gewählten Anbieter. Das Projekt betreibt kein Relay.
- **Keine Telemetrie:** Keine Nutzungsanalyse, entfernten Fehlerberichte oder Remote-Protokolle durch die Erweiterung.
- **Editierbarer Basis-Prompt:** Standard ansehen, eigene Vorlagen erstellen und eine gemeinsame Basis für alle LLM-Übersetzungen verwenden. Wörterbuch- und Ausgabeformatregeln verwaltet weiterhin die Erweiterung.

<a id="features"></a>
## Funktionen

- **Ohne API-Schlüssel starten:** Microsoft und Google sind standardmäßig aktiviert; neue Installationen nutzen Microsoft für alle drei Bereiche. Es sind inoffizielle öffentliche Endpunkte — bitte die [Hinweise zu kostenlosen Diensten](#free-engines) lesen.
- **Ein Anbieter pro Aufgabe:** Auswahlkarte, ganze Seite und Videountertitel können unterschiedliche Anbieter verwenden. Mehrere Konfigurationen bleiben gespeichert, ohne erneute Eingabe beim Wechsel.
- **Markierten Text übersetzen:** Nach der Auswahl das schwebende Symbol anklicken oder den Tastenkürzelmodus nutzen. Normaler Text wird gestreamt, das Original steht darüber. Die Karte bietet Kopieren, erneutes Übersetzen sowie Anbieter- und Sprachwechsel. Diese Auswahl gilt nur für die Karte; erneutes Übersetzen umgeht den Cache.
- **Stabile, bewegliche Karte:** Größe unter Allgemein → Erscheinungsbild festlegen. Original und Ergebnis scrollen getrennt; das Original belegt höchstens 30 % des gemeinsamen Inhaltsbereichs. Während des Wartens erscheint eine kompakte Ladeansicht. Anheften verhindert das Schließen beim Scrollen oder Klicken außerhalb; der Griff verschiebt die Karte.
- **Zweisprachige Webseiten:** Übersetzungen erscheinen unter dem Original im Hauptinhalt, normalerweise ohne Navigation, Kopf- und Fußbereiche. Die Verarbeitung folgt schrittweise dem sichtbaren Bereich. Umschalten im Popup unter Aktuelle Seite → Zweisprachige Übersetzung oder mit **Alt+A** im Tastenkürzelmodus.
- **Wörterbuch für kurze Auswahlen:** Ein Modell kann Übersetzung, Aussprache, Wortart, Bedeutungen und Beispiel liefern. Eindeutige Absätze, mehrzeilige oder codeartige Inhalte erhalten nur Übersetzungsanweisungen. Klassische Dienste erzeugen keine Wörterbucheinträge.
- **Gemischte Sprachen erlaubt:** Gleiche Ausgangs- und Zielsprache blockiert keine Anfrage. Regionale Umformulierungen hängen vom Modell oder Dienst ab.
- **Lokale Einstellungen und Cache:** Aufbewahrungsdauer unter Einstellungen → Daten. JSON-Import/-Export enthält Einstellungen und Prompts, aber keinen Cache und nur auf ausdrücklichen Wunsch API-Schlüssel.
- **Kompakte Oberfläche:** Helles/dunkles Design automatisch oder manuell; fünf Seiten: Allgemein, Übersetzung, Anbieter, Untertitel, Daten. Systemschriften für die Oberfläche, Monospace für Code und Endpunkte.

<a id="subtitles"></a>
### Videountertitel

Übersetzt vorhandene Untertitel auf **YouTube**, in **Zoom-Cloud-Aufzeichnungen**, **Canvas-Kursaufzeichnungen** und kompatiblen Playern mit zugänglichen `<track>`-/TextTrack-Spuren. Die Unterstützung hängt vom Player und der Spur ab; nicht jeder eingebettete Player wurde getestet. **Keine Audiotranskription.**

Über das Übersetzungssymbol im Player-Menü einschalten. Ohne geeignete Steuerleiste sitzt der Knopf in einer Bildecke. Auf YouTube zuerst native Untertitel (CC) aktivieren, damit die Spur geladen wird; auch andere Player können eine Aktivierung verlangen. Vom Ersteller bereitgestellte und unterstützte automatische Untertitel sind möglich; rollende ASR-Fragmente werden vorab zu Sätzen zusammengeführt.

Original und Übersetzung liegen über dem Video und lassen sich am Griff verschieben. Die Position wird auch im Vollbild gespeichert und sichtbaren Steuerelementen angepasst. Übersetzt wird bevorzugt in der Nähe der Abspielposition; nach einem Sprung werden Aufgaben neu priorisiert. Erkannte Sprecherbezeichnungen bleiben unverändert. Die Latenz hängt von Video und Anbieter ab; eine feste Antwortzeit wird nicht garantiert.

Player-Menü und **Einstellungen → Untertitel** regeln zweisprachige Ansicht, nur Original oder nur Übersetzung, Reihenfolge, Hintergrunddeckkraft sowie Größe, Farbe, Schrift und Gewicht jeder Zeile. Die Einstellungsseite bietet Live-Vorschau, genaue Zahlenwerte, kleine Farbpalette, HEX-Eingabe und Zurücksetzen.

<a id="languages"></a>
### Sprachen

**56 Übersetzungsziele** sind unabhängig von den oben verlinkten **14 Oberflächensprachen**. Die Oberfläche kann der Browsersprache folgen. Popup, Einstellungen und Karte suchen nach Eigenbezeichnung, englischem/lokalisiertem Namen, Sprachcode und englischen Regionsbezeichnungen. RTL-Namen behalten ihre Schreibrichtung, die Menüzeilen bleiben ausgerichtet.

Englisch unterscheidet **USA, Vereinigtes Königreich und Australien**; frühere allgemeine `en`-Einstellungen werden auf US-Englisch umgestellt. Chinesisch unterscheidet **vereinfacht und traditionell**. LLMs erhalten regionale Rechtschreib- und Wortschatzanweisungen. Unterstützt ein kostenloser Dienst die Variante nicht, verwendet er stillschweigend allgemeines Englisch, ohne Anbieterwechsel.

<a id="architecture"></a>
## Architektur

<p align="center"><img src="../assets/framework.png" alt="BrowserTranslate-Architektur und direkte Anbieteranbindung" width="760"></p>

LLM- und maschinelle Übersetzungsanfragen laufen im **Hintergrund-Service-Worker**. Website-JavaScript erhält keinen API-Schlüssel. Content-Skripte zeigen Ergebnisse und integrieren Seiten/Player; websitespezifische Untertitelabfragen können auch im Content- oder Seitenkontext erfolgen. Das Projekt betreibt keinen Vermittlungsserver.

<a id="installation"></a>
## Installation

Für **Chromium-basierte Desktopbrowser**, darunter Chrome, Edge, Brave und Arc. Firefox wird derzeit nicht unterstützt.

1. Neueste `.zip` aus den [Releases](https://github.com/Lewen-Cai/browser-translate/releases) herunterladen.
2. In einen dauerhaft aufzubewahrenden Ordner entpacken.
3. `chrome://extensions` oder die Erweiterungsverwaltung öffnen, **Entwicklermodus** aktivieren und über **Entpackte Erweiterung laden** den Ordner auswählen.

### Manuell aktualisieren

Entpackte Erweiterungen aktualisieren sich nicht automatisch. Neues Archiv über den vorhandenen Ordner entpacken, in der Erweiterungsverwaltung **Neu laden** wählen und anschließend offene Webseiten aktualisieren. Die verwaltete Installation selbst gehosteter Erweiterungen unter Windows/macOS erfordert üblicherweise Unternehmensrichtlinien; das Laden eines entpackten Ordners ist ein anderer Ablauf.

Der Einstellungskopf zeigt Version und manuelle Updateprüfung. Nur ein Klick fragt GitHub ab und bietet gegebenenfalls das neuere Archiv an. Es wird nichts automatisch installiert; im Popup steht keine zusätzliche Versionsnummer.

<a id="configuration"></a>
## Einrichtung

Anfangs verwendet jeder Bereich Microsoft. Für dein eigenes Modell:

1. Popup öffnen und auf das Einstellungssymbol klicken.
2. Unter **Anbieter** den Dienst aktivieren und Endpunkt, Modell sowie API-Schlüssel eintragen. Lokale Laufzeitumgebungen benötigen keinen Schlüssel. Aktive Zeilen zeigen Status/Latenz durch eine Prüfung, die den Anbieter kontaktiert.
3. Unter **Übersetzung → Übersetzungsdienste** Auswahlkarte, ganze Seite und Untertitel getrennt zuweisen.
4. Zielsprache wählen und auf einer unterstützten Seite Text markieren. Für Tastaturbedienung unter **Allgemein** den Tastenkürzelmodus aktivieren: **Alt+T** für Auswahl, **Alt+A** für die ganze Seite. Beide Kürzel funktionieren nur in diesem Modus.

Das Popup enthält Zielsprache, Seitenschalter und Anbieterwahl. Auslösemodus und Tastenkürzel bleiben in den Einstellungen. Nicht unterstützte Seiten deaktivieren die Seitenübersetzung; ein fehlendes Content-Skript führt zum Hinweis, die Seite neu zu laden. Prompts und Zuordnung liegen unter Übersetzung, Zugangsdaten unter Anbieter, Untertitelgestaltung unter Untertitel und Cache/Import/Export unter Daten.

### Anbieter und Denksteuerung

Voreinstellungen: **OpenAI, Claude, Gemini, DeepSeek, Moonshot, Zhipu, Qwen, SiliconFlow, OpenRouter, Mistral, opencode**. Lokal: **LM Studio, Ollama, llama.cpp, vLLM**. Weitere kompatible Dienste lassen sich als eigener Endpunkt eintragen.

Endpunkte trennen Regionen und Tarife, etwa opencode Zen/Go oder Qwen in Peking, Singapur, Hongkong und Virginia sowie Token Plan. Konten, Schlüssel und Modellkataloge sind nicht zwingend austauschbar. Unterstützte Anbieter erlauben auch eigene Workspace-URLs.

Wo unterstützt, fordert die Erweiterung standardmäßig ausgeschaltetes Denken an und bietet **Low / Medium / High / XHigh / Max**, auf Anbieterparameter abgebildet. Für eigene/lokale Server wird das Parameterformat gewählt oder **Nichts senden** beibehalten. Ohne unterstützten Steuerparameter gilt der Serverstandard. Tatsächliche Unterstützung, Latenz und Abrechnung von Reasoning-Tokens hängen von Endpunkt/Modell ab, nicht allein vom UI-Schalter.

<a id="prompts"></a>
### Basis-Prompt

Unter **Übersetzung → Basis-Prompt** stehen Vorlagenliste und Editor nebeneinander, bei schmalen Fenstern untereinander. Die Standardvorlage ist sichtbar und schreibgeschützt. **Neu** erstellt aus dem Standard oder aus einer leeren Vorlage. Hinweise stehen in der Karte unter dem Editor. Die Auswahl öffnet nur die Vorlage; die tatsächlich verwendete wird separat markiert.

- **Speichern & anwenden** speichert den Entwurf und verwendet ihn sofort.
- **Änderungen speichern** aktualisiert den bereits aktiven Prompt.
- **Prompt anwenden** aktiviert eine gespeicherte Vorlage; bei bereits aktiver Vorlage deaktiviert.
- **Abbrechen** verwirft lokale Änderungen.
- **Vorlagenaktionen** enthält Speichern ohne Anwendung, Duplizieren, Ersetzen des Entwurfs durch Standardtext und Löschen. Destruktive Vorgänge benötigen Bestätigung; das Löschen der aktiven Vorlage stellt den Standard wieder her.

Eigene Anweisungen **ersetzen** den Basis-Prompt, statt ihn zu ergänzen. Zielsprache, regionale Konventionen, Routing und Format fügt die Erweiterung weiterhin hinzu; interne Protokolle sind nicht editierbar. Widersprüche oder schwächere Modelle können unvollkommene Ergebnisse liefern. `{{...}}` wird nicht als Variable ersetzt.

Bis zu **20 eigene Vorlagen** mit jeweils **12.000 Zeichen** werden lokal gespeichert. Sie wirken nur auf LLMs, nicht auf die klassischen Microsoft-/Google-Dienste. Prompt-Änderungen erhalten separate Cacheeinträge; Exporte enthalten Vorlagen und aktive Auswahl.

<a id="validation"></a>
### Antwortprüfung

Eindeutige Passagen erhalten keine Wörterbuchanweisungen. Bei kurzen Auswahlen entscheidet das Modell, aber ein Eintrag muss zur gesamten Auswahl passen, nicht zu einem herausgegriffenen Wort. Verdächtige strukturierte Ausgabe wird gepuffert und geprüft; die Karte bekommt einen expliziten Ergebnistyp statt anhand von `{` zu raten.

Eine ungültige Auswahlantwort erhält höchstens **eine Korrekturanfrage für Klartext**. Ungültige Seiten-/Untertitelbatches fallen auf **eine Klartextanfrage je nicht zwischengespeichertem Segment** zurück. Das kann zusätzliche Tokens kosten; Netzwerkversuche werden separat behandelt. Bleibt das Format ungültig, erscheint ein Fehler, kein rohes Protokoll-JSON, und das Ergebnis wird nicht gespeichert.

Batch-IDs müssen vollständig und eindeutig sein. Ergebnisse werden in Eingabereihenfolge gebracht; Zahlen und Objekte werden nicht zu Übersetzungen umgewandelt. Protokollbezogene Cacheschlüssel und Leseprüfungen isolieren ältere ungeprüfte LLM-Ergebnisse. Strukturierter Quellinhalt bleibt als Text übersetzbar.

**Formatprüfung garantiert weder inhaltliche Richtigkeit noch die Erkennung jeder Auslassung.** Sprachlabels sind lokale Anzeigehinweise mit vorsichtiger Kennzeichnung gemischter Schriften; sie blockieren oder routen keine Anfrage.

<a id="free-engines"></a>
### Kostenlose Übersetzungsdienste

Microsoft und Google verwenden `edge.microsoft.com` und `translate-pa.googleapis.com`.

- **Keine offiziellen APIs:** Endpunkte der jeweiligen Web-/Browserübersetzung, ohne öffentlichen Vertrag für diese Erweiterung.
- **Keine Verbindung oder Billigung:** Das Projekt ist weder mit Microsoft/Google verbunden noch gesponsert oder bestätigt. Marken identifizieren nur den gewählten Dienst und gehören ihren Inhabern.
- **Keine Verfügbarkeitsgarantie:** Änderungen oder Ausfälle sind ohne Ankündigung möglich. Ein Wechsel zum eigenen Modell ist möglich; dessen Verfügbarkeit hängt wiederum vom Anbieter ab.
- **Texte werden übermittelt:** Es gelten Bedingungen und Datenschutzregeln des Dienstes. Für sensible Inhalte einen geeigneten eigenen Endpunkt wählen.
- **Keine Gewährleistung:** Nutzung im vorliegenden Zustand und auf eigenes Risiko. Für kommerzielle oder umfangreiche Nutzung offizielle, lizenzierte APIs verwenden.

Microsoft ist für einen nutzbaren Erststart voreingestellt. Ein dem eigenen Modell zugeordneter Bereich verwendet diese öffentlichen Übersetzungsendpunkte nicht mehr.

<a id="privacy"></a>
## Datenschutz und lokale Daten

Kein Relay und keine Telemetrie bedeutet **nicht ausschließlich lokale Verarbeitung**. Cloud-Anbieter erhalten die angefragten Texte; eine lokale Laufzeitumgebung kann die Modellverarbeitung auf deinem Rechner halten. Untertitelabrufe kontaktieren die Videoseite, manuelle Updateprüfungen GitHub. Dienste erhalten übliche Netzwerkmetadaten wie deine IP-Adresse.

Einstellungen, API-Schlüssel und Cache liegen in `chrome.storage.local`. **Die Erweiterung verschlüsselt API-Schlüssel nicht.** Exporte lassen sie standardmäßig weg; ihre Aufnahme erzeugt eine vertraulich zu behandelnde Klartextdatei. Der Cache wird nicht exportiert; es gibt keinen durchsuchbaren Übersetzungsverlauf.

<a id="development"></a>
## Entwicklung

```bash
pnpm install
pnpm dev          # Watch-Build: .output/chrome-mv3-dev/
pnpm test         # Tests im Watch-Modus
pnpm test:run     # Einmaliger Testlauf
pnpm typecheck    # WXT-Typgenerierung + TypeScript
pnpm lint
pnpm build        # Produktion: .output/chrome-mv3/
```

Den Ausgabeordner als entpackte Erweiterung laden. Nach Buildwechsel Erweiterung und Zielseiten neu laden. Änderungen stehen in [CHANGELOG.md](../CHANGELOG.md), Fehler und Wünsche gehören in [Issues](https://github.com/Lewen-Cai/browser-translate/issues). API-Schlüssel und private Seiteninhalte aus Berichten entfernen.

<a id="acknowledgements"></a>
## Danksagung

- [read-frog](https://github.com/mengxi-ream/read-frog) — GPL-3.0; ein hervorragendes Projekt, von dem wir bei der Entwicklung gelernt haben.
- [Lobe Icons](https://github.com/lobehub/lobe-icons) — MIT; Anbieterlogos. Marken bleiben Eigentum ihrer Inhaber und dienen nur der Identifikation.

<a id="license"></a>
## Lizenz

[GPL-3.0](../LICENSE). Verteilte abgeleitete Werke müssen die Pflichten zur Bereitstellung des Quellcodes und zur Lizenzierung erfüllen. Drittmaterial behält seine jeweiligen Lizenzen.
