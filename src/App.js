// App Principale WhatsCity: Social Network Civico con Registrazione/Login DB, AI Copilot, Mappe IoT e 5 Tab
window.WhatsCityApp = function WhatsCityApp() {
  const STORAGE_KEY = "whatscity_state_milano_v7";

  const [state, setState] = React.useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.users && parsed.reports && parsed.cityCameras) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("LocalStorage non disponibile:", e);
    }
    return window.WHATSCITY_INITIAL_DATA;
  });

  const [backendStatusLabel, setBackendStatusLabel] = React.useState(
    "Database Persistente Attivo 🟢"
  );
  const [activeTab, setActiveTab] = React.useState("home"); // home, map, activity, profile, dashboard
  const [desktopMode, setDesktopMode] = React.useState(true); // true = Full-Screen Web App su PC, false = Cornice Smartphone Pitch
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showSearchBar, setShowSearchBar] = React.useState(false);
  const [selectedCategoryChip, setSelectedCategoryChip] = React.useState("Tutte");

  // Modali
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [isAICopilotOpen, setIsAICopilotOpen] = React.useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = React.useState(false);
  const [preselectedPole, setPreselectedPole] = React.useState(null);
  const [preselectedCoords, setPreselectedCoords] = React.useState(null);
  const [selectedReportDetail, setSelectedReportDetail] = React.useState(null);
  const [viewedPublicProfile, setViewedPublicProfile] = React.useState(null);
  const [newCommentText, setNewCommentText] = React.useState("");
  const [toastMessage, setToastMessage] = React.useState(null);

  // Sincronizzazione iniziale dal Backend (Supabase Cloud o Server Locale /api/db)
  React.useEffect(() => {
    let mounted = true;
    if (window.WhatsCityAuthService) {
      window.WhatsCityAuthService.syncFromBackend(state).then((res) => {
        if (!mounted || !res) return;
        setBackendStatusLabel(res.backendType);
        if (res.users && res.reports) {
          setState((prev) => ({
            ...prev,
            users: res.users,
            reports: res.reports
          }));
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  // Salvataggio automatico su LocalStorage + sincronizzazione Backend
  React.useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {}
  }, [state]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const unreadNotifCount = (state.notifications || []).filter((n) => !n.read).length;

  // Registrazione di un nuovo utente (Cittadino, Azienda, PA) nel Database
  const handleRegisterUser = (newUser) => {
    const welcomeNotif = {
      id: "not-" + Date.now(),
      title: `Benvenuto in WhatsCity, ${newUser.name}! 🎉`,
      body: `Il tuo profilo (${newUser.roleBadge}) è attivo nel database con +50 punti City Impact Score di bonus.`,
      time: "Adesso",
      read: false,
      type: "reward"
    };

    setState((prev) => {
      const updated = {
        ...prev,
        users: [newUser, ...(prev.users || [])],
        currentUser: newUser,
        notifications: [welcomeNotif, ...(prev.notifications || [])]
      };
      if (window.WhatsCityAuthService) {
        window.WhatsCityAuthService.persistToBackend(updated, newUser, null);
      }
      return updated;
    });

    showToast(`Account creato! Benvenuto/a ${newUser.name} (+50 Impact Score) 🎉`);
  };

  // Login o Switch ad un altro utente registrato nel DB
  const handleLoginSuccess = (userObj) => {
    const defaultBadges = window.WHATSCITY_INITIAL_DATA.currentUser.badges;
    const enrichedUser = {
      ...userObj,
      badges: userObj.badges && userObj.badges.length ? userObj.badges : defaultBadges,
      redeemedRewards: userObj.redeemedRewards || []
    };

    setState((prev) => ({
      ...prev,
      currentUser: enrichedUser
    }));

    // Se l'utente è un'azienda o una PA, possiamo opzionalmente mostrare un messaggio contestuale
    showToast(`Accesso effettuato come ${userObj.name} (${userObj.roleBadge}) 🔐`);
  };

  // Visualizza il profilo pubblico di un autore cliccando sul suo nome/avatar nel feed
  const handleOpenAuthorProfile = (authorName) => {
    const found = (state.users || []).find(
      (u) => u.name.toLowerCase() === (authorName || "").toLowerCase()
    );
    if (found) {
      setViewedPublicProfile(found);
    } else {
      setViewedPublicProfile({
        name: authorName,
        roleBadge: "Membro Community WhatsCity",
        userType: "Utente Verificato",
        avatar:
          "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
        bio: "Partecipa attivamente al miglioramento urbano di Meda.",
        neighborhood: "Meda",
        impactScore: 110,
        reportsCount: 4
      });
    }
  };

  // Azione: Ringrazia ("Grazie" con cuore come in Pagina 8 PDF)
  const handleToggleThanks = (reportId) => {
    setState((prev) => {
      const updated = {
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
      };
      if (window.WhatsCityAuthService) {
        window.WhatsCityAuthService.persistToBackend(updated, null, null);
      }
      return updated;
    });
  };

  // Azione: Crea nuova segnalazione geolocalizzata associata all'utente loggato
  const handleCreateReport = (newRepData) => {
    const created = {
      id: "rep-" + Date.now(),
      authorId: state.currentUser.id,
      authorName: state.currentUser.name,
      authorRole: state.currentUser.userType || state.currentUser.roleBadge,
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
      title: "Segnalazione pubblicata nel Feed Social!",
      body: `${state.currentUser.name} ha guadagnato +15 City Impact Score per '${created.title}'.`,
      time: "Adesso",
      read: false,
      type: "reward"
    };

    setState((prev) => {
      const newScore = (prev.currentUser.impactScore || 0) + 15;
      const updatedCurrentUser = {
        ...prev.currentUser,
        impactScore: newScore,
        reportsCount: (prev.currentUser.reportsCount || 0) + 1
      };
      const updatedUsers = (prev.users || []).map((u) =>
        u.id === updatedCurrentUser.id ? updatedCurrentUser : u
      );
      const updatedState = {
        ...prev,
        currentUser: updatedCurrentUser,
        users: updatedUsers,
        notifications: [newNotif, ...(prev.notifications || [])],
        reports: [created, ...prev.reports]
      };

      if (window.WhatsCityAuthService) {
        window.WhatsCityAuthService.persistToBackend(
          updatedState,
          updatedCurrentUser,
          created
        );
      }
      return updatedState;
    });

    showToast("Post pubblicato sul Feed Social! +15 City Impact Score 🌱");
  };

  // Azione Azienda: Prendi in carico ticket
  const handleTakeCharge = (reportId, companyName) => {
    const actorName =
      state.currentUser.role === "company" ? state.currentUser.name : companyName;

    setState((prev) => {
      const updated = {
        ...prev,
        reports: prev.reports.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: "in_progress",
                statusLabel: "In attesa di completamento",
                assignedCompany: actorName,
                comments: [
                  ...r.comments,
                  {
                    author: actorName,
                    text: "Segnalazione presa in carico. Squadra operativa assegnata.",
                    time: "Adesso"
                  }
                ]
              }
            : r
        )
      };
      if (window.WhatsCityAuthService) {
        window.WhatsCityAuthService.persistToBackend(updated, null, null);
      }
      return updated;
    });
    showToast(`Ticket preso in carico da ${actorName} 🛠️`);
  };

  // Azione Azienda/Cittadino: Segna come Risolto con foto post-intervento
  const handleResolveReport = (reportId, companyName, afterImageUrl) => {
    const actorName =
      state.currentUser.role === "company"
        ? state.currentUser.name
        : companyName || "Impresa Locale";

    setState((prev) => {
      const updated = {
        ...prev,
        reports: prev.reports.map((r) =>
          r.id === reportId
            ? {
                ...r,
                status: "resolved",
                statusLabel: "Completato",
                assignedCompany: actorName,
                afterImage:
                  afterImageUrl ||
                  r.afterImage ||
                  "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80",
                comments: [
                  ...r.comments,
                  {
                    author: actorName,
                    text: "Intervento completato e documentato con foto post-lavori! ✅",
                    time: "Adesso"
                  }
                ]
              }
            : r
        )
      };
      if (window.WhatsCityAuthService) {
        window.WhatsCityAuthService.persistToBackend(updated, null, null);
      }
      return updated;
    });
    showToast("Intervento completato! +50 Punti ESG Impresa Virtuosa 🏆");
  };

  // Azione Cittadino: Conferma risoluzione sul campo (+10 pt)
  const handleCitizenConfirmResolution = (reportId) => {
    setState((prev) => {
      const updatedUser = {
        ...prev.currentUser,
        impactScore: (prev.currentUser.impactScore || 0) + 10
      };
      const updated = {
        ...prev,
        currentUser: updatedUser,
        users: (prev.users || []).map((u) => (u.id === updatedUser.id ? updatedUser : u)),
        reports: prev.reports.map((r) =>
          r.id === reportId
            ? {
                ...r,
                citizenConfirmed: true,
                comments: [
                  ...r.comments,
                  {
                    author: prev.currentUser.name + " (Verifica Cittadina)",
                    text: "Ho verificato di persona: problema risolto perfettamente! 👏",
                    time: "Adesso"
                  }
                ]
              }
            : r
        )
      };
      if (window.WhatsCityAuthService) {
        window.WhatsCityAuthService.persistToBackend(updated, updatedUser, null);
      }
      return updated;
    });
    showToast("Risoluzione confermata dal cittadino! +10 City Impact Score 🌟");
  };

  // Azione Cittadino: Riscatta premio con City Impact Score
  const handleRedeemReward = (reward) => {
    if (state.currentUser.impactScore < reward.cost) return;
    setState((prev) => {
      const updatedUser = {
        ...prev.currentUser,
        impactScore: prev.currentUser.impactScore - reward.cost,
        redeemedRewards: [...(prev.currentUser.redeemedRewards || []), reward.id]
      };
      const updated = {
        ...prev,
        currentUser: updatedUser,
        users: (prev.users || []).map((u) => (u.id === updatedUser.id ? updatedUser : u))
      };
      if (window.WhatsCityAuthService) {
        window.WhatsCityAuthService.persistToBackend(updated, updatedUser, null);
      }
      return updated;
    });
    showToast(`Premio riscattato: ${reward.title}! 🎁`);
  };

  // Azione PA: Cambia Priorità
  const handleChangePriority = (reportId, newPriority) => {
    setState((prev) => {
      const updated = {
        ...prev,
        reports: prev.reports.map((r) =>
          r.id === reportId ? { ...r, priority: newPriority } : r
        )
      };
      if (window.WhatsCityAuthService) {
        window.WhatsCityAuthService.persistToBackend(updated, null, null);
      }
      return updated;
    });
    showToast(`Priorità aggiornata a ${newPriority} dalla PA`);
  };

  // Aggiungi commento nel dettaglio ticket col nome dell'utente loggato
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!newCommentText.trim() || !selectedReportDetail) return;

    const commentObj = {
      author: `${state.currentUser.name} (${state.currentUser.roleBadge})`,
      text: newCommentText.trim(),
      time: "Adesso"
    };

    setState((prev) => {
      const updated = {
        ...prev,
        reports: prev.reports.map((r) =>
          r.id === selectedReportDetail.id
            ? { ...r, comments: [...r.comments, commentObj] }
            : r
        )
      };
      if (window.WhatsCityAuthService) {
        window.WhatsCityAuthService.persistToBackend(updated, null, null);
      }
      return updated;
    });

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
    showToast("Database demo ripristinato allo stato iniziale della presentazione!");
  };

  const filteredFeed = state.reports.filter((r) => {
    const matchSearch =
      !searchQuery.trim() ||
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    <div
      className={`min-h-screen bg-slate-900 flex flex-col lg:flex-row items-center justify-center ${
        desktopMode ? "p-0 gap-0" : "lg:gap-8 p-0 sm:p-4"
      }`}
    >
      {/* Pannello Laterale Desktop (Navigazione Web App Desktop / Controlli Pitch) */}
      <div
        className={`hidden lg:flex flex-col justify-between bg-[#052e2b] text-white p-5 shadow-2xl border-r border-emerald-500/30 self-stretch ${
          desktopMode
            ? "w-72 xl:w-80 h-screen sticky top-0"
            : "w-80 rounded-3xl border max-h-[860px]"
        }`}
      >
        <div className="space-y-3.5">
          {/* Logo WhatsCity + Switch Vista Desktop / Smartphone */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
                ✓
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight">
                  Whats<span className="text-emerald-400">City</span>
                </h1>
                <p className="text-[10px] text-emerald-200/80 font-medium">
                  Milano Smart City · A2A
                </p>
              </div>
            </div>

            <button
              onClick={() => setDesktopMode(!desktopMode)}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-bold text-emerald-300 border border-white/15 transition"
              title="Passa tra Vista Web Desktop Full-Screen e Vista Smartphone Pitch"
            >
              {desktopMode ? "📱 Vista Tel" : "🖥️ Vista PC"}
            </button>
          </div>

          {/* Card Utente Attualmente Loggato + Bottone Iscriviti / Cambia Account */}
          <div className="bg-white/10 border border-emerald-400/30 rounded-2xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                Profilo Social Attivo
              </span>
              <span className="text-[10px] text-emerald-200 font-bold">
                {(state.users || []).length} iscritti nel DB
              </span>
            </div>
            <div className="flex items-center gap-2.5">
              <img
                src={state.currentUser.avatar}
                alt={state.currentUser.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400"
              />
              <div className="min-w-0 flex-1">
                <div className="font-extrabold text-xs text-white truncate">
                  {state.currentUser.name}
                </div>
                <div className="text-[10px] text-emerald-300 truncate">
                  {state.currentUser.roleBadge}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="w-full bg-white hover:bg-emerald-50 text-slate-950 font-extrabold text-[11px] py-1.5 rounded-xl shadow-xs transition"
            >
              👥 Iscriviti / Cambia Utente o Ruolo
            </button>
          </div>

          {/* Selettore Ruolo / Interfaccia (Pagine 8 e 9 PDF) */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
              Schermate dell'Applicazione:
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
                className={`w-full text-left px-3.5 py-2 rounded-2xl text-xs transition flex items-center justify-between border ${
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
            ↺ Ripristina DB iniziale della demo
          </button>
        </div>
      </div>

      {/* Contenitore Principale: Full-Screen Desktop su PC oppure Cornice Smartphone per il Pitch */}
      <div
        className={
          desktopMode
            ? "w-full flex-1 h-screen bg-[#f4f7f6] overflow-hidden flex flex-col relative"
            : "w-full sm:w-[420px] h-screen sm:h-[860px] bg-[#f4f7f6] sm:rounded-[42px] shadow-2xl overflow-hidden flex flex-col relative sm:border-[10px] sm:border-slate-800"
        }
      >
        {/* Top Header Verde Smeraldo (Identico al prototipo Pagina 8 e 9 + Avatar Account Loggato) */}
        <header className="bg-[#10b981] text-slate-950 px-3.5 py-3 flex items-center justify-between shadow-sm z-30 flex-shrink-0">
          <div className="flex items-center gap-1.5">
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

            {/* Pillola Utente Loggato / Bottone Registrazione & Login */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 bg-white/90 hover:bg-white text-slate-900 pl-1 pr-2.5 py-1 rounded-full shadow-xs transition"
              title="Iscriviti, Accedi o Cambia Profilo"
            >
              <img
                src={state.currentUser.avatar}
                alt={state.currentUser.name}
                className="w-5 h-5 rounded-full object-cover"
              />
              <span className="text-[11px] font-extrabold max-w-[78px] truncate">
                {state.currentUser.name.split(" ")[0]}
              </span>
            </button>
          </div>

          <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900">
            {getHeaderTitle()}
          </h1>

          <div className="flex items-center gap-1">
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
              title="Cerca segnalazioni o utenti"
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
              placeholder="Cerca per via, cittadino, azienda o problema..."
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
        <main
          className={`flex-1 relative flex flex-col ${
            activeTab === "map" ? "overflow-hidden" : "overflow-y-auto"
          }`}
        >
          {/* TAB 1: HOME FEED SOCIAL CITTADINO (Con layout Desktop Multi-Colonna + Widget Telecamere Live su PC) */}
          {activeTab === "home" && (
            <div
              className={`p-3.5 sm:p-6 pb-24 mx-auto w-full ${
                desktopMode ? "max-w-6xl grid grid-cols-1 xl:grid-cols-12 gap-6" : "space-y-3.5"
              }`}
            >
              {/* Colonna Principale Feed Social */}
              <div className={desktopMode ? "xl:col-span-7 space-y-4" : "space-y-3.5"}>
              {/* Barra Community / Stories Utenti Registrati nel DB */}
              <div className="bg-white rounded-3xl p-3 shadow-xs border border-slate-200/80">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-extrabold text-slate-800">
                    👥 Community Attiva a Milano ({(state.users || []).length} iscritti)
                  </span>
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="text-[11px] font-extrabold text-emerald-700 hover:underline"
                  >
                    + Iscriviti / Accedi
                  </button>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
                  {/* Bottone rapido nuovo iscritto */}
                  <button
                    onClick={() => setIsAuthModalOpen(true)}
                    className="flex flex-col items-center flex-shrink-0 w-14"
                  >
                    <div className="w-12 h-12 rounded-full bg-emerald-100 border-2 border-dashed border-emerald-500 text-emerald-800 flex items-center justify-center font-black text-lg">
                      +
                    </div>
                    <span className="text-[10px] font-bold text-emerald-800 mt-1 truncate w-full text-center">
                      Nuovo
                    </span>
                  </button>

                  {(state.users || []).map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setViewedPublicProfile(u)}
                      className="flex flex-col items-center flex-shrink-0 w-14 group"
                    >
                      <div
                        className={`w-12 h-12 rounded-full p-0.5 ${
                          u.role === "company"
                            ? "bg-gradient-to-tr from-amber-400 to-emerald-500"
                            : u.role === "pa"
                            ? "bg-gradient-to-tr from-sky-500 to-indigo-600"
                            : "bg-gradient-to-tr from-emerald-500 to-teal-400"
                        }`}
                      >
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-full h-full rounded-full object-cover border-2 border-white group-hover:scale-105 transition"
                        />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 mt-1 truncate w-full text-center">
                        {u.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Box "Scrivi un post" in stile Social Network */}
              <div className="bg-gradient-to-r from-[#052e2b] to-[#0a5c48] text-white rounded-3xl p-3.5 shadow-md flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={state.currentUser.avatar}
                    alt={state.currentUser.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h2 className="font-extrabold text-xs sm:text-sm truncate">
                      Ciao {state.currentUser.name.split(" ")[0]}, segnala in città
                    </h2>
                    <p className="text-[11px] text-emerald-200/90 truncate">
                      Post geolocalizzato, AI Triage o QR Palo A2A
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
                  {/* Intestazione Autore Cliccabile per aprire il Profilo Pubblico */}
                  <div className="flex items-center justify-between">
                    <div
                      onClick={() => handleOpenAuthorProfile(post.authorName)}
                      className="flex items-center gap-2.5 cursor-pointer group"
                    >
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-10 h-10 rounded-full object-cover border border-emerald-500/30 group-hover:ring-2 group-hover:ring-emerald-500 transition"
                      />
                      <div>
                        <h3 className="font-extrabold text-slate-900 text-sm leading-tight group-hover:text-emerald-700 transition">
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
                      <span
                        onClick={() => handleOpenAuthorProfile(post.assignedCompany)}
                        className="bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 font-bold px-2.5 py-1 rounded-lg cursor-pointer"
                      >
                        🏢 {post.assignedCompany}
                      </span>
                    )}
                  </div>

                  {/* Immagine del Post */}
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
                      <span> Commenti ({post.comments.length})</span>
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

              {/* Colonna Destra Desktop: Widget Live Milano (Mappa Rapida, Telecamere Attive, Sensori A2A) */}
              {desktopMode && (
                <aside className="hidden xl:block xl:col-span-5 space-y-4">
                  {/* Card Rete Telecamere Live Milano */}
                  <div className="bg-slate-950 text-white rounded-3xl p-5 shadow-lg border border-sky-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-400 block">
                          Live Streaming & Traffico Waze
                        </span>
                        <h3 className="font-extrabold text-sm mt-0.5">
                          📹 Telecamere Attive a Milano
                        </h3>
                      </div>
                      <button
                        onClick={() => setActiveTab("map")}
                        className="text-xs font-extrabold text-sky-300 hover:underline"
                      >
                        Apri Mappa Waze →
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {(state.cityCameras || []).slice(0, 4).map((cam) => (
                        <div
                          key={cam.id}
                          className="bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <img
                              src={cam.previewImage}
                              alt={cam.name}
                              className="w-14 h-12 rounded-xl object-cover flex-shrink-0 border border-white/15"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-xs text-white truncate">
                                {cam.name}
                              </div>
                              <div className="text-[10px] text-slate-300 truncate">
                                {cam.aiAnalytics.vehiclesPerHour}
                              </div>
                              <div className="text-[10px] text-amber-300 font-semibold truncate">
                                🤖 {cam.aiAnalytics.anomalyDetected}
                              </div>
                            </div>
                          </div>
                          <a
                            href={cam.liveWebcamUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2.5 py-1.5 rounded-xl bg-[#0099ff] hover:bg-[#007acc] text-white font-extrabold text-[10px] whitespace-nowrap shadow"
                          >
                            📹 Live ↗
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Card Sensori Pali Intelligenti A2A Milano */}
                  <div className="bg-[#052e2b] text-white rounded-3xl p-5 shadow-lg border border-emerald-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 block">
                          Rete Sensori IoT A2A Smart City
                        </span>
                        <h3 className="font-extrabold text-sm mt-0.5">
                          📡 Qualità Aria & LED Milano
                        </h3>
                      </div>
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full font-bold">
                        {(state.qrPoles || []).length} Pali Online
                      </span>
                    </div>
                    <div className="space-y-2">
                      {(state.qrPoles || []).map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            setPreselectedPole(p);
                            setIsCreateOpen(true);
                          }}
                          className="bg-white/5 hover:bg-white/10 cursor-pointer border border-white/10 rounded-2xl p-2.5 flex items-center justify-between text-xs transition"
                        >
                          <div className="truncate pr-2">
                            <div className="font-bold text-white truncate">{p.code}</div>
                            <div className="text-[10px] text-emerald-200/70">{p.address}</div>
                          </div>
                          <span className="bg-emerald-500/20 text-emerald-300 font-extrabold px-2.5 py-1 rounded-xl text-[11px] whitespace-nowrap">
                            AQI {p.sensor.aqi} · {p.sensor.temp}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </aside>
              )}
            </div>
          )}

          {/* TAB 2: MAPPA INTERATTIVA + GEOLOCALIZZAZIONE UTENTE + TELECAMERE LIVE MILANO */}
          {activeTab === "map" && (
            <window.WhatsCityMapView
              reports={state.reports}
              qrPoles={state.qrPoles}
              cityCameras={state.cityCameras}
              currentUser={state.currentUser}
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
            <div className="space-y-2">
              <div className="px-4 pt-3 flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500">
                  Account attivo: <strong>{state.currentUser.email}</strong>
                </span>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200"
                >
                  ⇄ Cambia Account / Iscriviti
                </button>
              </div>
              <window.WhatsCityProfileView
                user={state.currentUser}
                rewardsCatalog={state.rewardsCatalog}
                reports={state.reports}
                onSelectReport={(rep) => setSelectedReportDetail(rep)}
                onRedeemReward={handleRedeemReward}
              />
            </div>
          )}

          {/* TAB 5: DASHBOARD PA, TELECAMERE LIVE, OPEN DATA & ANALISI DATI */}
          {activeTab === "dashboard" && (
            <window.WhatsCityDashboardView
              reports={state.reports}
              qrPoles={state.qrPoles}
              cityCameras={state.cityCameras}
              onChangePriority={handleChangePriority}
              onSelectReport={(rep) => setSelectedReportDetail(rep)}
              onOpenAICopilot={() => setIsAICopilotOpen(true)}
            />
          )}
        </main>

        {/* Floating Action Buttons: Chatbot Eco-Guida & Navigazione + Nuova Segnalazione */}
        <div className="absolute bottom-20 right-4 z-40 flex flex-col items-end gap-2.5">
          <button
            onClick={() => setIsAICopilotOpen(true)}
            className="px-4 py-2.5 rounded-full bg-gradient-to-r from-[#052e2b] to-[#0a5c48] hover:from-slate-900 hover:to-[#052e2b] text-emerald-300 shadow-2xl border-2 border-emerald-400 flex items-center gap-2 text-xs font-extrabold transition transform hover:scale-105"
            title="Apri Chatbot Assistente Navigazione & Sostenibilità"
          >
            <span className="text-base">🌱</span>
            <span>Eco-Bot & Guida Sito</span>
          </button>
          {activeTab === "home" && (
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
          )}
        </div>

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

        {/* Modale Profilo Pubblico di un Utente / Azienda / PA cliccato dal Feed */}
        {viewedPublicProfile && (
          <div className="fixed inset-0 z-[920] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-slate-200 text-center space-y-3 relative">
              <button
                onClick={() => setViewedPublicProfile(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-600"
              >
                ✕
              </button>
              <img
                src={viewedPublicProfile.avatar}
                alt={viewedPublicProfile.name}
                className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-emerald-500/30 shadow"
              />
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  {viewedPublicProfile.name}
                </h3>
                <span className="inline-block bg-emerald-100 text-emerald-900 font-extrabold text-[11px] px-3 py-0.5 rounded-full mt-1">
                  {viewedPublicProfile.roleBadge}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {viewedPublicProfile.bio}
              </p>
              <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/60 text-xs">
                <div>
                  <span className="font-black text-emerald-700 text-sm block">
                    {viewedPublicProfile.impactScore || 120} pt
                  </span>
                  <span className="text-[10px] text-slate-500">City Impact Score</span>
                </div>
                <div>
                  <span className="font-black text-slate-900 text-sm block">
                    {viewedPublicProfile.neighborhood || "Meda"}
                  </span>
                  <span className="text-[10px] text-slate-500">Zona / Quartiere</span>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => {
                    handleLoginSuccess(viewedPublicProfile);
                    setViewedPublicProfile(null);
                  }}
                  className="flex-1 bg-[#0a5c48] hover:bg-[#052e2b] text-white font-extrabold text-xs py-2.5 rounded-xl"
                >
                  🔐 Entra con questo profilo
                </button>
                <button
                  onClick={() => setViewedPublicProfile(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Chiudi
                </button>
              </div>
            </div>
          </div>
        )}

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
                          assignedCompany:
                            state.currentUser.role === "company"
                              ? state.currentUser.name
                              : "Eco Azienda Brianza"
                        }));
                      }}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2 rounded-xl"
                    >
                      🛠️ Prendi in Carico Ticket
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
                    Commenti & Risposte Ufficiali ({selectedReportDetail.comments.length})
                  </h4>
                  <div className="space-y-2 max-h-36 overflow-y-auto">
                    {selectedReportDetail.comments.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        Nessun commento ancora registrato. Scrivi il primo!
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
                      placeholder={`Commenta come ${state.currentUser.name}...`}
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

        {/* Modale WhatsCity AI & Eco-Bot (Guida Navigazione + Sostenibilità) */}
        <window.WhatsCityAICopilotModal
          isOpen={isAICopilotOpen}
          onClose={() => setIsAICopilotOpen(false)}
          appState={state}
          activeTab={activeTab}
          onNavigateTab={(targetTab) => setActiveTab(targetTab)}
          onOpenCreateReport={() => setIsCreateOpen(true)}
          onOpenAuth={() => setIsAuthModalOpen(true)}
        />

        {/* Modale Registrazione / Login / Community DB / Cloud Supabase */}
        <window.WhatsCityAuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          users={state.users || []}
          currentUser={state.currentUser}
          onLoginSuccess={handleLoginSuccess}
          onRegisterUser={handleRegisterUser}
          backendStatusLabel={backendStatusLabel}
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
