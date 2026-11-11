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

### 🗺️ 1. Mappa Interattiva Stile Waze + Waze Live Traffic Milano
- **Mappa Vettoriale/Stradale Nitida (Zero API Key richiesta):** basata su Esri World Street Map & OpenStreetMap con **Bubble Pin 3D in stile Waze** per segnalazioni aperte (`🔴`), cantieri in lavorazione (`🟡 🔧`) e interventi risolti (`🟢 ✓`).
- **🚗 Integrazione Waze Live Traffic Milano:** switch istantaneo (`🚗 Waze Traffico Live`) che incorpora la mappa del traffico in tempo reale di Waze su Milano.
- **🛰️ Vista Satellitare HD & Ricerca Geocoding Live:** barra di ricerca per qualsiasi via, piazza o incrocio di Milano + Reverse Geocoding automatico toccando un punto sulla mappa (`+ Segnala su Mappa`).

### 📹 2. Rete Telecamere Urbane Live di Milano & AI Computer Vision
- **5 Nodi Telecamera Strategici a Milano:**
  - `CAM-MI-01` — **Piazza del Duomo / Galleria V. Emanuele**
  - `CAM-MI-02` — **Porta Nuova / Piazza Gae Aulenti & Bosco Verticale**
  - `CAM-MI-03` — **Darsena & Alzaia Naviglio Grande**
  - `CAM-MI-04` — **Fiume Seveso / Viale Fulvio Testi (Niguarda - Monitoraggio Idro)**
  - `CAM-MI-05` — **Corso Buenos Aires / Piazzale Loreto (Area B/C & Ciclabili)**
- **Player Multi-Flusso Reale:** aprendo una telecamera puoi visualizzare il **Live Radar Meteo/Vento (Windy Embed)**, il **Live Traffico Waze dell'incrocio**, l'**AI Vision HUD** e aprire con un click lo **Stream Webcam Live Reale di Milano** (*SkylineWebcams Duomo*, *iLMeteo Navigli/Milano*, *LombardiaWebcam*).

### 📡 3. Pali Intelligenti IoT A2A & Simulatore Scansione QR Code
- **Telemetria Ambientale Live:** ogni Palo Smart A2A mostra indice di qualità dell'aria (`AQI`), concentrazione `PM 2.5`, temperatura/umidità, stato dei corpi illuminanti LED e flussi di traffico.
- **Simulatore Cartello QR Cittadino:** riproduce il cartello giallo/verde **WhatsCity — SCAN ME** per testare l'apertura istantanea di un ticket agganciato ai sensori del palo.

### 🤖 4. WhatsCity AI Copilot & Smart Triage (Architettura Ibrida)
- **AI Smart Triage in Creazione Post:** analizza titolo, descrizione e foto per compilare automaticamente *Categoria*, *Priorità*, *Azienda/Utility suggerita* e segnalare eventuali **ticket duplicati** vicini.
- **Chatbot WhatsCity AI Copilot:** assistente per Cittadini, Aziende e PA. Funziona subito con il motore AI locale integrato e supporta l'inserimento opzionale di una **Google Gemini API Key (`gemini-2.5-flash`)** per interrogazioni generative live.

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
