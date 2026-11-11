// Backend & Auth Service per WhatsCity Social Network
// Supporta 3 livelli sincronizzati:
// 1. Cloud PostgreSQL Real-Time (Supabase REST API)
// 2. Server REST Locale (/api/db su whatscity_db.json quando serve.ps1 è attivo)
// 3. Browser Persistent DB (LocalStorage per funzionamento garantito ovunque)

window.WhatsCityAuthService = {
  SUPABASE_CFG_KEY: "whatscity_supabase_config",

  getSupabaseConfig() {
    try {
      const raw = localStorage.getItem(this.SUPABASE_CFG_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { url: "", anonKey: "" };
  },

  setSupabaseConfig(url, anonKey) {
    try {
      const cleanUrl = (url || "").trim().replace(/\/+$/, "");
      const cleanKey = (anonKey || "").trim();
      localStorage.setItem(
        this.SUPABASE_CFG_KEY,
        JSON.stringify({ url: cleanUrl, anonKey: cleanKey })
      );
    } catch (e) {}
  },

  isCloudConfigured() {
    const cfg = this.getSupabaseConfig();
    return Boolean(cfg.url && cfg.anonKey);
  },

  // Sincronizzazione con Supabase Cloud PostgreSQL o Server REST /api/db
  async syncFromBackend(currentState) {
    // 1. Se Supabase Cloud è configurato, carica utenti e post dal Cloud DB
    const cfg = this.getSupabaseConfig();
    if (cfg.url && cfg.anonKey) {
      try {
        const headers = {
          apikey: cfg.anonKey,
          Authorization: `Bearer ${cfg.anonKey}`,
          "Content-Type": "application/json"
        };
        const [usersRes, reportsRes] = await Promise.all([
          fetch(`${cfg.url}/rest/v1/whatscity_users?select=*&order=created_at.desc`, {
            headers
          }),
          fetch(
            `${cfg.url}/rest/v1/whatscity_reports?select=*&order=created_timestamp.desc`,
            { headers }
          )
        ]);

        if (usersRes.ok && reportsRes.ok) {
          const cloudUsers = await usersRes.json();
          const cloudReports = await reportsRes.json();

          if (cloudUsers.length > 0 || cloudReports.length > 0) {
            const mappedUsers = cloudUsers.map((u) => ({
              id: u.id,
              email: u.email,
              passwordHash: u.password_hash,
              name: u.name,
              role: u.role,
              roleBadge: u.role_badge,
              userType: u.user_type,
              avatar: u.avatar,
              bio: u.bio,
              neighborhood: u.neighborhood,
              vatNumber: u.vat_number,
              companySector: u.company_sector,
              department: u.department,
              impactScore: u.impact_score,
              esgScore: u.esg_score,
              reportsCount: u.reports_count,
              badgesCount: u.badges_count,
              redeemedRewards: u.redeemed_rewards || []
            }));

            const mappedReports = cloudReports.map((r) => ({
              id: r.id,
              authorId: r.author_id,
              authorName: r.author_name,
              authorRole: r.author_role,
              authorAvatar: r.author_avatar,
              title: r.title,
              description: r.description,
              category: r.category,
              priority: r.priority,
              status: r.status,
              statusLabel: r.status_label,
              zone: r.zone,
              address: r.address,
              lat: r.lat,
              lng: r.lng,
              qrPoleId: r.qr_pole_id,
              createdAt: r.created_at,
              thanksCount: r.thanks_count,
              thankedByMe: false,
              citizenConfirmed: r.citizen_confirmed,
              assignedCompany: r.assigned_company,
              image: r.image,
              afterImage: r.after_image,
              comments: r.comments || []
            }));

            return {
              users: mappedUsers.length ? mappedUsers : currentState.users,
              reports: mappedReports.length ? mappedReports : currentState.reports,
              backendType: "Supabase Cloud PostgreSQL 🟢"
            };
          }
        }
      } catch (e) {
        console.warn("Supabase sync warning:", e);
      }
    }

    // 2. Prova a sincronizzare con il backend locale /api/db se attivo
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      try {
        const res = await fetch("/api/db");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.users) && data.users.length > 0) {
            return {
              users: data.users,
              reports: data.reports && data.reports.length ? data.reports : currentState.reports,
              backendType: "Server DB Locale (whatscity_db.json) 🟢"
            };
          }
        }
      } catch (e) {}
    }

    return {
      users: currentState.users,
      reports: currentState.reports,
      backendType: this.isCloudConfigured()
        ? "Supabase Cloud PostgreSQL 🟢"
        : "Database Persistente Integrato 🟢"
    };
  },

  // Salva un nuovo utente o report sia sul backend Cloud/Locale sia nello stato
  async persistToBackend(fullState, newUser, newReport) {
    // 1. Se Supabase è configurato, invia record via REST API
    const cfg = this.getSupabaseConfig();
    if (cfg.url && cfg.anonKey) {
      const headers = {
        apikey: cfg.anonKey,
        Authorization: `Bearer ${cfg.anonKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      };
      try {
        if (newUser) {
          await fetch(`${cfg.url}/rest/v1/whatscity_users`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              id: newUser.id,
              email: newUser.email,
              password_hash: newUser.passwordHash || "demo",
              name: newUser.name,
              role: newUser.role,
              role_badge: newUser.roleBadge,
              user_type: newUser.userType,
              avatar: newUser.avatar,
              bio: newUser.bio || "",
              neighborhood: newUser.neighborhood || "Centro",
              vat_number: newUser.vatNumber || "",
              company_sector: newUser.companySector || "",
              department: newUser.department || "",
              impact_score: newUser.impactScore || 50,
              esg_score: newUser.esgScore || 100,
              reports_count: newUser.reportsCount || 0,
              badges_count: newUser.badgesCount || 1,
              redeemed_rewards: newUser.redeemedRewards || []
            })
          });
        }
        if (newReport) {
          await fetch(`${cfg.url}/rest/v1/whatscity_reports`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              id: newReport.id,
              author_id: newReport.authorId || "",
              author_name: newReport.authorName,
              author_role: newReport.authorRole,
              author_avatar: newReport.authorAvatar,
              title: newReport.title,
              description: newReport.description,
              category: newReport.category,
              priority: newReport.priority,
              status: newReport.status,
              status_label: newReport.statusLabel,
              zone: newReport.zone,
              address: newReport.address,
              lat: newReport.lat,
              lng: newReport.lng,
              qr_pole_id: newReport.qrPoleId,
              created_at: newReport.createdAt,
              thanks_count: newReport.thanksCount,
              citizen_confirmed: Boolean(newReport.citizenConfirmed),
              assigned_company: newReport.assignedCompany,
              image: newReport.image,
              after_image: newReport.afterImage,
              comments: newReport.comments || []
            })
          });
        }
      } catch (e) {
        console.warn("Errore salvataggio Supabase:", e);
      }
    }

    // 2. Se gira in locale su serve.ps1, persisti su whatscity_db.json
    if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
      try {
        await fetch("/api/db", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            users: fullState.users,
            reports: fullState.reports,
            updatedAt: new Date().toISOString()
          })
        });
      } catch (e) {}
    }
  }
};

// Modale di Autenticazione Social (Registrazione Multi-Ruolo, Login, Switch Rapido, Configurazione Cloud DB)
window.WhatsCityAuthModal = function WhatsCityAuthModal({
  isOpen,
  onClose,
  users,
  currentUser,
  onLoginSuccess,
  onRegisterUser,
  backendStatusLabel
}) {
  const [tab, setTab] = React.useState("register"); // "register" | "login" | "directory" | "cloud"
  const [role, setRole] = React.useState("citizen"); // "citizen" | "company" | "pa"
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [neighborhood, setNeighborhood] = React.useState("Centro");
  const [bio, setBio] = React.useState("");
  const [vatNumber, setVatNumber] = React.useState("");
  const [companySector, setCompanySector] = React.useState("Verde & Ambiente");
  const [department, setDepartment] = React.useState("Ufficio Tecnico & Ambiente");
  const [avatarUrl, setAvatarUrl] = React.useState(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  );
  const [errorMsg, setErrorMsg] = React.useState("");

  // Campi configurazione Cloud Supabase
  const [supaUrl, setSupaUrl] = React.useState(
    () => window.WhatsCityAuthService.getSupabaseConfig().url
  );
  const [supaKey, setSupaKey] = React.useState(
    () => window.WhatsCityAuthService.getSupabaseConfig().anonKey
  );

  if (!isOpen) return null;

  const avatarPresets = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=150&auto=format&fit=crop&q=80"
  ];

  const handleAvatarUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim() || !email.trim() || !password.trim()) {
      setErrorMsg("Compila nome, email e password per creare l'account.");
      return;
    }

    const exists = (users || []).find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (exists) {
      setErrorMsg("Questa email è già registrata! Passa al tab 'Accedi'.");
      return;
    }

    const roleMeta = {
      citizen: {
        roleBadge: "Cittadino attivo 🌱",
        userType: "Privato"
      },
      company: {
        roleBadge: "Impresa Locale Certificata 🏢",
        userType: `Impresa (${companySector}) ⭐`
      },
      pa: {
        roleBadge: "Operatore PA 🏛️",
        userType: `PA · ${department} 🏛️`
      }
    }[role];

    const newUser = {
      id: "user-" + Date.now(),
      email: email.trim().toLowerCase(),
      passwordHash: password,
      name: name.trim(),
      role,
      roleBadge: roleMeta.roleBadge,
      userType: roleMeta.userType,
      avatar: avatarUrl,
      bio:
        bio.trim() ||
        (role === "company"
          ? `Impresa attiva sul territorio di Meda (${companySector}).`
          : role === "pa"
          ? `Referente ${department} — Comune di Meda.`
          : `Cittadino attivo del quartiere ${neighborhood} a Meda.`),
      neighborhood,
      vatNumber: role === "company" ? vatNumber.trim() || "IT00000000000" : "",
      companySector: role === "company" ? companySector : "",
      department: role === "pa" ? department : "",
      impactScore: 50, // Bonus benvenuto 50 pt
      esgScore: role === "company" ? 150 : 0,
      reportsCount: 0,
      badgesCount: 1,
      redeemedRewards: [],
      badges: [
        {
          id: "b-welcome",
          name: "Nuovo Membro Civico",
          icon: "🎉",
          desc: "Iscritto alla community WhatsCity (+50 pt bonus)",
          unlocked: true
        },
        {
          id: "b1",
          name: "Sentinella Verde",
          icon: "🌱",
          desc: "5+ segnalazioni ambientali risolte",
          unlocked: false
        },
        {
          id: "b2",
          name: "Occhio Civico",
          icon: "⚡",
          desc: "Prima segnalazione tramite QR Pali A2A",
          unlocked: false
        }
      ],
      createdAt: "Oggi"
    };

    onRegisterUser(newUser);
    onClose();
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setErrorMsg("");
    const found = (users || []).find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!found) {
      setErrorMsg("Nessun utente trovato con questa email. Registrati gratis!");
      return;
    }
    if (found.passwordHash && found.passwordHash !== password && password !== "demo123") {
      setErrorMsg("Password non corretta (per gli account demo usa: demo123).");
      return;
    }
    onLoginSuccess(found);
    onClose();
  };

  const handleSaveSupabase = (e) => {
    e.preventDefault();
    window.WhatsCityAuthService.setSupabaseConfig(supaUrl, supaKey);
    onClose();
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[960] bg-slate-950/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-emerald-500/30">
        {/* Header Social Auth */}
        <div className="bg-gradient-to-r from-[#052e2b] to-[#0a5c48] text-white px-5 py-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <h3 className="font-extrabold text-base">Community & Account WhatsCity</h3>
            </div>
            <p className="text-[11px] text-emerald-200/90 mt-0.5">
              {backendStatusLabel || "Database Utenti & Ruoli Attivo"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold"
          >
            ✕
          </button>
        </div>

        {/* Navigazione 4 Tab: Iscriviti | Accedi | Community DB | Cloud Config */}
        <div className="grid grid-cols-4 gap-1 p-1.5 bg-slate-100 border-b border-slate-200 text-[11px] font-extrabold">
          <button
            type="button"
            onClick={() => {
              setTab("register");
              setErrorMsg("");
            }}
            className={`py-2 rounded-xl transition ${
              tab === "register"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ✨ Iscriviti
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setErrorMsg("");
            }}
            className={`py-2 rounded-xl transition ${
              tab === "login"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            🔐 Accedi
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("directory");
              setErrorMsg("");
            }}
            className={`py-2 rounded-xl transition ${
              tab === "directory"
                ? "bg-white text-emerald-800 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            👥 Utenti ({(users || []).length})
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("cloud");
              setErrorMsg("");
            }}
            className={`py-2 rounded-xl transition ${
              tab === "cloud"
                ? "bg-amber-400 text-slate-950 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ☁️ Cloud DB
          </button>
        </div>

        {/* Contenuto Scorrevole */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-bold p-3 rounded-2xl">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* TAB 1: REGISTRAZIONE NUOVO UTENTE (Cittadino, Azienda, PA) */}
          {tab === "register" && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                  1. Scegli il tuo Ruolo nell'Ecosistema Urbano:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "citizen", icon: "🙋‍♀️", title: "Cittadino", sub: "Segnala & vota" },
                    { id: "company", icon: "🏢", title: "Azienda", sub: "Intervieni & ESG" },
                    { id: "pa", icon: "🏛️", title: "Ente PA", sub: "Coordina & dati" }
                  ].map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setRole(r.id)}
                      className={`p-2.5 rounded-2xl border text-center transition ${
                        role === r.id
                          ? "bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      <div className="text-xl">{r.icon}</div>
                      <div className="font-extrabold text-xs mt-0.5">{r.title}</div>
                      <div className="text-[9px] text-slate-500">{r.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Scelta Avatar o Upload Foto Profilo */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Foto Profilo / Logo Aziendale
                  </label>
                  <label className="text-[11px] font-bold text-emerald-700 cursor-pointer hover:underline">
                    + Carica foto
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 flex-shrink-0"
                  />
                  <div className="flex gap-1.5 overflow-x-auto py-1 no-scrollbar">
                    {avatarPresets.map((url, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setAvatarUrl(url)}
                        className={`w-9 h-9 rounded-full overflow-hidden border-2 flex-shrink-0 ${
                          avatarUrl === url ? "border-emerald-600 scale-105" : "border-transparent opacity-70"
                        }`}
                      >
                        <img src={url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Nome / Ragione Sociale & Email */}
              <div className="grid grid-cols-1 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {role === "company"
                      ? "Ragione Sociale Azienda *"
                      : role === "pa"
                      ? "Nome Operatore / Ufficio PA *"
                      : "Nome e Cognome *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={
                      role === "company"
                        ? "Es. Verde Sicuro S.r.l."
                        : role === "pa"
                        ? "Es. Ing. Marco Verdi - Comune di Meda"
                        : "Es. Giulia Colombo"
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome@email.it"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Campi dinamici in base al ruolo scelto */}
              {role === "company" && (
                <div className="grid grid-cols-2 gap-2 bg-sky-50/70 p-3 rounded-2xl border border-sky-200">
                  <div>
                    <label className="block text-[11px] font-bold text-sky-950 mb-1">
                      Partita IVA
                    </label>
                    <input
                      type="text"
                      value={vatNumber}
                      onChange={(e) => setVatNumber(e.target.value)}
                      placeholder="IT01234567890"
                      className="w-full px-2.5 py-1.5 rounded-xl border border-sky-300 text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-sky-950 mb-1">
                      Settore Intervento
                    </label>
                    <select
                      value={companySector}
                      onChange={(e) => setCompanySector(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-xl border border-sky-300 text-xs bg-white font-semibold"
                    >
                      <option>Verde & Ambiente</option>
                      <option>Illuminazione & IoT</option>
                      <option>Manutenzione Stradale</option>
                      <option>Igiene & Rifiuti</option>
                      <option>Idraulica & Sicurezza</option>
                    </select>
                  </div>
                </div>
              )}

              {role === "pa" && (
                <div className="bg-amber-50/70 p-3 rounded-2xl border border-amber-200">
                  <label className="block text-[11px] font-bold text-amber-950 mb-1">
                    Assessorato / Dipartimento Comunale
                  </label>
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="Es. Lavori Pubblici, Ecologia e Smart City"
                    className="w-full px-3 py-1.5 rounded-xl border border-amber-300 text-xs bg-white"
                  />
                </div>
              )}

              {/* Quartiere e Bio */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Municipio / Quartiere Milano
                  </label>
                  <select
                    value={neighborhood}
                    onChange={(e) => setNeighborhood(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                  >
                    <option>Municipio 1 · Duomo / Brera</option>
                    <option>Municipio 9 · Isola / Porta Nuova</option>
                    <option>Municipio 3 · Città Studi / Loreto</option>
                    <option>Municipio 6 · Navigli / Darsena</option>
                    <option>Municipio 9 · Niguarda / Bicocca</option>
                    <option>Municipio 8 · Sempione / CityLife</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bio / Presentazione
                  </label>
                  <input
                    type="text"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Breve bio pubblica..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-[#0e9f6e] hover:bg-[#0a7c56] text-white font-extrabold text-xs py-3 rounded-2xl shadow-lg transition"
              >
                🚀 Crea Account nel Database (+50 Impact Score Bonus)
              </button>
            </form>
          )}

          {/* TAB 2: LOGIN CON EMAIL E PASSWORD */}
          {tab === "login" && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Indirizzo Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Es. maria.rossi@whatscity.it"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (account demo: demo123)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#0a5c48] hover:bg-[#052e2b] text-white font-extrabold text-xs py-3 rounded-2xl shadow-lg transition"
              >
                🔐 Accedi al tuo Profilo WhatsCity
              </button>

              <div className="pt-2 border-t border-slate-200">
                <span className="block text-[11px] font-bold text-slate-500 mb-2">
                  Oppure accedi con 1 click a uno dei profili del Team / Demo:
                </span>
                <div className="space-y-1.5">
                  {(users || []).slice(0, 5).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onLoginSuccess(u);
                        onClose();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 hover:bg-emerald-50 border border-slate-200 text-left text-xs transition"
                    >
                      <div className="flex items-center gap-2">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{u.name}</div>
                          <div className="text-[10px] text-slate-500">{u.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Usa →
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </form>
          )}

          {/* TAB 3: DIRECTORY UTENTI ISCRITTI NEL DATABASE */}
          {tab === "directory" && (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-slate-800">
                  Membri Registrati nella Community ({users.length})
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  Click per cambiare utente
                </span>
              </div>
              {users.map((u) => {
                const isMe = currentUser && currentUser.id === u.id;
                return (
                  <div
                    key={u.id}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-2.5 ${
                      isMe
                        ? "bg-emerald-50/80 border-emerald-500"
                        : "bg-slate-50 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img
                        src={u.avatar}
                        alt={u.name}
                        className="w-10 h-10 rounded-full object-cover border border-emerald-400 flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-900 truncate">
                            {u.name}
                          </span>
                          {isMe && (
                            <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                              TU
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-semibold">
                          {u.roleBadge} · {u.neighborhood || "Meda"}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {u.bio}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onLoginSuccess(u);
                        onClose();
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-emerald-600 hover:text-white text-slate-800 border border-slate-300 text-[10px] font-extrabold whitespace-nowrap transition"
                    >
                      {isMe ? "Attivo" : "Passa a →"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 4: COLLEGAMENTO SUPABASE CLOUD POSTGRESQL */}
          {tab === "cloud" && (
            <form onSubmit={handleSaveSupabase} className="space-y-3">
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl space-y-1.5">
                <div className="text-xs font-extrabold text-emerald-400">
                  ☁️ Database Cloud Condiviso (Supabase PostgreSQL)
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Di default WhatsCity salva tutti gli iscritti e i post nel database
                  persistente locale/server. Se incolli URL e Anon Key di un progetto{" "}
                  <strong>Supabase</strong> (usando il file{" "}
                  <code>supabase_schema.sql</code> incluso nel progetto), tutti gli
                  utenti che aprono il link pubblico vedranno in tempo reale gli stessi
                  iscritti e post da qualsiasi dispositivo!
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={supaUrl}
                  onChange={(e) => setSupaUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Supabase Anon Public Key
                </label>
                <input
                  type="password"
                  value={supaKey}
                  onChange={(e) => setSupaKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs py-2.5 rounded-xl shadow"
              >
                💾 Salva e Connetti Cloud Database
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
