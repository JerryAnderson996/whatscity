// App Principale WhatsCity: Feed Social Cittadino, Dettaglio Ticket, AI Copilot, Notifiche, 5 Tab
window.WhatsCityApp = function WhatsCityApp() {
  const STORAGE_KEY = "whatscity_state_v2";

  const [state, setState] = React.useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn("LocalStorage non disponibile:", e);
    }
    return window.WHATSCITY_INITIAL_DATA;
  });

  const [activeTab, setActiveTab] = React.useState("home"); // home, map, activity, profile, dashboard
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showSearchBar, setShowSearchBar] = React.useState(false);
  const [selectedCategoryChip, setSelectedCategoryChip] = React.useState("Tutte");

  // Modali
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [preselectedPole, setPreselectedPole] = React.useState(null);
  const [preselectedCoords, setPreselectedCoords] = React.useState(null);
  const [selectedReportDetail, setSelectedReportDetail] = React.useState(null);
  const [newCommentText, setNewCommentText] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState(null);

  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }, [state]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3400);
  };

  const unreadNotifCount = (state.notifications || []).filter((n) => !n.read).length;

  // Azione: Ringrazia ("Grazie" con cuore come in Pagina 8 PDF)
  const handleToggleThanks = (reportId) => {
    setState((prev) => ({
      ...prev,
      reports: prev.reports.map((r) => {
        if (r.id !== reportId) return r;
        const already = r.thankedByMe;
        return {
          ...r,
          thankedByMe: !already,
          thanksCount: already ? r.thanksCount - 1 : r.thanksCount + 1
        };
      })
    }));
  };

  // Azione: Crea nuova segnalazione geolocalizzata
  const handleCreateReport = (newRepData) => {
    const created = {
      id: "rep-" + Date.now(),
      authorName: state.currentUser.name,
      authorRole: state.currentUser.userType,
      authorAvatar: state.currentUser.avatar,
      title: newRepData.title,
      description: newRepData.description,
      category: newRepData.category,
      priority: newRepData.priority,
      status: "open",
      statusLabel: "Aperta",
      zone: newRepData.zone || "Centro",
      address: newRepData.address,
      lat: newRepData.lat,
      lng: newRepData.lng,
      qrPoleId: newRepData.qrPoleId,
      createdAt: "Adesso",
      thanksCount: 1,
      thankedByMe: true,
      citizenConfirmed: false,
      assignedCompany: null,
      image: newRepData.image,
      afterImage: null,
      comments: []
    };

    const newNotif = {
      id: "not-" + Date.now(),
      title: "Segnalazione pubblicata con successo!",
      body: `Hai guadagnato +15 City Impact Score per '${created.title}'.`,
      time: "Adesso",
      read: false,
      type: "reward"
    };

    setState((prev) => ({
      ...prev,
      currentUser: {
        ...prev.currentUser,
        impactScore: prev.currentUser.impactScore + 15
      },
      notifications: [newNotif, ...(prev.notifications || [])],
      reports: [created, ...prev.reports]
    }));

    showToast("Segnalazione pubblicata! +15 City Impact Score 🌱");
  };

  // Azione Azienda: Prendi in carico ticket
  const handleTakeCharge = (reportId, companyName) => {
    setState((prev) => ({
      ...prev,
      reports: prev.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: "in_progress",
              statusLabel: "In attesa di completamento",
              assignedCompany: companyName,
              comments: [
                ...r.comments,
                {
                  author: companyName,
                  text: "Segnalazione presa in carico. Squadra operativa assegnata.",
                  time: "Adesso"
                }
              ]
            }
          : r
      )
    }));
    showToast(`Ticket preso in carico da ${companyName} 🛠️`);
  };

  // Azione Azienda/Cittadino: Segna come Risolto con foto post-intervento
  const handleResolveReport = (reportId, companyName, afterImageUrl) => {
    setState((prev) => ({
      ...prev,
      reports: prev.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: "resolved",
              statusLabel: "Completato",
              assignedCompany: companyName || r.assignedCompany || "Impresa Locale",
              afterImage:
                afterImageUrl ||
                r.afterImage ||
                "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80",
              comments: [
                ...r.comments,
                {
                  author: companyName || r.assignedCompany || "Team Tecnico",
                  text: "Intervento completato e documentato con foto post-lavori! ✅",
                  time: "Adesso"
                }
              ]
            }
          : r
      )
    }));
    showToast("Intervento completato! +50 Punti ESG Impresa Virtuosa 🏆");
  };

  // Azione Cittadino (Step 1 Pagina 10 PDF): Conferma risoluzione sul campo (+10 pt)
  const handleCitizenConfirmResolution = (reportId) => {
    setState((prev) => ({
      ...prev,
      currentUser: {
        ...prev.currentUser,
        impactScore: prev.currentUser.impactScore + 10
      },
      reports: prev.reports.map((r) =>
        r.id === reportId
          ? {
              ...r,
              citizenConfirmed: true,
              comments: [
                ...r.comments,
                {
                  author: prev.currentUser.name + " (Cittadino Verificatore)",
                  text: "Ho verificato di persona: problema risolto perfettamente! 👏",
                  time: "Adesso"
                }
              ]
            }
          : r
      )
    }));
    showToast("Risoluzione confermata dal cittadino! +10 City Impact Score 🌟");
  };

  // Azione Cittadino: Riscatta premio con City Impact Score
  const handleRedeemReward = (reward) => {
    if (state.currentUser.impactScore < reward.cost) return;
    setState((prev) => ({
      ...prev,
      currentUser: {
        ...prev.currentUser,
        impactScore: prev.currentUser.impactScore - reward.cost,
        redeemedRewards: [...(prev.currentUser.redeemedRewards || []), reward.id]
      }
    }));
    showToast(`Premio riscattato: ${reward.title}! 🎁`);
  };

  // Azione PA: Cambia Priorità
  const handleChangePriority = (reportId, newPriority) => {
    setState((prev) => ({
      ...prev,
      reports: prev.reports.map((r) =>
        r.id === reportId ? { ...r, priority: newPriority } : r
      )
    }));
    showToast(`Priorità aggiornata a ${newPriority} dalla PA`);
  };

  // Aggiungi commento nel dettaglio ticket
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedReportDetail) return;

    const commentObj = {
      author: state.currentUser.name,
      text: newCommentText.trim(),
      time: "Adesso"
    };

    setState((prev) => ({
      ...prev,
      reports: prev.reports.map((r) =>
        r.id === selectedReportDetail.id
          ? { ...r, comments: [...r.comments, commentObj] }
          : r
      )
    }));

    setSelectedReportDetail((prev) => ({
      ...prev,
      comments: [...prev.comments, commentObj]
    }));
    setNewCommentText("");
  };

  // Reset dati demo allo stato iniziale del pitch
  const handleResetDemo = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(window.WHATSCITY_INITIAL_DATA);
    showToast("Dati demo ripristinati allo stato iniziale della presentazione!");
  };

  const filteredFeed = state.reports.filter((r) => {
    const matchSearch =
      !searchQuery.trim() ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat =
      selectedCategoryChip === "Tutte" || r.category === selectedCategoryChip;
    return matchSearch && matchCat;
  });

  const getHeaderTitle = () => {
    switch (activeTab) {
      case "home":
        return "WhatsCity";
      case "map":
        return "Mappa";
      case "activity":
        return "Attività";
      case "profile":
        return "Profilo";
      case "dashboard":
        return "Dashboard";
      default:
        return "WhatsCity";
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col lg:flex-row items-center justify-center lg:gap-8 p-0 sm:p-4">
      {/* Pannello Laterale Desktop (Presentazione Pitch & Controlli Demo Rapidi) */}
      <div className="hidden lg:flex flex-col justify-between w-80 bg-[#052e2b] text-white rounded-3xl p-6 shadow-2xl border border-emerald-500/30 self-stretch max-h-[860px]">
        <div className="space-y-4">
          {/* Logo WhatsCity (Pagina 3 PDF) */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-2xl shadow-lg">
              ✓
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">
                Whats<span className="text-emerald-400">City</span>
              </h1>
              <p className="text-xs text-emerald-200/80 font-medium">
                La città che ascolta. E risponde.
              </p>
            </div>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-xs space-y-1.5">
            <div className="text-emerald-300 font-bold uppercase tracking-wider text-[10px]">
              Re-GenerAction · AEB Gruppo A2A
            </div>
            <p className="text-emerald-100/90 leading-relaxed">
              Ecosistema urbano collaborativo per{" "}
              <strong>Cittadini, Aziende e PA</strong> con sensori IoT Pali
              Intelligenti A2A e <strong>WhatsCity AI Copilot</strong>.
            </p>
          </div>

          {/* Selettore Ruolo / Interfaccia (Pagine 8 e 9 PDF) */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-300 block">
              Schermate del Progetto:
            </span>
            {[
              { id: "home", label: "📱 1. Feed Social Cittadino", sub: "Pag. 8 SX" },
              { id: "map", label: "🗺️ 2. Mappa & Pali IoT A2A", sub: "Pag. 8 Centro" },
              { id: "profile", label: "🏅 3. Profilo & Premi Impact", sub: "Pag. 8 DX" },
              { id: "activity", label: "🏢 4. Portale Aziende (B2B)", sub: "Pag. 9 SX" },
              { id: "dashboard", label: "📊 5. Dashboard PA & OpenData", sub: "Pag. 9 DX" }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full text-left px-3.5 py-2.5 rounded-2xl text-xs transition flex items-center justify-between border ${
                  activeTab === item.id
                    ? "bg-emerald-500 text-slate-950 font-extrabold border-emerald-400 shadow-md"
                    : "bg-white/5 text-emerald-100 hover:bg-white/10 border-white/10"
                }`}
              >
                <span>{item.label}</span>
                <span
                  className={`text-[10px] ${
                    activeTab === item.id ? "text-slate-900 font-bold" : "text-emerald-300/60"
                  }`}
                >
                  {item.sub}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-3 border-t border-white/10">
          <button
            onClick={() => setIsAICopilotOpen(true)}
            className="w-full bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 text-slate-950 font-extrabold text-xs py-2.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            <span>✨</span>
            <span>Apri WhatsCity AI Copilot</span>
          </button>
          <button
            onClick={() => {
              setPreselectedPole(null);
              setPreselectedCoords(null);
              setIsCreateOpen(true);
            }}
            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs py-2.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            <span>📷</span>
            <span>Simula Scan QR Palo A2A</span>
          </button>
          <button
            onClick={handleResetDemo}
            className="w-full text-[11px] text-emerald-300/70 hover:text-white py-1 transition"
          >
            ↺ Ripristina dati iniziali della demo
          </button>
        </div>
      </div>

      {/* Cornice Smartphone Principale (Design fedele alle Pagine 8 e 9 del PDF) */}
      <div className="w-full sm:w-[420px] h-screen sm:h-[860px] bg-[#f4f7f6] sm:rounded-[42px] shadow-2xl overflow-hidden flex flex-col relative sm:border-[10px] sm:border-slate-800">
        {/* Top Header Verde Smeraldo (Identico al prototipo Pagina 8 e 9) */}
        <header className="bg-[#10b981] text-slate-950 px-4 py-3.5 flex items-center justify-between shadow-sm z-30 flex-shrink-0">
          <div className="flex items-center gap-2">
            {activeTab === "activity" || activeTab === "dashboard" ? (
              <button
                onClick={() => setActiveTab("home")}
                className="w-8 h-8 rounded-full hover:bg-black/10 flex items-center justify-center font-bold text-lg"
                title="Torna alla Home"
              >
                ‹
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsNotificationsOpen(!isNotificationsOpen);
                  setState((prev) => ({
                    ...prev,
                    notifications: (prev.notifications || []).map((n) => ({
                      ...n,
                      read: true
                    }))
                  }));
                }}
                className="relative w-8 h-8 rounded-full hover:bg-black/10 flex items-center justify-center font-bold text-base"
                title="Notifiche Cittadine"
              >
                🔔
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-600 border border-white" />
                )}
              </button>
            )}
          </div>

          <h1 className="font-extrabold text-lg tracking-tight text-slate-900">
            {getHeaderTitle()}
          </h1>

          <div className="flex items-center gap-1.5">
            {/* Bottone AI Copilot sempre accessibile nella Top Bar */}
            <button
              onClick={() => setIsAICopilotOpen(true)}
              className="bg-[#052e2b] text-emerald-300 text-[11px] font-extrabold px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 hover:bg-slate-900 transition"
              title="Apri WhatsCity AI Copilot"
            >
              <span>✨</span>
              <span>AI</span>
            </button>
            <button
              onClick={() => {
                if (activeTab !== "home") setActiveTab("home");
                setShowSearchBar(!showSearchBar);
              }}
              className="w-8 h-8 rounded-full hover:bg-black/10 flex items-center justify-center text-slate-900 font-bold"
              title="Cerca segnalazioni"
            >
              🔍
            </button>
          </div>
        </header>

        {/* Drawer Centro Notifiche */}
        {isNotificationsOpen && (
          <div className="bg-white border-b border-slate-200 p-3.5 shadow-lg z-40 animate-fadeIn space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900">
                🔔 Notifiche in Tempo Reale (Step 1)
              </span>
              <button
                onClick={() => setIsNotificationsOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-700"
              >
                Chiudi ✕
              </button>
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {(state.notifications || []).map((n) => (
                <div
                  key={n.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
                >
                  <div className="flex justify-between font-bold text-slate-900">
                    <span>{n.title}</span>
                    <span className="text-[10px] text-slate-400">{n.time}</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">{n.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barra di ricerca espandibile */}
        {showSearchBar && activeTab === "home" && (
          <div className="bg-emerald-600 px-4 py-2.5 animate-fadeIn">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per via, problema (es. lampione, rifiuti)..."
              className="w-full px-3.5 py-2 rounded-xl text-xs bg-white text-slate-900 focus:outline-none shadow-inner"
            />
          </div>
        )}

        {/* Toast di notifica */}
        {toastMessage && (
          <div className="absolute top-16 left-4 right-4 z-[800] bg-slate-900/95 text-emerald-300 text-xs font-bold px-4 py-3 rounded-2xl shadow-xl border border-emerald-500/40 flex items-center justify-between animate-fadeIn">
            <span>{toastMessage}</span>
            <button onClick={() => setToastMessage(null)} className="text-white ml-2">
              ✕
            </button>
          </div>
        )}

        {/* Area Contenuto Principale Scorrevole */}
        <main className="flex-1 overflow-y-auto relative">
          {/* TAB 1: HOME FEED SOCIAL CITTADINO (Pagina 8 Sinistra PDF) */}
          {activeTab === "home" && (
            <div className="p-3.5 space-y-3.5 pb-24">
              {/* Banner Azione Rapida: Apri Segnalazione o Scansiona QR Palo A2A */}
              <div className="bg-gradient-to-r from-[#052e2b] to-[#0a5c48] text-white rounded-3xl p-3.5 shadow-md flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-lg shadow">
                    📷
                  </div>
                  <div>
                    <h2 className="font-extrabold text-xs sm:text-sm">
                      Vedi un problema in città?
                    </h2>
                    <p className="text-[11px] text-emerald-200/90">
                      Pubblica con AI Triage o scansiona il QR sul palo A2A
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setPreselectedPole(null);
                    setPreselectedCoords(null);
                    setIsCreateOpen(true);
                  }}
                  className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs px-3.5 py-2 rounded-xl whitespace-nowrap shadow-sm transition"
                >
                  + Segnala
                </button>
              </div>

              {/* Chips Filtro Categoria */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  "Tutte",
                  "Illuminazione",
                  "Rifiuti",
                  "Verde & Alberi",
                  "Strade & Buche",
                  "Sicurezza & Idro"
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryChip(cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                      selectedCategoryChip === cat
                        ? "bg-[#0a5c48] text-white shadow-xs"
                        : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-100"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Lista Card Social delle Segnalazioni (Design identico a Pagina 8 Sinistra) */}
              {filteredFeed.map((post) => (
                <article
                  key={post.id}
                  className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 space-y-3 transition hover:shadow-md"
                >
                  {/* Intestazione Autore */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-10 h-10 rounded-full object-cover border border-emerald-500/30"
                      />
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm leading-tight">
                          {post.authorName}
                        </h3>
                        <span className="text-[11px] text-slate-500 block">
                          {post.authorRole} · {post.createdAt}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                        post.status === "resolved"
                          ? "bg-emerald-100 text-emerald-800"
                          : post.status === "in_progress"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {post.statusLabel}
                    </span>
                  </div>

                  {/* Titolo & Descrizione */}
                  <div
                    onClick={() => setSelectedReportDetail(post)}
                    className="cursor-pointer"
                  >
                    <h4 className="font-extrabold text-slate-900 text-base leading-snug hover:text-emerald-700 transition">
                      {post.title}
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {post.description}
                    </p>
                  </div>

                  {/* Tag Geolocalizzazione + eventuale Palo Smart A2A */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span
                      onClick={() => setActiveTab("map")}
                      className="bg-slate-100 hover:bg-emerald-50 text-slate-700 font-semibold px-2.5 py-1 rounded-lg cursor-pointer flex items-center gap-1"
                    >
                      <span>📍</span>
                      <span>{post.address}</span>
                    </span>
                    {post.qrPoleId && (
                      <span className="bg-emerald-950 text-emerald-300 font-bold px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <span>📡</span>
                        <span>{post.qrPoleId}</span>
                      </span>
                    )}
                    {post.assignedCompany && (
                      <span className="bg-sky-50 text-sky-800 border border-sky-200 font-bold px-2.5 py-1 rounded-lg">
                        🏢 {post.assignedCompany}
                      </span>
                    )}
                  </div>

                  {/* Immagine del Post (con eventuale badge Prima/Dopo se risolto) */}
                  <div
                    onClick={() => setSelectedReportDetail(post)}
                    className="relative rounded-2xl overflow-hidden bg-slate-100 max-h-56 cursor-pointer border border-slate-100"
                  >
                    <img
                      src={post.afterImage || post.image}
                      alt={post.title}
                      className="w-full h-52 object-cover hover:scale-105 transition duration-300"
                    />
                    {post.afterImage && (
                      <span className="absolute top-2.5 left-2.5 bg-emerald-600/95 text-white text-[10px] font-extrabold px-2.5 py-1 rounded-lg shadow">
                        📸 Foto Post-Intervento Verificata
                      </span>
                    )}
                  </div>

                  {/* Barra Azioni Social: "Grazie" e "Condividi" (Come in Pagina 8 Sinistra) */}
                  <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-700">
                    <button
                      onClick={() => handleToggleThanks(post.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition ${
                        post.thankedByMe
                          ? "bg-emerald-50 text-emerald-700"
                          : "hover:bg-slate-100 text-slate-700"
                      }`}
                    >
                      <span className="text-sm">{post.thankedByMe ? "💚" : "🖤"}</span>
                      <span>Grazie ({post.thanksCount})</span>
                    </button>

                    <button
                      onClick={() => setSelectedReportDetail(post)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                    >
                      <span>💬</span>
                      <span> Aggiornamenti ({post.comments.length})</span>
                    </button>

                    <button
                      onClick={() =>
                        showToast(`Link segnalazione "${post.title}" copiato! 🔗`)
                      }
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                    >
                      <span>↗</span>
                      <span>Condividi</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}

          {/* TAB 2: MAPPA INTERATTIVA + SENSORI IOT A2A (Pagina 8 Centro PDF) */}
          {activeTab === "map" && (
            <window.WhatsCityMapView
              reports={state.reports}
              qrPoles={state.qrPoles}
              onSelectReport={(rep) => setSelectedReportDetail(rep)}
              onOpenNewReportFromPole={(pole) => {
                setPreselectedCoords(null);
                setPreselectedPole(pole);
                setIsCreateOpen(true);
              }}
              onOpenNewReportAtCoords={(coordsObj) => {
                setPreselectedPole(null);
                setPreselectedCoords(coordsObj);
                setIsCreateOpen(true);
              }}
            />
          )}

          {/* TAB 3: PORTALE AZIENDE / ATTIVITÀ (Pagina 9 Sinistra PDF) */}
          {activeTab === "activity" && (
            <window.WhatsCityCompanyView
              reports={state.reports}
              onTakeCharge={handleTakeCharge}
              onResolveReport={handleResolveReport}
              onSelectReport={(rep) => setSelectedReportDetail(rep)}
            />
          )}

          {/* TAB 4: PROFILO CITTADINO, PREMI & IMPACT SCORE (Pagina 8 Destra PDF) */}
          {activeTab === "profile" && (
            <window.WhatsCityProfileView
              user={state.currentUser}
              rewardsCatalog={state.rewardsCatalog}
              reports={state.reports}
              onSelectReport={(rep) => setSelectedReportDetail(rep)}
              onRedeemReward={handleRedeemReward}
            />
          )}

          {/* TAB 5: DASHBOARD PA, OPEN DATA & ANALISI DATI (Pagina 9 Destra PDF) */}
          {activeTab === "dashboard" && (
            <window.WhatsCityDashboardView
              reports={state.reports}
              qrPoles={state.qrPoles}
              onChangePriority={handleChangePriority}
              onSelectReport={(rep) => setSelectedReportDetail(rep)}
              onOpenAICopilot={() => setIsAICopilotOpen(true)}
            />
          )}
        </main>

        {/* Floating Action Buttons: AI Copilot + Nuova Segnalazione */}
        {activeTab === "home" && (
          <div className="absolute bottom-20 right-4 z-40 flex flex-col items-end gap-2.5">
            <button
              onClick={() => setIsAICopilotOpen(true)}
              className="px-3.5 py-2 rounded-full bg-[#052e2b] hover:bg-slate-900 text-emerald-300 shadow-xl border border-emerald-400/50 flex items-center gap-1.5 text-xs font-extrabold transition transform hover:scale-105"
              title="Chiedi a WhatsCity AI Copilot"
            >
              <span>✨</span>
              <span>AI Copilot</span>
            </button>
            <button
              onClick={() => {
                setPreselectedPole(null);
                setPreselectedCoords(null);
                setIsCreateOpen(true);
              }}
              className="w-14 h-14 rounded-full bg-[#0a5c48] hover:bg-[#052e2b] text-white shadow-xl border-2 border-emerald-400 flex items-center justify-center text-2xl font-black transition transform hover:scale-105"
              title="Nuova Segnalazione"
            >
              +
            </button>
          </div>
        )}

        {/* Bottom Navigation Bar a 5 voci (Identica ai mockup Pagine 8 e 9 del PDF) */}
        <nav className="bg-[#085a49] text-white px-2 py-2 flex items-center justify-around border-t border-emerald-600/40 z-30 flex-shrink-0">
          {[
            { id: "home", label: "Home", icon: "🏠" },
            { id: "map", label: "Mappa", icon: "📍" },
            { id: "activity", label: "Apps / Aziende", icon: "⚙️" },
            { id: "profile", label: "Profilo", icon: "👤" },
            { id: "dashboard", label: "Dashboard", icon: "📊" }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition ${
                  isActive
                    ? "text-[#fbbf24] font-extrabold scale-105"
                    : "text-emerald-100/80 hover:text-white font-medium"
                }`}
              >
                <span className="text-lg leading-none">{tab.icon}</span>
                <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Modale Dettaglio Segnalazione, Confronto Foto Prima/Dopo & Conferma Cittadino */}
        {selectedReportDetail && (
          <div className="fixed inset-0 z-[850] bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              <div className="relative h-48 bg-slate-900">
                <img
                  src={selectedReportDetail.afterImage || selectedReportDetail.image}
                  alt={selectedReportDetail.title}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setSelectedReportDetail(null)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/75 text-white flex items-center justify-center font-bold"
                >
                  ✕
                </button>
                <span
                  className={`absolute bottom-3 left-3 text-xs font-extrabold px-3 py-1 rounded-full shadow ${
                    selectedReportDetail.status === "resolved"
                      ? "bg-emerald-500 text-white"
                      : selectedReportDetail.status === "in_progress"
                      ? "bg-amber-400 text-slate-950"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {selectedReportDetail.statusLabel}
                </span>
              </div>

              <div className="p-4 overflow-y-auto space-y-3 flex-1">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Segnalato da <strong>{selectedReportDetail.authorName}</strong>
                  </span>
                  <span>Priorità: {selectedReportDetail.priority}</span>
                </div>

                <h3 className="font-extrabold text-slate-900 text-base">
                  {selectedReportDetail.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {selectedReportDetail.description}
                </p>

                {/* Confronto fotografico Prima / Dopo quando risolto */}
                {selectedReportDetail.afterImage && (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="rounded-xl overflow-hidden border border-slate-200">
                      <span className="block bg-slate-800 text-white text-[10px] font-bold px-2 py-0.5">
                        PRIMA (Segnalazione)
                      </span>
                      <img
                        src={selectedReportDetail.image}
                        alt="Prima"
                        className="w-full h-20 object-cover"
                      />
                    </div>
                    <div className="rounded-xl overflow-hidden border border-emerald-400">
                      <span className="block bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5">
                        DOPO (Intervento Azienda)
                      </span>
                      <img
                        src={selectedReportDetail.afterImage}
                        alt="Dopo"
                        className="w-full h-20 object-cover"
                      />
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/70 text-xs space-y-1">
                  <div>
                    📍 <strong>Indirizzo:</strong> {selectedReportDetail.address}
                  </div>
                  {selectedReportDetail.assignedCompany && (
                    <div>
                      🏢 <strong>Impresa incaricata:</strong>{" "}
                      <span className="text-emerald-700 font-bold">
                        {selectedReportDetail.assignedCompany}
                      </span>
                    </div>
                  )}
                </div>

                {/* Azioni rapide cambio stato Cittadino -> Azienda -> PA */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {selectedReportDetail.status === "open" && (
                    <button
                      onClick={() => {
                        handleTakeCharge(
                          selectedReportDetail.id,
                          "Eco Azienda Brianza"
                        );
                        setSelectedReportDetail((prev) => ({
                          ...prev,
                          status: "in_progress",
                          statusLabel: "In lavorazione",
                          assignedCompany: "Eco Azienda Brianza"
                        }));
                      }}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 rounded-xl"
                    >
                      🛠️ Simula Presa in Carico Azienda
                    </button>
                  )}
                  {selectedReportDetail.status !== "resolved" && (
                    <button
                      onClick={() => {
                        handleResolveReport(
                          selectedReportDetail.id,
                          selectedReportDetail.assignedCompany || "Eco Azienda Brianza"
                        );
                        setSelectedReportDetail((prev) => ({
                          ...prev,
                          status: "resolved",
                          statusLabel: "Completato",
                          afterImage:
                            "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80"
                        }));
                      }}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2 rounded-xl"
                    >
                      ✅ Completa Intervento
                    </button>
                  )}
                  {selectedReportDetail.status === "resolved" &&
                    !selectedReportDetail.citizenConfirmed && (
                      <button
                        onClick={() => {
                          handleCitizenConfirmResolution(selectedReportDetail.id);
                          setSelectedReportDetail((prev) => ({
                            ...prev,
                            citizenConfirmed: true
                          }));
                        }}
                        className="w-full bg-[#0a5c48] hover:bg-[#052e2b] text-white font-extrabold text-xs py-2.5 rounded-xl shadow"
                      >
                        🌟 Conferma Risoluzione come Cittadino (+10 Impact Score)
                      </button>
                    )}
                </div>

                {/* Cronologia Commenti PA / Azienda / Cittadini */}
                <div className="pt-2 border-t border-slate-200">
                  <h4 className="font-extrabold text-xs text-slate-800 mb-2">
                    Cronologia & Risposte Ufficiali ({selectedReportDetail.comments.length})
                  </h4>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedReportDetail.comments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Nessun aggiornamento ancora registrato.
                      </p>
                    ) : (
                      selectedReportDetail.comments.map((c, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-100 rounded-xl p-2.5 text-xs"
                        >
                          <div className="flex justify-between font-bold text-slate-800">
                            <span>{c.author}</span>
                            <span className="text-[10px] text-slate-400">{c.time}</span>
                          </div>
                          <p className="text-slate-600 mt-0.5">{c.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <form onSubmit={handleAddComment} className="mt-2.5 flex gap-1.5">
                    <input
                      type="text"
                      value={newCommentText}
                      onChange={(e) => setNewCommentText(e.target.value)}
                      placeholder="Scrivi un commento o aggiornamento..."
                      className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                    <button
                      type="submit"
                      className="bg-[#0a5c48] text-white font-bold text-xs px-3.5 py-2 rounded-xl"
                    >
                      Invia
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modale Creazione Segnalazione / Scan QR / AI Smart Triage */}
        <window.WhatsCityCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreateReport={handleCreateReport}
          qrPoles={state.qrPoles}
          existingReports={state.reports}
          preselectedPole={preselectedPole}
          preselectedCoords={preselectedCoords}
        />

        {/* Modale WhatsCity AI Copilot */}
        <window.WhatsCityAICopilotModal
          isOpen={isAICopilotOpen}
          onClose={() => setIsAICopilotOpen(false)}
          appState={state}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
};

// Mount dell'applicazione React
const rootElement = document.getElementById("root");
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<window.WhatsCityApp />);
}
