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

    // Triage euristico istantaneo
    let category = "Strade & Buche";
    let priority = "Media";
    let suggestedCompany = "EdilStrade Briantea S.r.l.";
    let reason = "Rilevato dissesto o manutenzione ordinaria del suolo pubblico.";

    if (text.match(/lampion|luce|led|buio|illuminazion|palo|scintill|cavo/)) {
      category = "Illuminazione";
      priority = "Alta";
      suggestedCompany = "AEB Luce & Reti S.p.A.";
      reason = "Rischio sicurezza notturna / guasto rete illuminazione pubblica AEB.";
    } else if (text.match(/rifiut|spazzatur|ingombrant|sacco|sacchi|cassonett|abbandon|vetro|plastica/)) {
      category = "Rifiuti";
      priority = "Alta";
      suggestedCompany = "Gelsia Ambiente / Eco Azienda";
      reason = "Decoro urbano e igiene pubblica prioritaria.";
    } else if (text.match(/alber|ram|potatur|erba|verde|parco|piant|siep/)) {
      category = "Verde & Alberi";
      priority = text.match(/pericol|cadut|strada|ciclabil/) ? "Alta" : "Media";
      suggestedCompany = "Eco Azienda Brianza";
      reason = "Cura del patrimonio arboreo e sicurezza percorsi.";
    } else if (text.match(/allagament|tombin|caditoi|acqua|fogn|pioggi|esondazion|tarò|idro/)) {
      category = "Sicurezza & Idro";
      priority = "Alta";
      suggestedCompany = "BrianzAcque / Protezione Civile Meda";
      reason = "Prevenzione rischio idrogeologico e allagamenti urbani.";
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
        console.warn("Fallback su motore AI locale:", err);
      }
    }

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

    // Se l'utente ha configurato una Gemini API Key reale, interroga Gemini con tutto il contesto live della città
    if (apiKey) {
      try {
        const systemContext = `Sei "WhatsCity AI Copilot", l'assistente intelligente della piattaforma civica WhatsCity (sviluppata per Re-GenerAction AEB Gruppo A2A - Comune di Meda).
Ruolo utente attuale: ${roleContext}.
Dati città in tempo reale:
- Segnalazioni totali: ${reports.length} (${openReports.length} aperte, ${inProgressReports.length} in lavorazione, ${resolvedReports.length} risolte).
- Segnalazioni aperte critiche: ${openReports.map((r) => `${r.title} (${r.address}, Priorità ${r.priority})`).join("; ")}.
- Pali Intelligenti IoT A2A attivi: ${poles.map((p) => `${p.id} in ${p.address}: AQI ${p.sensor.aqi} (${p.sensor.aqiLabel}), Temp ${p.sensor.temp}, Stato LED: ${p.sensor.ledStatus}`).join(" | ")}.
- Utente corrente: ${appState.currentUser.name} (${appState.currentUser.impactScore} punti City Impact Score).

Rispondi in italiano in modo chiaro, conciso, operativo e strutturato con elenchi puntati quando utile.`;

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
            return { text: replyText, source: "Gemini API Live" };
          }
        }
      } catch (e) {
        console.warn("Errore chiamata Gemini API, uso motore locale:", e);
      }
    }

    // Motore AI Locale Intelligente contestuale (funziona subito offline/senza API key)
    const q = userMessage.toLowerCase();

    if (q.match(/piano|priorit|pa|comune|critic|urgent|sintesi|report/)) {
      return {
        source: "WhatsCity AI Core",
        text: `📊 **Piano d'Azione Prioritario per la PA (Comune di Meda):**\n\n` +
          `1. 🔴 **Emergenza Idro & Allagamenti:** Intervenire subito su *"Caditoia ostruita da fogliame"* in **Via Solferino** (Priorità Alta) per prevenire criticità come l'evento del 22/09/2025.\n` +
          `2. 🔴 **Igiene Urbana:** Assegnare il ticket *"Abbandono rifiuti ingombranti"* in **Via Indipendenza 42** (31 conferme dai cittadini, rilevato da Palo Smart \`QR-MEDA-04\`).\n` +
          `3. 🟡 **Monitoraggio Lavori in Corso:** Verificare il completamento sostituzione driver LED in **Via Roma 14** (\`AEB Luce & Reti S.p.A.\`) e potatura in **Via XXIV Maggio** (\`Eco Azienda Brianza\`).\n\n` +
          `💡 *Stima efficienza:* Risparmio stimato del **38% sui tempi di sopralluogo** grazie alle foto geolocalizzate e telemetria QR.`
      };
    }

    if (q.match(/aria|iot|sensor|pali|palo|temperatura|inquinament|aqi|a2a|led/)) {
      return {
        source: "WhatsCity AI Core · Telemetria IoT A2A",
        text: `📡 **Stato Real-Time Rete Pali Intelligenti AEB / A2A (${poles.length} nodi):**\n\n` +
          poles
            .map(
              (p) =>
                `• **${p.id}** (*${p.address}*): Qualità aria **AQI ${p.sensor.aqi} (${p.sensor.aqiLabel})**, PM2.5 \`${p.sensor.pm25}\`, Temp \`${p.sensor.temp}\` — LED: *${p.sensor.ledStatus}*`
            )
            .join("\n") +
          `\n\n⚠️ **Insight AI:** Il palo \`QR-MEDA-03\` (Via XXIV Maggio) rileva traffico intenso (112 veicoli/ora) e AQI 45: consigliato dimming LED adattivo e controllo lampione secondario.`
      };
    }

    if (q.match(/punti|badge|premi|reward|impact|score|sconto|bolletta/)) {
      return {
        source: "WhatsCity AI Core · Gamification",
        text: `🏅 **Il tuo profilo Civico (${appState.currentUser.name}):**\n\n` +
          `• **City Impact Score attuale:** \`${appState.currentUser.impactScore} punti\`\n` +
          `• **Come guadagnare punti:**\n` +
          `  - **+15 pt** per ogni nuova segnalazione geolocalizzata o via QR Code\n` +
          `  - **+10 pt** quando confermi con foto la risoluzione di un intervento\n` +
          `• **Premi riscattabili subito nella tab Profilo:** Bonus 10€ Bolletta AEB/A2A (100 pt), Voucher Bike Sharing (60 pt), Buono Spesa Zero Waste (80 pt).`
      };
    }

    if (q.match(/aziend|impres|esg|incaric|lavor/)) {
      return {
        source: "WhatsCity AI Core · Portale B2B",
        text: `🏢 **Opportunità per le Aziende Locali (Imprese Virtuose):**\n\n` +
          `Ci sono **${openReports.length} segnalazioni aperte** pronte per essere prese in carico:\n` +
          openReports.map((r) => `• **${r.title}** (${r.address}) — Settore: *${r.category}*`).join("\n") +
          `\n\nCompletando un intervento con foto post-lavori, l'azienda ottiene **+50 punti ESG Reputation**, visibilità diretta nel feed cittadino e certificazione verso la PA.`
      };
    }

    return {
      source: "WhatsCity AI Core",
      text: `Ciao **${appState.currentUser.name}**! 👋 Sono **WhatsCity AI Copilot**.\n\n` +
        `In questo momento a **Meda** monitoriamo **${reports.length} segnalazioni** (${openReports.length} aperte, ${inProgressReports.length} in corso, ${resolvedReports.length} risolte) e **${poles.length} Pali Intelligenti A2A**.\n\n` +
        `Puoi chiedermi:\n` +
        `• *"Genera un piano di priorità per la PA"*\n` +
        `• *"Qual è la qualità dell'aria dei sensori IoT A2A?"*\n` +
        `• *"Quali appalti/incarichi sono aperti per le aziende?"*\n` +
        `• *"Come funzionano i premi e il City Impact Score?"*`
    };
  }
};

// Componente Modale / Drawer per WhatsCity AI Copilot
window.WhatsCityAICopilotModal = function WhatsCityAICopilotModal({
  isOpen,
  onClose,
  appState,
  activeTab,
  onOpenCreateWithDraft
}) {
  const [messages, setMessages] = React.useState([
    {
      role: "assistant",
      source: "WhatsCity AI Copilot",
      text: "Ciao! Sono l'assistente AI di **WhatsCity** (AEB Gruppo A2A). Posso analizzare le criticità urbane in tempo reale, interrogare i sensori IoT dei Pali Intelligenti o generare un piano d'intervento per Comune e Aziende. Come posso aiutarti?"
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
    "📊 Piano d'azione prioritario PA",
    "📡 Analisi sensori IoT Pali A2A",
    "🏢 Segnalazioni aperte per Aziende",
    "🏅 Come riscattare i premi Impact Score?"
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
                <h3 className="font-extrabold text-sm">WhatsCity AI Copilot</h3>
                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950">
                  {apiKeyInput ? "Gemini Live" : "Hybrid AI"}
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
