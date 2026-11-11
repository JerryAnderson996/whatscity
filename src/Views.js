// Viste Complete: Portale Aziende (B2B), Profilo Cittadino & Marketplace Premi, Dashboard PA & Open Data
window.WhatsCityCompanyView = function WhatsCityCompanyView({
  reports,
  onTakeCharge,
  onResolveReport,
  onSelectReport
}) {
  const [selectedCompany, setSelectedCompany] = React.useState(
    "A2A Illuminazione Pubblica & Smart City"
  );
  const [completingTaskId, setCompletingTaskId] = React.useState(null);
  const [afterPhotoUrl, setAfterPhotoUrl] = React.useState(
    "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80"
  );

  const companies = [
    {
      name: "A2A Illuminazione Pubblica & Smart City",
      score: 780,
      badge: "Partner Smart City A2A ⚡",
      sector: "Illuminazione LED & Rete IoT Milano"
    },
    {
      name: "AMSA — Gruppo A2A Milano",
      score: 710,
      badge: "Impresa Virtuosa Gold 🏅",
      sector: "Igiene Urbana & Economia Circolare"
    },
    {
      name: "MM S.p.A. & Impresa Strade Milano",
      score: 540,
      badge: "Partner Infrastrutture & Idro ⭐",
      sector: "Manutenzione Strade, Pavé & Servizio Idrico"
    }
  ];

  const activeCompanyObj = companies.find((c) => c.name === selectedCompany) || companies[0];
  const assignedTasks = reports.filter((r) => r.status === "in_progress" || r.status === "resolved");
  const openSignals = reports.filter((r) => r.status === "open");

  const handleUploadAfterPhoto = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAfterPhotoUrl(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div className="p-4 space-y-5 pb-24 animate-fadeIn">
      {/* Banner Impresa Virtuosa (Step 2 Pagina 10 PDF) */}
      <div className="bg-gradient-to-br from-[#052e2b] to-[#0e9f6e] text-white rounded-3xl p-4 shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-[10px] uppercase tracking-wider font-extrabold bg-white/15 px-2.5 py-1 rounded-full">
            Portale Imprese Locali (B2B)
          </span>
          <span className="text-xs font-bold text-amber-300">{activeCompanyObj.badge}</span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="bg-white/10 text-white font-extrabold text-sm rounded-xl px-2.5 py-1.5 border border-white/20 focus:outline-none"
            >
              {companies.map((c) => (
                <option key={c.name} value={c.name} className="text-slate-900">
                  {c.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-emerald-100/80 mt-1">
              Settore: {activeCompanyObj.sector} · Visibilità pubblica attiva
            </p>
          </div>
          <div className="text-right bg-white/10 px-3 py-2 rounded-2xl border border-white/15">
            <span className="text-[10px] text-emerald-200 block">ESG Reputation</span>
            <span className="text-lg font-black text-white">{activeCompanyObj.score} pt</span>
          </div>
        </div>
      </div>

      {/* Sezione "Incarichi" (Identica a Pagina 9 sinistra del PDF + Upload Foto Fine Lavori) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-slate-900 text-base">Incarichi</h3>
          <span className="text-xs font-semibold text-slate-500">
            {assignedTasks.length} interventi
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {assignedTasks.map((task) => {
            const isDone = task.status === "resolved";
            const isCompletingThis = completingTaskId === task.id;
            return (
              <div key={task.id} className="py-3.5 first:pt-1 last:pb-1 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center text-lg flex-shrink-0 font-bold">
                      {task.category === "Verde & Alberi"
                        ? "🌳"
                        : task.category === "Illuminazione"
                        ? "💡"
                        : "🧱"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4
                        onClick={() => onSelectReport(task)}
                        className="font-bold text-slate-900 text-sm hover:text-emerald-700 cursor-pointer truncate"
                      >
                        {task.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 truncate">
                        {task.address} · {task.assignedCompany || selectedCompany}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            isDone ? "bg-emerald-500" : "bg-teal-600 animate-pulse"
                          }`}
                        />
                        <span className="text-xs font-semibold text-slate-600">
                          {isDone ? "Completato" : "In attesa di completamento"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isDone ? (
                      <button
                        onClick={() =>
                          setCompletingTaskId(isCompletingThis ? null : task.id)
                        }
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-sm transition whitespace-nowrap"
                      >
                        📷 Documenta Fine
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                        +50 ESG
                      </span>
                    )}
                    <button
                      onClick={() => onSelectReport(task)}
                      className="text-slate-400 hover:text-slate-700 font-bold px-1"
                    >
                      ›
                    </button>
                  </div>
                </div>

                {/* Box Upload Foto Risoluzione Intervento (Step 2 Pagina 10 PDF) */}
                {isCompletingThis && (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-3 space-y-2 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-950">
                        📸 Documenta l'intervento con foto post-lavori
                      </span>
                      <label className="text-[11px] font-bold text-emerald-700 underline cursor-pointer">
                        Carica foto
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadAfterPhoto}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <img
                        src={afterPhotoUrl}
                        alt="Post intervento"
                        className="w-16 h-16 rounded-xl object-cover border border-emerald-300"
                      />
                      <div className="flex-1 text-[11px] text-slate-600">
                        La foto verrà allegata al ticket pubblico per la conferma dei
                        cittadini e la validazione PA (+50 pt reputazione ESG).
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onResolveReport(task.id, selectedCompany, afterPhotoUrl);
                        setCompletingTaskId(null);
                      }}
                      className="w-full bg-[#0e9f6e] hover:bg-[#0a7c56] text-white font-extrabold text-xs py-2 rounded-xl shadow"
                    >
                      ✓ Pubblica Risoluzione e Ottieni Badge ESG
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sezione "Segnalazioni" aperte sul territorio (Pagina 9 sinistra in basso) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Segnalazioni</h3>
            <p className="text-[11px] text-slate-500">
              Candidati per risolvere i ticket aperti nella tua area
            </p>
          </div>
          <span className="bg-red-100 text-red-700 text-xs font-extrabold px-2.5 py-0.5 rounded-full">
            {openSignals.length} aperte
          </span>
        </div>

        {openSignals.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            Tutte le segnalazioni sono state prese in carico! 🎉
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {openSignals.map((sig) => (
              <div
                key={sig.id}
                className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-600 flex items-center justify-center text-lg flex-shrink-0">
                    {sig.category === "Illuminazione"
                      ? "💡"
                      : sig.category === "Rifiuti"
                      ? "🗑️"
                      : "🌳"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      onClick={() => onSelectReport(sig)}
                      className="font-bold text-slate-900 text-sm hover:text-emerald-700 cursor-pointer truncate"
                    >
                      {sig.title}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">{sig.address}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onTakeCharge(sig.id, selectedCompany)}
                    className="bg-[#0a5c48] hover:bg-[#052e2b] text-white text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-sm transition whitespace-nowrap"
                  >
                    Prendi in carico
                  </button>
                  <button
                    onClick={() => onSelectReport(sig)}
                    className="text-slate-400 hover:text-slate-700 font-bold px-1"
                  >
                    ›
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Classifica Imprese Virtuose Locali */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80">
        <h3 className="font-extrabold text-slate-900 text-sm mb-2.5">
          🏆 Albo Imprese Virtuose (Visibilità Cittadina & PA)
        </h3>
        <div className="space-y-2">
          {companies.map((c, idx) => (
            <div
              key={c.name}
              className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60 text-xs"
            >
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 font-black flex items-center justify-center">
                  {idx + 1}
                </span>
                <div>
                  <div className="font-bold text-slate-900">{c.name}</div>
                  <div className="text-[10px] text-slate-500">{c.badge}</div>
                </div>
              </div>
              <span className="font-black text-emerald-700">{c.score} ESG pt</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Vista 4: Profilo Cittadino con City Impact Score, Badge & Marketplace Premi (Pagina 8 Destra + Pagina 12 PDF)
window.WhatsCityProfileView = function WhatsCityProfileView({
  user,
  rewardsCatalog,
  reports,
  onSelectReport,
  onRedeemReward
}) {
  const myReports = reports.filter((r) => r.authorName === user.name);

  return (
    <div className="p-4 space-y-4 pb-24 animate-fadeIn">
      {/* Card Profilo Cittadino Attivo (Fedelissima a Pagina 8 destra del PDF) */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 text-center">
        <div className="relative inline-block">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-emerald-500/20 shadow-md"
          />
          <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold border-2 border-white">
            ✓
          </span>
        </div>

        <h2 className="font-extrabold text-slate-900 text-lg mt-2.5">{user.name}</h2>

        <div className="mt-1">
          <span className="inline-block bg-emerald-400/90 text-slate-950 font-extrabold text-xs px-3.5 py-1 rounded-full shadow-xs">
            {user.roleBadge}
          </span>
        </div>

        {/* Box contatori Segnalazioni | Badge */}
        <div className="mt-4 inline-grid grid-cols-2 gap-6 bg-slate-100 px-7 py-2.5 rounded-2xl border border-slate-200/60">
          <div>
            <span className="block font-black text-slate-900 text-base">
              {user.reportsCount + (myReports.length - 2)}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Segnalazioni</span>
          </div>
          <div>
            <span className="block font-black text-slate-900 text-base">
              {user.badgesCount}
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Badge</span>
          </div>
        </div>

        {/* Pillola Verde "City Impact Score" */}
        <div className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl py-3 px-4 flex items-center justify-center gap-3 shadow-md">
          <span className="text-xl">🌱</span>
          <div className="text-left">
            <span className="block text-xs font-extrabold tracking-wide">
              City Impact Score
            </span>
            <span className="block text-base font-black leading-tight">
              {user.impactScore} punti disponibili
            </span>
          </div>
        </div>
      </div>

      {/* Catalogo Premi & Incentivi Cittadini (Gamification Pagina 12 PDF) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">
              🎁 Premi & Vantaggi Cittadino Virtuoso
            </h3>
            <p className="text-[11px] text-slate-500">
              Converti il tuo City Impact Score in buoni AEB/A2A e mobilità
            </p>
          </div>
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            {user.impactScore} pt
          </span>
        </div>

        <div className="space-y-2.5">
          {(rewardsCatalog || []).map((rew) => {
            const isRedeemed = (user.redeemedRewards || []).includes(rew.id);
            const canAfford = user.impactScore >= rew.cost;
            return (
              <div
                key={rew.id}
                className="p-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-lg flex-shrink-0">
                    {rew.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-extrabold text-xs text-slate-900 truncate">
                      {rew.title}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold">
                      Sponsor: {rew.sponsor}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">
                      {rew.description}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onRedeemReward && onRedeemReward(rew)}
                  disabled={isRedeemed || !canAfford}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition ${
                    isRedeemed
                      ? "bg-slate-200 text-slate-600 cursor-default"
                      : canAfford
                      ? "bg-[#0e9f6e] hover:bg-[#0a7c56] text-white shadow-xs"
                      : "bg-slate-100 text-slate-400 border border-slate-200"
                  }`}
                >
                  {isRedeemed ? "✓ Riscattato" : `${rew.cost} pt`}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Badge Civici Sbloccati */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80">
        <h3 className="font-extrabold text-slate-900 text-sm mb-2.5">
          I miei Badge di Partecipazione Civica
        </h3>
        <div className="grid grid-cols-3 gap-2">
          {user.badges.map((b) => (
            <div
              key={b.id}
              className={`rounded-2xl p-2.5 text-center border ${
                b.unlocked !== false
                  ? "bg-slate-50 border-emerald-200"
                  : "bg-slate-100/50 border-slate-200 opacity-55"
              }`}
            >
              <div className="text-xl mb-1">{b.icon}</div>
              <div className="text-[11px] font-bold text-slate-800 leading-tight">
                {b.name}
              </div>
              <div className="text-[9px] text-slate-500 mt-0.5 leading-tight">{b.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Sezione "I miei Post" (Pagina 8 destra in basso) */}
      <div className="space-y-2.5">
        <h3 className="font-extrabold text-slate-900 text-base px-1">I miei Post</h3>
        {myReports.map((post) => (
          <div
            key={post.id}
            onClick={() => onSelectReport(post)}
            className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 hover:border-emerald-400 cursor-pointer transition"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-600 flex items-center justify-center text-lg flex-shrink-0">
                💡
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-extrabold text-slate-900 text-sm truncate">
                    {post.title}
                  </h4>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                      post.status === "resolved"
                        ? "bg-emerald-100 text-emerald-800"
                        : post.status === "in_progress"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {post.statusLabel}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                  {post.description}
                </p>
                <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                  <span>📍 {post.address}</span>
                  <span>❤️ {post.thanksCount} Grazie</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Vista 5: Dashboard Pubblica Amministrazione Milano, Telecamere Live, Open Data & Analisi IoT
window.WhatsCityDashboardView = function WhatsCityDashboardView({
  reports,
  qrPoles,
  cityCameras,
  onChangePriority,
  onSelectReport,
  onOpenAICopilot
}) {
  const totalSignals = 42 + (reports.length - 5);
  const totalProposals = 19;
  const activeProjects = reports.filter((r) => r.status === "in_progress").length + 11;

  const zoneBars = [
    { zone: "Mun. 1 Duomo", count: 16, height: "h-28" },
    { zone: "Mun. 3 Loreto", count: 12, height: "h-20" },
    { zone: "Mun. 6 Navigli", count: 14, height: "h-24" },
    { zone: "Mun. 9 Isola/Niguarda", count: 18, height: "h-32" },
    { zone: "Altri Mun.", count: 9, height: "h-16" }
  ];

  // Funzione Export Open Data Pubblici Comune di Milano
  const handleExportOpenData = (format) => {
    let content = "";
    let mime = "application/json";
    let filename = `whatscity-opendata-milano.${format}`;

    if (format === "json") {
      content = JSON.stringify(
        {
          city: "Milano",
          exportedAt: new Date().toISOString(),
          reports,
          qrPoles,
          cityCameras
        },
        null,
        2
      );
    } else {
      mime = "text/csv";
      const header = "ID,Titolo,Categoria,Priorita,Stato,Indirizzo,Municipio,Azienda,Grazie\n";
      const rows = reports
        .map(
          (r) =>
            `"${r.id}","${r.title.replace(/"/g, '""')}","${r.category}","${r.priority}","${r.statusLabel}","${r.address}","${r.zone}","${r.assignedCompany || "Non assegnata"}",${r.thanksCount}`
        )
        .join("\n");
      content = header + rows;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 space-y-4 pb-24 animate-fadeIn">
      {/* Banner AI Decision Support per la PA */}
      <div className="bg-gradient-to-r from-[#052e2b] to-[#0a5c48] text-white rounded-3xl p-4 shadow-lg flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-300 block">
            AI Governance & Smart City
          </span>
          <h3 className="font-extrabold text-sm mt-0.5">
            Genera Piano Operativo PA con AI
          </h3>
          <p className="text-[11px] text-emerald-100/80">
            Sintesi automatica criticità, priorità e stato sensori A2A
          </p>
        </div>
        <button
          onClick={onOpenAICopilot}
          className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-extrabold text-xs px-3.5 py-2.5 rounded-2xl whitespace-nowrap shadow-md transition"
        >
          ✨ Chiedi all'AI
        </button>
      </div>

      {/* Sezione "Dati raccolti" (Identica a Pagina 9 Destra PDF) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-extrabold text-slate-900 text-base">Dati raccolti</h3>
          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
            Comune di Milano · Live
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center py-2">
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <span className="block text-2xl font-black text-slate-900">{totalSignals}</span>
            <span className="text-[11px] text-slate-500 font-semibold">Segnalazioni</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <span className="block text-2xl font-black text-slate-900">{totalProposals}</span>
            <span className="text-[11px] text-slate-500 font-semibold">Proposte</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
            <span className="block text-2xl font-black text-slate-900">{activeProjects}</span>
            <span className="text-[11px] text-slate-500 font-semibold leading-tight block">
              Progetti in corso
            </span>
          </div>
        </div>
      </div>

      {/* Sezione "Analisi - Segnalazioni per tipo" con Grafico a Torta (Pagina 9 Destra) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80">
        <h3 className="font-extrabold text-slate-900 text-base">Analisi</h3>
        <p className="text-xs font-semibold text-slate-600 mt-0.5 mb-4">
          Segnalazioni per tipo
        </p>

        <div className="flex items-center justify-around gap-4">
          <div
            className="w-28 h-28 rounded-full shadow-inner flex items-center justify-center relative flex-shrink-0"
            style={{
              background:
                "conic-gradient(#0284c7 0% 36%, #38bdf8 36% 68%, #7dd3fc 68% 86%, #bae6fd 86% 100%)"
            }}
          >
            <div className="w-14 h-14 rounded-full bg-white flex flex-col items-center justify-center shadow-xs">
              <span className="text-xs font-black text-slate-800">100%</span>
              <span className="text-[9px] text-slate-400">Urban</span>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#0284c7]" />
              <span className="font-semibold text-slate-700">Rifiuti (36%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#38bdf8]" />
              <span className="font-semibold text-slate-700">Illuminazione (32%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#7dd3fc]" />
              <span className="font-semibold text-slate-700">Sicurezza & Strade (18%)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#bae6fd]" />
              <span className="font-semibold text-slate-700">Verde & Altro (14%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sezione "Segnalazioni per zona" Istogramma (Pagina 9 Destra in basso) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80">
        <h3 className="font-extrabold text-slate-900 text-sm mb-3">
          Segnalazioni per zona
        </h3>
        <div className="h-32 flex items-end justify-between gap-2 pt-4 px-2 border-b border-slate-200 bg-slate-50/50 rounded-t-xl">
          {zoneBars.map((b) => (
            <div key={b.zone} className="flex-1 flex flex-col items-center">
              <span className="text-[10px] font-bold text-teal-800 mb-1">{b.count}</span>
              <div
                className={`w-full ${b.height} bg-gradient-to-t from-teal-500 to-emerald-300 rounded-t-lg shadow-xs transition-all`}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-between px-2 pt-1.5 text-[10px] font-semibold text-slate-500">
          {zoneBars.map((b) => (
            <span key={b.zone} className="flex-1 text-center">
              {b.zone}
            </span>
          ))}
        </div>
      </div>

      {/* Rete Telecamere Urbane Live & Computer Vision Milano */}
      <div className="bg-slate-950 text-white rounded-3xl p-4 shadow-lg border border-sky-500/30">
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block">
              Control Room Mobility, ZTL & Idro Seveso
            </span>
            <h3 className="font-extrabold text-sm">
              📹 Rete Telecamere Live Milano (AI Vision)
            </h3>
          </div>
          <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>{(cityCameras || []).length} Live</span>
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          {(cityCameras || []).map((cam) => (
            <div
              key={cam.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-2.5 flex items-center gap-3"
            >
              <img
                src={cam.previewImage}
                alt={cam.name}
                className="w-16 h-14 rounded-xl object-cover flex-shrink-0 border border-white/15"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs text-white truncate">
                    {cam.name}
                  </span>
                  <span className="text-[9px] font-mono text-sky-300 flex-shrink-0">
                    {cam.id}
                  </span>
                </div>
                <div className="text-[10px] text-slate-300 truncate mt-0.5">
                  🚗 {cam.aiAnalytics.vehiclesPerHour}
                </div>
                <div
                  className={`text-[10px] font-bold truncate mt-0.5 ${
                    cam.aiAnalytics.alertLevel === "critical"
                      ? "text-red-400"
                      : cam.aiAnalytics.alertLevel === "warning"
                      ? "text-amber-300"
                      : "text-emerald-300"
                  }`}
                >
                  🤖 {cam.aiAnalytics.anomalyDetected}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rete Sensori Pali Intelligenti AEB / A2A (Pagina 12 PDF) */}
      <div className="bg-[#052e2b] text-white rounded-3xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2.5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">
              Integrazione Smart City A2A
            </span>
            <h3 className="font-extrabold text-sm">
              Telemetria Pali Intelligenti IoT
            </h3>
          </div>
          <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full font-bold">
            {qrPoles.length} Pali Attivi
          </span>
        </div>
        <div className="space-y-2">
          {qrPoles.map((pole) => (
            <div
              key={pole.id}
              className="bg-white/5 border border-white/10 rounded-2xl p-2.5 flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-bold text-white">{pole.code}</div>
                <div className="text-[11px] text-emerald-200/70">
                  {pole.sensor.trafficFlow || pole.sensor.waterLevel}
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-lg text-[11px]">
                  AQI {pole.sensor.aqi} · {pole.sensor.temp}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gestione Priorità PA */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80">
        <h3 className="font-extrabold text-slate-900 text-sm mb-2.5">
          Cabina di Regia PA — Assegnazione Priorità
        </h3>
        <div className="space-y-2">
          {reports.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-200/60"
            >
              <div
                onClick={() => onSelectReport(r)}
                className="min-w-0 flex-1 cursor-pointer"
              >
                <div className="font-bold text-xs text-slate-900 truncate">{r.title}</div>
                <div className="text-[10px] text-slate-500">
                  {r.address} · Stato: {r.statusLabel}
                </div>
              </div>
              <select
                value={r.priority}
                onChange={(e) => onChangePriority(r.id, e.target.value)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border ${
                  r.priority === "Alta"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : r.priority === "Media"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-emerald-50 text-emerald-800 border-emerald-200"
                }`}
              >
                <option value="Alta">Priorità Alta</option>
                <option value="Media">Priorità Media</option>
                <option value="Bassa">Priorità Bassa</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Trasparenza & Open Data Pubblici (Pagina 12 PDF Competitive Landscape) */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80">
        <h3 className="font-extrabold text-slate-900 text-sm">
          📂 Trasparenza & Open Data Pubblici
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5 mb-3">
          Esporta il dataset pubblico delle segnalazioni e dei sensori IoT per analisi
          urbanistiche e rendicontazione ESG.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleExportOpenData("csv")}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-2.5 rounded-xl transition"
          >
            ⬇ Scarica CSV (Excel)
          </button>
          <button
            onClick={() => handleExportOpenData("json")}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 font-bold text-xs py-2.5 rounded-xl transition"
          >
            ⬇ Scarica JSON (API)
          </button>
        </div>
      </div>
    </div>
  );
};
