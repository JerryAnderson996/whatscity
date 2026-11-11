# 🏙️ WhatsCity — La città che ascolta. E risponde.

> **Ecosistema Urbano Collaborativo per Cittadini, Aziende e Pubblica Amministrazione (Milano Smart City · Progetto Re-GenerAction AEB / Gruppo A2A)**

[![Live Demo](https://img.shields.io/badge/🌐_PROVA_L'APP_ONLINE-WhatsCity_Live_Demo-10b981?style=for-the-badge)](https://jerryanderson996.github.io/whatscity/)
[![Status](https://img.shields.io/badge/Stato-MVP_Full--Stack_Attivo-0284c7?style=for-the-badge)](https://jerryanderson996.github.io/whatscity/)
[![AI Copilot](https://img.shields.io/badge/AI-Hybrid_Gemini_%2B_Vision_Triage-f59e0b?style=for-the-badge)](https://jerryanderson996.github.io/whatscity/)

---

## 🚀 Prova subito l'Applicazione Live (PC & Smartphone)

👉 **Link Diretto Web App (Desktop & Mobile PWA):**  
### 🔗 **[https://jerryanderson996.github.io/whatscity/](https://jerryanderson996.github.io/whatscity/)**

- 🖥️ **Da PC / Desktop:** si apre in modalità **Full-Screen Web App** a più colonne con Mappa Waze a tutto schermo, Feed Social e Dashboard Live delle Telecamere e dei Pali IoT A2A di Milano (puoi passare in ogni momento alla cornice smartphone del pitch cliccando su `📱 Vista Tel` in alto a sinistra).
- 📱 **Da Smartphone (iOS / Android):** apri il link e seleziona *"Aggiungi a schermata Home"* per installarla come **PWA nativa**.

---

## 👥 Il Team (Re-GenerAction — Team 8)

- **Jerry El Gendy** — *Ingegnere Informatico & Data/AI Engineer*
- **Davide Ronzulli** — *Laureando Magistrale in Architettura & Urban Designer*
- **Ambra Scarselletta** — *Esperta di Sostenibilità, ESG & Digital Marketing*

---

## 🎯 Il Problema e la Nostra Soluzione

Le app di segnalazione civica tradizionali sono frammentate, non incentivano la partecipazione dei cittadini e lasciano sola la Pubblica Amministrazione nella gestione di migliaia di ticket privi di priorità.

**WhatsCity** crea un ecosistema circolare a **3 attori** su **Milano Smart City**:

1. **🙋‍♀️ STEP 1 — Cittadini (Segnalano, Votano e Guadagnano Premi):**
   - Pubblicano segnalazioni geolocalizzate come post su un social network o scansionando i **QR Code sui Pali Intelligenti A2A**.
   - Seguono lo stato del ticket in tempo reale, confermano la risoluzione sul campo e accumulano punti **City Impact Score** convertibili in premi reali (*Bonus 15€ Bolletta A2A Energia*, *Abbonamento BikeMi + Biglietti ATM*, *Ingressi Musei Civici Milano*, *Alberi ForestaMi*).
2. **🏢 STEP 2 — Aziende Locali & Utility (Intervengono e Guadagnano Reputazione ESG):**
   - Visualizzano i ticket aperti nella propria zona (es. *A2A Illuminazione Pubblica*, *AMSA Gruppo A2A*, *MM S.p.A.*, imprese del verde e stradali).
   - Prendono in carico i lavori, caricano la **foto post-intervento (Prima/Dopo)** e scalano l'**Albo Imprese Virtuose (+50 pt ESG)**.
3. **🏛️ STEP 3 — Pubblica Amministrazione (Coordina, Analizza e Pubblica Open Data):**
   - Monitora in tempo reale la città tramite **Dashboard Analitica**, **Rete Telecamere Live Milano** e **Telemetria IoT dei Pali A2A**.
   - Assegna priorità con il supporto di **WhatsCity AI Copilot** ed esporta i dati pubblici in formato **CSV (Excel)** e **JSON (Open Data)**.

---

## ✨ Funzionalità Principali Implementate

### 🗺️ 1. Mappa Interattiva Stile Waze + Geolocalizzazione GPS Reale del Dispositivo + Waze Live Traffic
- **🎯 Geolocalizzazione GPS Reale del Dispositivo (Multi-Step):** cliccando su **`🎯 La mia posizione GPS`**, l'app interroga la posizione reale del dispositivo (1° step: antenna GPS hardware ad alta precisione; 2° step: posizionamento Wi-Fi/Rete del sistema operativo; 3° step: geolocalizzazione IP reale se l'utente nega il permesso al browser), disegna il **cerchio di precisione in metri (`±m`)**, risolve l'indirizzo reale tramite Reverse Geocoding e posiziona sulla mappa **l'avatar dell'utente registrato**.
- **Mappa Vettoriale/Stradale Nitida (Zero API Key richiesta):** basata su Esri World Street Map & OpenStreetMap con **Bubble Pin 3D in stile Waze** per segnalazioni aperte (`🔴`), cantieri in lavorazione (`🟡 🔧`) e interventi risolti (`🟢 ✓`).
- **🚗 Integrazione Waze Live Traffic Milano:** switch istantaneo (`🚗 Waze Traffico Live`) che incorpora la mappa del traffico in tempo reale di Waze su Milano.
- **🛰️ Vista Satellitare HD & Ricerca Geocoding Live:** barra di ricerca per qualsiasi via, piazza o incrocio di Milano + Reverse Geocoding automatico toccando un punto sulla mappa (`+ Segnala su Mappa`).

### 📹 2. Rete 6 Telecamere Urbane Live di Milano (Link Diretti alle Singole Webcam di Zona)
Ogni telecamera sulla mappa è posizionata esattamente nella zona di Milano in cui è realmente attiva una webcam pubblica live 24/7 e rimanda direttamente al flusso video di quella specifica piazza/quartiere:
- `CAM-MI-01` — **Piazza del Duomo & Galleria V. Emanuele** → [Diretta Live Duomo](https://www.skylinewebcams.com/it/webcam/italia/lombardia/milano/duomo-milano.html)
- `CAM-MI-02` — **Piazza San Babila & Corso Vittorio Emanuele (M4)** → [Diretta Live San Babila](https://www.skylinewebcams.com/it/webcam/italia/lombardia/milano/piazza-san-babila.html)
- `CAM-MI-03` — **Piazza Duca d'Aosta & Stazione Centrale FS** → [Diretta Live Stazione Centrale](https://www.skylinewebcams.com/it/webcam/italia/lombardia/milano/milano-stazione-centrale.html)
- `CAM-MI-04` — **Basilica di San Lorenzo / Colonne & Porta Ticinese** → [Diretta Live San Lorenzo](https://www.skylinewebcams.com/it/webcam/italia/lombardia/milano/basilica-di-san-lorenzo-maggiore.html)
- `CAM-MI-05` — **Skyline Milano CityLife (Tre Torri) & Viale Zara** → [Diretta Live CityLife](https://www.skylinewebcams.com/it/webcam/italia/lombardia/milano/skyline-milano-city-life.html)
- `CAM-MI-06` — **San Siro & Parco Ippodromo (Milano Ovest)** → [Diretta Live San Siro](https://www.skylinewebcams.com/it/webcam/italia/lombardia/milano/san-siro.html)

### 📡 3. Pali Intelligenti IoT A2A & Simulatore Scansione QR Code
- **Telemetria Ambientale Live:** ogni Palo Smart A2A mostra indice di qualità dell'aria (`AQI`), concentrazione `PM 2.5`, temperatura/umidità, stato dei corpi illuminanti LED e flussi di traffico.
- **Simulatore Cartello QR Cittadino:** riproduce il cartello giallo/verde **WhatsCity — SCAN ME** per testare l'apertura istantanea di un ticket agganciato ai sensori del palo.

### 🌱 4. Chatbot "Eco-Bot & Guida Sito" Collegato a un Vero LLM Cloud + AI Smart Triage
- **🧠 Connessione LLM Cloud Reale (Zero Configurazione):** sia il chatbot **`🌱 Eco-Bot & Guida Sito`** sia l'**AI Smart Triage** sono collegati direttamente a un **Large Language Model (LLM) Cloud** che riceve in tempo reale il contesto completo della città (segnalazioni attive, telemetria dei Pali IoT A2A, stato delle 6 telecamere di Milano e punteggio dell'utente loggato) e risponde liberamente a qualsiasi domanda senza bisogno di inserire chiavi API (con supporto aggiuntivo per Google Gemini 2.5 Flash API).
- **🧭 Assistente alla Navigazione del Sito:** spiega come usare ogni sezione dell'applicazione e include una barra **`🧭 Vai a:`** con pulsanti 1-click per saltare direttamente a *Feed Social*, *Mappa & GPS*, *Portale Aziende*, *Premi Eco* o *Dashboard PA*.
- **🌿 Consulente Ecologico & Sostenibilità (Re-GenerAction A2A):** fornisce informazioni e consigli su economia circolare, raccolta differenziata AMSA/A2A, risparmio energetico dei lampioni LED intelligenti, assorbimento di CO₂ con il progetto *ForestaMi* e qualità dell'aria (`AQI` / `PM 2.5`).

### 🔐 5. Vero Social Network con Registrazione Multi-Ruolo & Database
- **Iscrizione e Login Reali:** chiunque può registrarsi scegliendo il ruolo (**Cittadino**, **Azienda B2B con P.IVA**, **Operatore PA**), caricare il proprio avatar e pubblicare post o commenti col proprio profilo.
- **Architettura Database a 3 Livelli:**
  1. Persistenza immediata browser (`LocalStorage`)
  2. Server REST API locale (`serve.ps1` -> endpoint `GET/POST /api/db` su `whatscity_db.json`)
  3. Sincronizzazione Cloud PostgreSQL tramite **Supabase** (schema pronto in [`supabase_schema.sql`](./supabase_schema.sql)).

---

## 🛠️ Struttura Tecnica del Repository

```text
whatscity/
├── index.html               # Entrypoint Web App (Desktop Full-Screen & Mobile PWA)
├── manifest.json            # Configurazione Progressive Web App (PWA)
├── serve.ps1                # Server HTTP + REST API Database locale (/api/db)
├── supabase_schema.sql      # Schema PostgreSQL completo per Supabase Cloud DB
└── src/
    ├── data.js              # Dataset Milano Smart City (Utenti, Pali IoT A2A, Telecamere Live, Ticket)
    ├── App.js               # Core Social Network, Layout Responsive Desktop/Mobile, Feed & Commenti
    ├── MapView.js           # Mappa Stile Waze, Waze Live Traffic Iframe, Telecamere Live & Geocoding
    ├── CreateReportModal.js # Creazione Segnalazione, AI Smart Triage & Simulatore QR Palo A2A
    ├── AICopilot.js         # Motore AI Ibrido (Locale + Google Gemini 2.5 Flash API)
    ├── AuthModal.js         # Registrazione Multi-Ruolo, Login, Directory Iscritti & Config Cloud DB
    └── Views.js             # Portale Aziende (Prima/Dopo), Profilo & Premi Impact, Dashboard PA & OpenData
```

---

## 💻 Esecuzione in Locale (Opzionale)

L'app è già utilizzabile online su **[https://jerryanderson996.github.io/whatscity/](https://jerryanderson996.github.io/whatscity/)**, ma se desideri avviarla in locale sul tuo PC con il server database REST integrato:

```powershell
git clone https://github.com/JerryAnderson996/whatscity.git
cd whatscity
powershell -ExecutionPolicy Bypass -File .\serve.ps1 -Port 8080
```
Poi apri **`http://localhost:8080`** nel browser.
