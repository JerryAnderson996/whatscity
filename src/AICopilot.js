// Motore AI Ufficiale Google Gemini Pro / Flash per WhatsCity (Milano Smart City - Gruppo A2A)
window.WhatsCityAIEngine = {
  STORAGE_KEY_API: "whatscity_gemini_api_key",
  STORAGE_KEY_MODEL: "whatscity_gemini_model",
  DEFAULT_API_KEY: "", // Può essere popolata dall'utente o salvata nel browser

  getApiKey() {
    try {
      return localStorage.getItem(this.STORAGE_KEY_API) || this.DEFAULT_API_KEY || "";
    } catch (e) {
      return this.DEFAULT_API_KEY || "";
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

  getModel() {
    try {
      return localStorage.getItem(this.STORAGE_KEY_MODEL) || "gemini-2.5-pro";
    } catch (e) {
      return "gemini-2.5-pro";
    }
  },

  setModel(modelName) {
    try {
      localStorage.setItem(this.STORAGE_KEY_MODEL, modelName);
    } catch (e) {}
  },

  // Chiamata diretta alle API ufficiali Google Gemini (con fallback automatico di modello se gemini-2.5-pro ha rate limit)
  async callGeminiAPI(apiKey, promptText, jsonMode = false, chatHistory = null) {
    const preferredModel = this.getModel();
    const modelsToTry = [
      preferredModel,
      "gemini-2.5-pro",
      "gemini-2.5-flash",
      "gemini-1.5-pro"
    ].filter((v, i, a) => a.indexOf(v) === i);

    let lastError = null;

    for (const model of modelsToTry) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          apiKey
        )}`;

        const bodyPayload = {
          contents: chatHistory || [{ role: "user", parts: [{ text: promptText }] }],
          generationConfig: jsonMode
            ? { responseMimeType: "application/json", temperature: 0.2 }
            : { temperature: 0.7 }
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyPayload)
        });

        const data = await res.json();

        if (res.ok) {
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            return { ok: true, text, modelUsed: model };
          }
        } else {
          lastError = data?.error?.message || `HTTP ${res.status}`;
          // Se la chiave API non è valida, inutile provare altri modelli
          if (res.status === 400 && lastError.toLowerCase().includes("api key not valid")) {
            return { ok: false, error: "Chiave API Google Gemini non valida. Verifica di aver copiato l'intera chiave che inizia con AIzaSy..." };
          }
        }
      } catch (err) {
        lastError = err.message || String(err);
      }
    }

    return {
      ok: false,
      error: lastError || "Impossibile contattare i server Google Gemini."
    };
  },

  // 1. Smart Triage & Deduplicazione Segnalazioni tramite Google Gemini
  async analyzeReportDraft(title, description, existingReports) {
    const text = `${title} ${description}`.toLowerCase();

    const duplicate = (existingReports || []).find((r) => {
      if (r.status === "resolved") return false;
      const rWords = r.title.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
      return rWords.some((w) => text.includes(w));
    });

    const apiKey = this.getApiKey();
    if (apiKey) {
      const prompt = `Sei il motore AI di Smart Triage Urbano dell'app WhatsCity (Milano Smart City — Gruppo A2A).
Analizza questa segnalazione del cittadino a Milano:
Titolo: "${title}"
Descrizione: "${description}"
Rispondi SOLO in JSON valido con le chiavi:
{"category": "una tra Illuminazione | Rifiuti | Verde & Alberi | Strade & Buche | Sicurezza & Idro", "priority": "Alta | Media | Bassa", "suggestedCompany": "nome utility/azienda consigliata a Milano (es. A2A Illuminazione Pubblica, AMSA Gruppo A2A, MM S.p.A., Consorzio Verde Milano)", "reason": "spiegazione tecnica in 15 parole"}`;

      const geminiRes = await this.callGeminiAPI(apiKey, prompt, true);
      if (geminiRes.ok) {
        try {
          const jsonMatch = geminiRes.text.match(/\{[\s\S]*\}/);
          const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : geminiRes.text);
          return {
            category: parsed.category || "Strade & Buche",
            priority: parsed.priority || "Media",
            suggestedCompany: parsed.suggestedCompany || "MM S.p.A. & Impresa Strade Milano",
            reason: parsed.reason || "Analisi effettuata con Google Gemini.",
            duplicateReport: duplicate || null,
            engine: `Google ${geminiRes.modelUsed} ✨`
          };
        } catch (e) {}
      }
    }

    // Fallback solo per i menu a tendina se l'utente non ha ancora inserito la chiave API
    let category = "Strade & Buche";
    let priority = "Media";
    let suggestedCompany = "MM S.p.A. & Impresa Strade Milano";
    let reason = "Inserisci la tua Google Gemini API Key nel chatbot per il triage generativo avanzato.";

    if (text.match(/lampion|luce|led|buio|illuminazion|palo/)) {
      category = "Illuminazione";
      priority = "Alta";
      suggestedCompany = "A2A Illuminazione Pubblica & Smart City";
    } else if (text.match(/rifiut|spazzatur|ingombrant|sacco|cassonett|cestin|amsa/)) {
      category = "Rifiuti";
      priority = "Alta";
      suggestedCompany = "AMSA — Gruppo A2A Milano";
    } else if (text.match(/alber|ram|potatur|erba|verde|parco/)) {
      category = "Verde & Alberi";
      suggestedCompany = "Consorzio Verde Milano & ForestaMi";
    } else if (text.match(/allagament|tombin|caditoi|acqua|seveso|idro/)) {
      category = "Sicurezza & Idro";
      priority = "Alta";
      suggestedCompany = "MM Servizio Idrico & Protezione Civile Milano";
    }

    return {
      category,
      priority,
      suggestedCompany,
      reason,
      duplicateReport: duplicate || null,
      engine: "Triage Rapido (Configura Gemini API Key per AI Pro)"
    };
  },

  // 2. Conversazione Reale Multi-Turn con Google Gemini Pro / Flash (NESSUNA RISPOSTA PRE-IMPOSTATA!)
  async askCopilot(userMessage, appState, roleContext, previousMessages) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        needsApiKey: true,
        source: "Configurazione Google Gemini Richiesta 🔑",
        text: "Per garantirti risposte generative reali al 100% (senza alcuna risposta pre-impostata), incolla qui sopra la tua **Google Gemini API Key** (`AIzaSy...`) e clicca su **Attiva Gemini Pro**."
      };
    }

    const reports = appState.reports || [];
    const poles = appState.qrPoles || [];
    const cameras = appState.cityCameras || [];
    const openReports = reports.filter((r) => r.status === "open");
    const inProgressReports = reports.filter((r) => r.status === "in_progress");
    const resolvedReports = reports.filter((r) => r.status === "resolved");

    const systemContext = `Sei "WhatsCity Eco-Bot & AI Copilot" (alimentato da Google Gemini Pro), l'assistente intelligente ufficiale della web app WhatsCity (Milano Smart City — Progetto Re-GenerAction AEB / Gruppo A2A, creato dal team Jerry El Gendy, Davide Ronzulli, Ambra Scarselletta).

ISTRUZIONI FONDAMENTALI:
- Rispondi in modo naturale, intelligente, approfondito e personalizzato a QUALSIASI domanda dell'utente.
- Sei sia una guida alla navigazione del sito WhatsCity, sia un esperto di ecologia/sostenibilità urbana/economia circolare/transizione energetica, sia un analista in tempo reale dei dati di Milano.

CONTESTO LIVE DELL'APPLICAZIONE IN QUESTO ISTANTE:
- Utente loggato: ${appState.currentUser.name} (Ruolo: ${roleContext}, Quartiere: ${appState.currentUser.neighborhood}, Punti City Impact Score: ${appState.currentUser.impactScore}).
- Segnalazioni totali a Milano: ${reports.length} (${openReports.length} aperte, ${inProgressReports.length} in lavorazione, ${resolvedReports.length} completate).
- Dettaglio segnalazioni: ${reports.map((r) => `[${r.statusLabel}] "${r.title}" in ${r.address} (${r.zone}, Priorità ${r.priority}, Azienda: ${r.assignedCompany || "da assegnare"})`).join("; ")}.
- Telemetria Pali Intelligenti IoT A2A Milano: ${poles.map((p) => `${p.id} (${p.address}): AQI ${p.sensor.aqi} (${p.sensor.aqiLabel}), PM2.5 ${p.sensor.pm25}, Temp ${p.sensor.temp}, LED: ${p.sensor.ledStatus}`).join(" | ")}.
- 6 Telecamere Live Reali di Milano: ${cameras.map((c) => `${c.id} ${c.name}: ${c.aiAnalytics.vehiclesPerHour}, AI Vision: ${c.aiAnalytics.anomalyDetected}`).join(" | ")}.
- Struttura del sito:
  1. Tab "Home": Feed Social cittadino, "Grazie", commenti, stories utenti registrati.
  2. Tab "Mappa": Mappa Waze-style, bottone "🎯 La mia posizione GPS" (geolocalizzazione reale dispositivo), "🚗 Waze Traffico Live", 6 Telecamere Live con streaming reale (Duomo, San Babila, Stazione Centrale, San Lorenzo, CityLife, San Siro) e 5 Pali IoT A2A.
  3. Tab "Apps / Aziende": Portale B2B dove imprese e utility (A2A, AMSA, MM) prendono in carico i ticket e caricano foto Prima/Dopo (+50 pt ESG).
  4. Tab "Profilo": Gamification e catalogo premi (Bonus 15€ Bolletta A2A, BikeMi+ATM, Musei Civici, Albero ForestaMi).
  5. Tab "Dashboard": Cabina di regia PA Comune di Milano con grafici, priorità e download Open Data CSV/JSON.`;

    // Costruisci la cronologia conversazionale per Gemini
    const historyContents = [
      {
        role: "user",
        parts: [{ text: "ISTRUZIONI DI SISTEMA E CONTESTO LIVE:\n" + systemContext }]
      },
      {
        role: "model",
        parts: [
          {
            text: "Ho ricevuto il contesto live di WhatsCity Milano Smart City. Risponderò in modo generativo, preciso e contestualizzato a ogni domanda dell'utente."
          }
        ]
      }
    ];

    (previousMessages || []).slice(-8).forEach((m) => {
      if (m.isSystemWelcome) return;
      historyContents.push({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      });
    });

    historyContents.push({
      role: "user",
      parts: [{ text: userMessage }]
    });

    const result = await this.callGeminiAPI(apiKey, userMessage, false, historyContents);

    if (result.ok) {
      return {
        text: result.text,
        source: `Google ${result.modelUsed} (Live LLM) ✨`
      };
    } else {
      return {
        needsApiKey: true,
        source: "Errore API Google Gemini ⚠️",
        text: `⚠️ **Errore durante la chiamata a Google Gemini:** ${result.error}\n\nControlla la tua chiave API o seleziona il modello \`gemini-2.5-flash\` / \`gemini-2.5-pro\` nel pannello qui sopra.`
      };
    }
  }
};

// Componente Modale Chatbot WhatsCity alimentato da Google Gemini Pro / Flash
window.WhatsCityAICopilotModal = function WhatsCityAICopilotModal({
  isOpen,
  onClose,
  appState,
  activeTab,
  onNavigateTab
}) {
  const [apiKeyInput, setApiKeyInput] = React.useState(() =>
    window.WhatsCityAIEngine.getApiKey()
  );
  const [selectedModel, setSelectedModel] = React.useState(() =>
    window.WhatsCityAIEngine.getModel()
  );
  // Se non c'è ancora la chiave salvata, apri subito il box per incollarla!
  const [showApiConfig, setShowApiConfig] = React.useState(
    () => !Boolean(window.WhatsCityAIEngine.getApiKey())
  );

  const [messages, setMessages] = React.useState([
    {
      role: "assistant",
      isSystemWelcome: true,
      source: "Google Gemini Pro · WhatsCity Eco-Bot 🌱",
      text: "Ciao! Sono l'assistente AI di **WhatsCity** collegato direttamente alle API ufficiali **Google Gemini Pro / Flash**.\n\nNon uso risposte pre-impostate: chiedimi qualsiasi cosa in linguaggio naturale (es. *consigli ecologici, funzionamento del sito, analisi in tempo reale delle 6 telecamere e dei Pali A2A di Milano o strategie ESG*)."
    }
  ]);
  const [input, setInput] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

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
    "🧭 Spiegami come navigare il sito WhatsCity",
    "🌿 Come riduciamo la CO₂ a Milano con A2A e ForestaMi?",
    "📹 Analizza le criticità attuali su Milano",
    "📊 Genera un piano d'azione per il Comune di Milano"
  ];

  const handleSend = async (textToSend) => {
    const query = (textToSend !== undefined ? textToSend : input).trim();
    if (!query || isLoading) return;

    if (!window.WhatsCityAIEngine.getApiKey()) {
      setShowApiConfig(true);
    }

    const userMsg = { role: "user", text: query };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    if (textToSend === undefined) setInput("");
    setIsLoading(true);

    const reply = await window.WhatsCityAIEngine.askCopilot(
      query,
      appState,
      roleMap[activeTab] || "Cittadino",
      messages
    );

    if (reply.needsApiKey) {
      setShowApiConfig(true);
    }

    setMessages((prev) => [
      ...prev,
      { role: "assistant", text: reply.text, source: reply.source }
    ]);
    setIsLoading(false);
  };

  const handleSaveKey = (e) => {
    e.preventDefault();
    window.WhatsCityAIEngine.setApiKey(apiKeyInput);
    window.WhatsCityAIEngine.setModel(selectedModel);
    setShowApiConfig(false);
  };

  const hasSavedKey = Boolean(window.WhatsCityAIEngine.getApiKey());

  return (
    <div className="fixed inset-0 z-[950] bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden h-[88vh] sm:h-[720px] flex flex-col border border-emerald-500/30">
        {/* Header Google Gemini Pro */}
        <div className="bg-gradient-to-r from-[#052e2b] via-[#0a5c48] to-[#0e9f6e] text-white px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-400/20 border border-emerald-300/40 flex items-center justify-center text-lg shadow-inner">
              ✨
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-sm">WhatsCity Gemini Pro AI</h3>
                <span
                  className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                    hasSavedKey
                      ? "bg-emerald-400 text-slate-950"
                      : "bg-amber-400 text-slate-950 animate-pulse"
                  }`}
                >
                  {hasSavedKey ? selectedModel : "Inserisci API Key"}
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/80">
                Connessione diretta Google Gemini API (Zero risposte pre-impostate)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowApiConfig(!showApiConfig)}
              className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-[11px] font-extrabold text-slate-950 shadow"
              title="Inserisci o modifica la tua Google Gemini API Key"
            >
              🔑 {hasSavedKey ? "Cambia Key" : "Attiva Gemini Key"}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Pannello Configurazione Google Gemini Pro API Key */}
        {showApiConfig && (
          <form
            onSubmit={handleSaveKey}
            className="bg-slate-900 text-white p-4 border-b border-slate-800 space-y-3 animate-fadeIn"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-400">
                🔑 Collega la tua Google Gemini API Key (Pro / Flash)
              </span>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-sky-400 hover:underline"
              >
                Prendi la tua Key su Google AI Studio ↗
              </a>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Incolla qui la tua chiave API di Google (inizia con <code>AIzaSy...</code>). Viene salvata <strong>solo in locale nel tuo browser</strong> e mai pubblicata su GitHub, permettendoti di usare il tuo piano Google Gemini in totale sicurezza.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="password"
                required
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-400"
              />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-2.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-emerald-300 font-bold"
              >
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
              </select>
            </div>

            <div className="flex justify-end gap-2">
              {hasSavedKey && (
                <button
                  type="button"
                  onClick={() => setShowApiConfig(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Chiudi
                </button>
              )}
              <button
                type="submit"
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs px-4 py-2 rounded-xl shadow"
              >
                ✓ Salva e Attiva Google Gemini Pro
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
                    <span>✨</span>
                    <span>{m.source}</span>
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-white px-3.5 py-2.5 rounded-2xl border border-slate-200 w-fit shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Google Gemini ({selectedModel}) sta generando la risposta...</span>
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
            placeholder="Scrivi qualsiasi domanda per Google Gemini Pro..."
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
