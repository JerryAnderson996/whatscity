// Motore AI Ibrido per WhatsCity (Gemini API Reale + Fallback Motore Euristico Urbano Locale)
window.WhatsCityAIEngine = {
  STORAGE_KEY_API: "whatscity_gemini_api_key",

  getApiKey() {
    try {
      return localStorage.getItem(this.STORAGE_KEY_API) || "";
    } catch (e) {
      return "";
    }
  },

  setApiKey(key) {
    try {
      if (key && key.trim()) {
        localStorage.setItem(this.STORAGE_KEY_API, key.trim());
      } else {
        localStorage.removeItem(this.STORAGE_KEY_API);
      }
    } catch (e) {}
  },

  // 1. Smart Triage & Deduplicazione Segnalazioni
  async analyzeReportDraft(title, description, existingReports) {
    const text = `${title} ${description}`.toLowerCase();

    // Ricerca eventuali segnalazioni duplicate vicine
    const duplicate = (existingReports || []).find((r) => {
      if (r.status === "resolved") return false;
      const rWords = r.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      return rWords.some((w) => text.includes(w));
    });

    // Triage euristico istantaneo su Milano Smart City
    let category = "Strade & Buche";
    let priority = "Media";
    let suggestedCompany = "MM S.p.A. & Impresa Strade Milano";
    let reason = "Rilevato dissesto su pavé o manutenzione manto stradale a Milano.";

    if (text.match(/lampion|luce|led|buio|illuminazion|palo|scintill|cavo/)) {
      category = "Illuminazione";
      priority = "Alta";
      suggestedCompany = "A2A Illuminazione Pubblica & Smart City";
      reason = "Rischio sicurezza notturna / guasto rete illuminazione pubblica A2A Milano.";
    } else if (text.match(/rifiut|spazzatur|ingombrant|sacco|sacchi|cassonett|cestin|abbandon|vetro|plastica|amsa/)) {
      category = "Rifiuti";
      priority = "Alta";
      suggestedCompany = "AMSA — Gruppo A2A Milano";
      reason = "Decoro urbano e raccolta straordinaria AMSA nei Municipi di Milano.";
    } else if (text.match(/alber|ram|potatur|erba|verde|parco|piant|siep|sempione|bam/)) {
      category = "Verde & Alberi";
      priority = text.match(/pericol|cadut|strada|ciclabil/) ? "Alta" : "Media";
      suggestedCompany = "Consorzio Verde Milano & ForestaMi";
      reason = "Cura del patrimonio arboreo e sicurezza piste ciclabili.";
    } else if (text.match(/allagament|tombin|caditoi|acqua|fogn|pioggi|esondazion|seveso|lambro|navigl|idro/)) {
      category = "Sicurezza & Idro";
      priority = "Alta";
      suggestedCompany = "MM Servizio Idrico & Protezione Civile Milano";
      reason = "Prevenzione rischio idrogeologico (bacino Seveso/Lambro) e pulizia caditoie.";
    }

    const apiKey = this.getApiKey();
    if (apiKey) {
      try {
        const prompt = `Sei il motore AI di Smart Triage Urbano dell'app WhatsCity (Comune di Meda, AEB Gruppo A2A).
Analizza questa segnalazione del cittadino:
Titolo: "${title}"
Descrizione: "${description}"
Rispondi SOLO in JSON valido con le chiavi:
{"category": "una tra Illuminazione | Rifiuti | Verde & Alberi | Strade & Buche | Sicurezza & Idro", "priority": "Alta | Media | Bassa", "suggestedCompany": "nome azienda consigliata", "reason": "breve spiegazione di 12 parole"}`;

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { responseMimeType: "application/json" }
            })
          }
        );
        if (res.ok) {
          const data = await res.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) {
            const parsed = JSON.parse(raw);
            return {
              category: parsed.category || category,
              priority: parsed.priority || priority,
              suggestedCompany: parsed.suggestedCompany || suggestedCompany,
              reason: parsed.reason || reason,
              duplicateReport: duplicate || null,
              engine: "Gemini 2.5 Flash API"
            };
          }
        }
      } catch (err) {
        console.warn("Fallback su Cloud LLM gratuito:", err);
      }
    }

    // Connessione Cloud LLM gratuita per lo Smart Triage (senza API Key)
    try {
      const llmPrompt = `Analizza questa segnalazione urbana a Milano:
Titolo: "${title}"
Descrizione: "${description}"
Rispondi SOLO con un oggetto JSON valido (senza markdown) con queste esatte chiavi:
{"category":"Illuminazione oppure Rifiuti oppure Verde & Alberi oppure Strade & Buche oppure Sicurezza & Idro","priority":"Alta oppure Media oppure Bassa","suggestedCompany":"A2A Illuminazione Pubblica oppure AMSA Gruppo A2A oppure MM S.p.A. oppure Consorzio Verde Milano","reason":"spiegazione tecnica in 12 parole"}`;

      const llmRes = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [{ role: "user", content: llmPrompt }],
          temperature: 0.2
        })
      });
      if (llmRes.ok) {
        const llmData = await llmRes.json();
        const rawText = llmData?.choices?.[0]?.message?.content || "";
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            category: parsed.category || category,
            priority: parsed.priority || priority,
            suggestedCompany: parsed.suggestedCompany || suggestedCompany,
            reason: parsed.reason || reason,
            duplicateReport: duplicate || null,
            engine: "WhatsCity Cloud LLM Triage 🧠"
          };
        }
      }
    } catch (e) {}

    return {
      category,
      priority,
      suggestedCompany,
      reason,
      duplicateReport: duplicate || null,
      engine: "WhatsCity Neural Triage (Locale)"
    };
  },

  // 2. Risposta del Chatbot WhatsCity AI Copilot (Cittadino, Azienda, PA)
  async askCopilot(userMessage, appState, roleContext) {
    const apiKey = this.getApiKey();
    const reports = appState.reports || [];
    const poles = appState.qrPoles || [];
    const openReports = reports.filter((r) => r.status === "open");
    const inProgressReports = reports.filter((r) => r.status === "in_progress");
    const resolvedReports = reports.filter((r) => r.status === "resolved");

    // 1. Se l'utente ha configurato una Gemini API Key personale, usa Google Gemini 2.5 Flash
    const systemContext = `Sei "WhatsCity Eco-Bot & AI Copilot", l'assistente intelligente ufficiale della web app WhatsCity (Milano Smart City — Progetto Re-GenerAction AEB / Gruppo A2A, ideato dal team Jerry El Gendy, Davide Ronzulli, Ambra Scarselletta).
Il tuo compito è triplo:
1) GUIDA ALLA NAVIGAZIONE DEL SITO: spiegare come usare le 5 sezioni dell'app:
   - Tab 1 "Home (Feed Social)": post geolocalizzati dei cittadini, tasto "Grazie", commenti, stories della community e pulsante "+ Segnala".
   - Tab 2 "Mappa": mappa in stile Waze, pulsante "🎯 La mia posizione GPS" (geolocalizza la posizione reale del dispositivo col proprio avatar), "🚗 Waze Traffico Live", 5 Pali Intelligenti IoT A2A con QR Code e 6 Telecamere Live reali di Milano (Duomo, San Babila, Stazione Centrale, San Lorenzo, CityLife, San Siro).
   - Tab 3 "Apps / Aziende (Portale B2B)": le imprese locali e utility (A2A Illuminazione, AMSA, MM S.p.A.) prendono in carico i ticket e caricano la foto post-intervento (Prima/Dopo) guadagnando +50 punti ESG.
   - Tab 4 "Profilo & Premi": gamification con City Impact Score convertibile in sconti bolletta A2A Energia, BikeMi/ATM, Musei Civici e alberi ForestaMi.
   - Tab 5 "Dashboard PA & Open Data": cabina di regia del Comune di Milano con grafici, priorità e download dataset CSV/JSON.
2) ESPERTO ECOLOGICO & SOSTENIBILITÀ URBANA: fornire risposte accurate e consigli pratici su economia circolare, raccolta differenziata AMSA/A2A, mobilità sostenibile, efficienza energetica LED, qualità dell'aria (AQI, PM2.5), forestazione urbana (ForestaMi) e resilienza climatica/idrogeologica.
3) ANALISI DATI LIVE DELLA CITTÀ:
   - Ruolo utente attuale: ${roleContext} (${appState.currentUser.name}, ${appState.currentUser.impactScore} punti Impact Score).
   - Segnalazioni attive a Milano (${reports.length} totali): ${openReports.map((r) => `${r.title} in ${r.address} (Priorità ${r.priority})`).join("; ")}.
   - Telemetria Pali IoT A2A: ${poles.map((p) => `${p.id} (${p.address}): AQI ${p.sensor.aqi} ${p.sensor.aqiLabel}, PM2.5 ${p.sensor.pm25}, Temp ${p.sensor.temp}`).join(" | ")}.

Rispondi sempre in italiano in modo amichevole, preciso, ben formattato (usa elenchi puntati ed emoji) e conciso.`;

    if (apiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: systemContext + "\n\nDomanda utente: " + userMessage }
                  ]
                }
              ]
            })
          }
        );

        if (res.ok) {
          const data = await res.json();
          const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (replyText) {
            return { text: replyText, source: "Google Gemini 2.5 Flash LLM ✨" };
          }
        }
      } catch (e) {
        console.warn("Errore chiamata Gemini API, passo al Cloud LLM gratuito:", e);
      }
    }

    // 2. CONNESSIONE LLM CLOUD REALE GRATUITA (Zero API Key richiesta - OpenAI/Mistral compatibile via Pollinations Text AI)
    try {
      const llmRes = await fetch("https://text.pollinations.ai/openai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "openai",
          messages: [
            { role: "system", content: systemContext },
            { role: "user", content: userMessage }
          ],
          temperature: 0.5
        })
      });

      if (llmRes.ok) {
        const llmData = await llmRes.json();
        const llmReply = llmData?.choices?.[0]?.message?.content;
        if (llmReply && llmReply.trim().length > 5) {
          return {
            text: llmReply.trim(),
            source: "WhatsCity Cloud LLM (Live AI) 🧠"
          };
        }
      }
    } catch (cloudErr) {
      console.warn("Cloud LLM non raggiungibile, uso fallback locale:", cloudErr);
    }

    // Motore AI Locale Intelligente contestuale per Milano Smart City
    const q = userMessage.toLowerCase();
    const cameras = appState.cityCameras || [];

    if (q.match(/navig|guida|come funzion|dove trov|usare|sito|app|sezion|tab|mappa|profilo/)) {
      return {
        source: "WhatsCity Eco-Navigator · Guida Sito",
        actionTab: null,
        text:
          `🧭 **Guida Rapida alla Navigazione di WhatsCity:**\n\n` +
          `• **🏠 1. Home (Feed Social Cittadino):** Vedi le segnalazioni di Milano, metti *"💚 Grazie"*, commenta, apri i profili della community o clicca su **"+ Segnala"**.\n` +
          `• **📍 2. Mappa Waze & Telecamere Live:** Clicca su **"🎯 La mia posizione GPS"** per geolocalizzarti col tuo avatar sulla mappa, esplora le **6 Telecamere Live reali di Milano** (Duomo, San Babila, Stazione Centrale, San Lorenzo, CityLife, San Siro) o attiva **"🚗 Waze Traffico Live"**.\n` +
          `• **⚙️ 3. Portale Aziende (B2B):** Dove utility (A2A, AMSA, MM) e imprese locali prendono in carico i ticket e caricano la foto *Prima/Dopo* (+50 pt ESG).\n` +
          `• **👤 4. Profilo & Premi:** Controlla il tuo **City Impact Score** e riscatta sconti in bolletta A2A, abbonamenti BikeMi/ATM e alberi ForestaMi.\n` +
          `• **📊 5. Dashboard PA & Open Data:** Cabina di regia del Comune di Milano con grafici, controllo priorità e download **CSV/JSON Open Data**.\n\n` +
          `👉 *Usa i pulsanti verdi qui sotto nel chatbot per saltare direttamente alla sezione che ti interessa!*`
      };
    }

    if (q.match(/ecolog|sostenibil|ambient|co2|ricicl|rifiut|differenziat|economia circolar|forestami|verde|energia|risparmi|esg|a2a/)) {
      return {
        source: "WhatsCity Eco-Advisor · Sostenibilità & Economia Circolare",
        actionTab: "profile",
        text:
          `🌿 **Impatto Ecologico & Sostenibilità Urbana (Progetto Re-GenerAction A2A):**\n\n` +
          `• **♻️ Economia Circolare & Decoro (AMSA / A2A):** A Milano la raccolta differenziata supera il 62%. Segnalare rapidamente rifiuti ingombranti o cestini saturi tramite i QR Code riduce del **35% i chilometri percorsi a vuoto** dai mezzi di raccolta, tagliando le emissioni di CO₂.\n` +
          `• **💡 Smart Lighting LED & Sensori IoT:** I Pali Intelligenti A2A regolano l'intensità luminosa (*Smart Dimming*) in base al traffico e alla luce naturale, risparmiando fino al **55% di energia elettrica**.\n` +
          `• **🌳 ForestaMi & Resilienza Climatica:** Ogni 150 punti *City Impact Score* puoi adottare un albero a Milano (un albero adulto assorbe fino a **20-30 kg di CO₂ all'anno** e mitiga le isole di calore estive).\n` +
          `• **💧 Prevenzione Idrogeologica:** Segnalare le caditoie ostruite prima dei temporali protegge i quartieri dalle esondazioni urbane.`
      };
    }

    if (q.match(/telecamer|cam|video|traffico|ztl|area c|area b|seveso/)) {
      return {
        source: "WhatsCity AI Core · Rete 6 Telecamere Reali Milano",
        actionTab: "map",
        text:
          `📹 **Monitoraggio Live Telecamere Urbane di Milano (${cameras.length} postazioni verificate):**\n\n` +
          cameras
            .map(
              (c) =>
                `• **${c.id}** (*${c.name}*): \`${c.aiAnalytics.vehiclesPerHour}\` — 🤖 *${c.aiAnalytics.anomalyDetected}*`
            )
            .join("\n") +
          `\n\n🔗 Cliccando su ogni telecamera nella **Mappa** si apre la diretta streaming specifica di quella zona esatta (*Duomo, San Babila, Stazione Centrale, San Lorenzo, CityLife, San Siro*).`
      };
    }

    if (q.match(/piano|priorit|pa|comune|critic|urgent|sintesi|report/)) {
      return {
        source: "WhatsCity AI Core · Sala Operativa Comune di Milano",
        text:
          `📊 **Piano d'Azione Prioritario per la PA (Comune di Milano — Municipi 1-9):**\n\n` +
          `1. 🔴 **Emergenza Idro Seveso (Municipio 9):** Intervento immediato MM S.p.A. su *"Caditoie ostruite in Viale Fulvio Testi"* rilevato anche da \`CAM-MI-04\`.\n` +
          `2. 🔴 **Sicurezza Ciclabile & LED (Municipio 3):** Ripristino lampione spento in **Corso Buenos Aires 32** (Palo \`QR-MI-LORETO-03\`) affidato ad \`A2A Illuminazione Pubblica\`.\n` +
          `3. 🟡 **Decoro Navigli (Municipio 6):** Raccolta straordinaria \`AMSA Gruppo A2A\` lungo **Ripa di Porta Ticinese / Darsena** (confermata da \`CAM-MI-03\`).\n\n` +
          `💡 *Impatto Smart City:* Riduzione del **42% dei tempi di presa in carico** incrociando post social cittadini, QR Pali A2A e Computer Vision delle telecamere.`
      };
    }

    if (q.match(/aria|iot|sensor|pali|palo|temperatura|inquinament|aqi|a2a|led/)) {
      return {
        source: "WhatsCity AI Core · Telemetria IoT A2A Milano",
        text:
          `📡 **Stato Real-Time Rete Pali Intelligenti A2A Milano (${poles.length} nodi):**\n\n` +
          poles
            .map(
              (p) =>
                `• **${p.id}** (*${p.address}*): Qualità aria **AQI ${p.sensor.aqi} (${p.sensor.aqiLabel})**, PM2.5 \`${p.sensor.pm25}\`, Temp \`${p.sensor.temp}\` — LED: *${p.sensor.ledStatus}*`
            )
            .join("\n") +
          `\n\n⚠️ **Insight AI:** Il nodo \`QR-MI-LORETO-03\` (Corso Buenos Aires) registra traffico intenso (1.380 veicoli/h) e PM2.5 a 19 µg/m³.`
      };
    }

    if (q.match(/punti|badge|premi|reward|impact|score|sconto|bolletta|atm|bikemi/)) {
      return {
        source: "WhatsCity AI Core · Gamification Milano",
        text:
          `🏅 **Profilo Civico di ${appState.currentUser.name} (Milano):**\n\n` +
          `• **City Impact Score attuale:** \`${appState.currentUser.impactScore} punti\`\n` +
          `• **Premi riscattabili nella tab Profilo:**\n` +
          `  - ⚡ **Bonus 15€ Bolletta A2A Energia Milano** (120 pt)\n` +
          `  - 🚲 **Abbonamento BikeMi + 3 Biglietti ATM** (70 pt)\n` +
          `  - 🏛️ **Pass Musei Civici Milano / Triennale** (90 pt)\n` +
          `  - 🌳 **Adotta un Albero con ForestaMi** (150 pt)`
      };
    }

    if (q.match(/aziend|impres|esg|incaric|lavor|amsa/)) {
      return {
        source: "WhatsCity AI Core · Portale B2B Milano",
        text:
          `🏢 **Ticket Aperti per Imprese & Utility a Milano (${openReports.length} interventi):**\n\n` +
          openReports
            .map((r) => `• **${r.title}** (${r.address}, *${r.zone}*) — Settore: *${r.category}*`)
            .join("\n") +
          `\n\nCompletando l'intervento con foto Prima/Dopo, l'impresa ottiene **+50 punti ESG Reputation** nell'Albo Imprese Virtuose del Comune di Milano.`
      };
    }

    return {
      source: "WhatsCity AI Core · Milano Smart City",
      text:
        `Ciao **${appState.currentUser.name}**! 👋 Sono **WhatsCity AI Copilot** per **Milano Smart City**.\n\n` +
        `In questo momento a **Milano** monitoriamo **${reports.length} segnalazioni**, **${poles.length} Pali Intelligenti A2A** e **${cameras.length} Telecamere Urbane Live** (Duomo, Porta Nuova, Navigli, Buenos Aires, Niguarda/Seveso).\n\n` +
        `Prova a chiedermi:\n` +
        `• *"Mostrami lo stato delle telecamere live e del Seveso"*\n` +
        `• *"Genera il piano di priorità PA per i Municipi di Milano"*\n` +
        `• *"Qual è la qualità dell'aria sui Pali IoT A2A?"*\n` +
        `• *"Come riscatto i premi ATM, BikeMi e A2A Energia?"*`
    };
  }
};

// Componente Modale + Assistente Navigazione & Sostenibilità (WhatsCity AI & Eco-Bot)
window.WhatsCityAICopilotModal = function WhatsCityAICopilotModal({
  isOpen,
  onClose,
  appState,
  activeTab,
  onNavigateTab,
  onOpenCreateReport,
  onOpenAuth
}) {
  const [messages, setMessages] = React.useState([
    {
      role: "assistant",
      source: "WhatsCity AI & Eco-Navigator 🌱",
      text: "Ciao! Sono il **Chatbot di Navigazione & Sostenibilità di WhatsCity** (Progetto Re-GenerAction AEB / Gruppo A2A).\n\nPosso **guidarti tra le sezioni del sito**, portarti direttamente alle **telecamere live di Milano**, aiutarti a **geolocalizzarti sulla mappa** e darti consigli pratici su **ecologia, raccolta differenziata, risparmio energetico e qualità dell'aria**. Dove vuoi andare o cosa vuoi scoprire?"
    }
  ]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [showApiConfig, setShowApiConfig] = React.useState(false);
  const [apiKeyInput, setApiKeyInput] = React.useState(() =>
    window.WhatsCityAIEngine.getApiKey()
  );

  const chatEndRef = React.useRef(null);

  React.useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const roleMap = {
    home: "Cittadino (Feed Social)",
    map: "Esplorazione Mappa & Sensori IoT",
    activity: "Azienda Locale (Portale B2B)",
    profile: "Cittadino Attivo (Gamification & Premi)",
    dashboard: "Pubblica Amministrazione (Cabina di Regia PA)"
  };

  const quickPrompts = [
    "🧭 Guida alla navigazione del sito",
    "🌿 Consigli Ecologici & Impatto CO₂",
    "📹 Dove sono le 6 Telecamere Live?",
    "📊 Piano d'azione prioritario PA Milano",
    "📡 Qualità dell'aria Pali IoT A2A"
  ];

  const handleSend = async (textToSend) => {
    const query = (textToSend !== undefined ? textToSend : input).trim();
    if (!query || isLoading) return;

    const userMsg = { role: "user", text: query };
    setMessages((prev) => [...prev, userMsg]);
    if (textToSend === undefined) setInput("");
    setIsLoading(true);

    const reply = await window.WhatsCityAIEngine.askCopilot(
      query,
      appState,
      roleMap[activeTab] || "Cittadino"
    );

    setMessages((prev) => [
      ...prev,
      { role: "assistant", text: reply.text, source: reply.source }
    ]);
    setIsLoading(false);
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    window.WhatsCityAIEngine.setApiKey(apiKeyInput);
    setShowApiConfig(false);
  };

  return (
    <div className="fixed inset-0 z-[950] bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden h-[86vh] sm:h-[680px] flex flex-col border border-emerald-500/30">
        {/* Header AI Copilot */}
        <div className="bg-gradient-to-r from-[#052e2b] via-[#0a5c48] to-[#0e9f6e] text-white px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-400/20 border border-emerald-300/40 flex items-center justify-center text-lg shadow-inner">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm">WhatsCity Eco-Bot & LLM</h3>
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                  {apiKeyInput ? "Gemini 2.5 LLM" : "Cloud LLM Attivo"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/80">
                Assistente Civico, Telemetria IoT A2A & Decision Support PA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowApiConfig(!showApiConfig)}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-emerald-200"
              title="Configura Gemini API Key"
            >
              🔑 API
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Configurazione opzionale Gemini API Key */}
        {showApiConfig && (
          <form
            onSubmit={handleSaveKey}
            className="bg-slate-900 text-white p-3.5 border-b border-slate-800 space-y-2 animate-fadeIn"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">
                ⚡ Modalità AI Ibrida (Google Gemini 2.5 Flash)
              </span>
              <span className="text-[10px] text-slate-400">Opzionale</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              L'app include già un motore AI locale istantaneo. Se inserisci una{" "}
              <strong>Gemini API Key</strong>, il Copilot e lo Smart Triage useranno
              direttamente Google Gemini in tempo reale.
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Incolla qui la tua AIzaSy... Gemini API Key"
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
              />
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-3.5 py-1.5 rounded-xl"
              >
                Salva
              </button>
            </div>
          </form>
        )}

        {/* Messaggi Chat */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs whitespace-pre-line ${
                  m.role === "user"
                    ? "bg-[#0a5c48] text-white rounded-br-none"
                    : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-none"
                }`}
              >
                {m.source && m.role === "assistant" && (
                  <div className="text-[10px] font-extrabold text-emerald-700 mb-1 flex items-center gap-1">
                    <span>🤖</span>
                    <span>{m.source}</span>
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200 w-fit">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Elaborazione dati urbani e sensori A2A in corso...</span>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Barra Navigazione Assistita 1-Click dentro il Chatbot */}
        <div className="px-3.5 py-2 bg-emerald-950 text-white flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar border-b border-emerald-800">
          <span className="text-[10px] font-extrabold text-emerald-300 whitespace-nowrap mr-1">
            🧭 Vai a:
          </span>
          {[
            { id: "home", label: "🏠 Feed Social" },
            { id: "map", label: "📍 Mappa & GPS" },
            { id: "activity", label: "🏢 Aziende" },
            { id: "profile", label: "🎁 Premi Eco" },
            { id: "dashboard", label: "📊 Dashboard PA" }
          ].map((nav) => (
            <button
              key={nav.id}
              type="button"
              onClick={() => {
                if (onNavigateTab) onNavigateTab(nav.id);
                onClose();
              }}
              className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-emerald-500 hover:text-slate-950 text-[10px] font-extrabold whitespace-nowrap transition"
            >
              {nav.label}
            </button>
          ))}
        </div>

        {/* Suggerimenti Rapidi */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {quickPrompts.map((qp, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSend(qp)}
              className="px-2.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-[11px] font-bold whitespace-nowrap transition"
            >
              {qp}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Chiedi al Copilot (es. criticità, sensori aria, priorità PA)..."
            className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-[#0e9f6e] hover:bg-[#0a7c56] disabled:opacity-50 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-sm transition"
          >
            Invia
          </button>
        </form>
      </div>
    </div>
  );
};
