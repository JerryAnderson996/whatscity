// Modale Creazione Segnalazione Geolocalizzata + Smart Triage AI + Simulazione Scansione QR Code (Pali Smart A2A)
window.WhatsCityCreateModal = function WhatsCityCreateModal({
  isOpen,
  onClose,
  onCreateReport,
  qrPoles,
  existingReports,
  preselectedPole,
  preselectedCoords
}) {
  const [mode, setMode] = React.useState(preselectedPole ? "form" : "form"); // "qr" o "form"
  const [selectedPoleId, setSelectedPoleId] = React.useState(
    preselectedPole ? preselectedPole.id : ""
  );
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("Illuminazione");
  const [priority, setPriority] = React.useState("Media");
  const [address, setAddress] = React.useState(
    preselectedPole
      ? preselectedPole.address
      : preselectedCoords
      ? preselectedCoords.address
      : "Corso Buenos Aires 32, Milano (MI)"
  );
  const [coords, setCoords] = React.useState(
    preselectedPole
      ? { lat: preselectedPole.lat, lng: preselectedPole.lng }
      : preselectedCoords
      ? { lat: preselectedCoords.lat, lng: preselectedCoords.lng }
      : { lat: 45.4795, lng: 9.2105 }
  );
  const [imagePreview, setImagePreview] = React.useState(
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=80"
  );
  const [aiDetectedBadge, setAiDetectedBadge] = React.useState(
    "AI Vision: Rilevato problema Illuminazione Pubblica (Confidenza 94%)"
  );
  const [aiTriageResult, setAiTriageResult] = React.useState(null);
  const [isAnalyzingAI, setIsAnalyzingAI] = React.useState(false);

  React.useEffect(() => {
    if (preselectedPole) {
      setSelectedPoleId(preselectedPole.id);
      setAddress(preselectedPole.address);
      setCoords({ lat: preselectedPole.lat, lng: preselectedPole.lng });
      setMode("form");
    } else if (preselectedCoords) {
      setSelectedPoleId("");
      setAddress(preselectedCoords.address);
      setCoords({ lat: preselectedCoords.lat, lng: preselectedCoords.lng });
      if (preselectedCoords.prefillTitle) {
        setTitle(preselectedCoords.prefillTitle);
      }
      setMode("form");
    }
  }, [preselectedPole, preselectedCoords]);

  if (!isOpen) return null;

  const presetPhotos = [
    {
      label: "💡 Lampione spento",
      cat: "Illuminazione",
      prio: "Alta",
      ai: "AI Vision: Anomalia lampione LED rilevata (96%)",
      url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=80"
    },
    {
      label: "🗑️ Rifiuti abbandonati",
      cat: "Rifiuti",
      prio: "Alta",
      ai: "AI Vision: Rifiuti ingombranti su suolo pubblico (92%)",
      url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80"
    },
    {
      label: "🕳️ Buca stradale",
      cat: "Strade & Buche",
      prio: "Media",
      ai: "AI Vision: Dissesto manto stradale / marciapiede (89%)",
      url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80"
    },
    {
      label: "🌳 Alberi / Rami",
      cat: "Verde & Alberi",
      prio: "Media",
      ai: "AI Vision: Manutenzione verde urbano richiesta (91%)",
      url: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80"
    }
  ];

  const handleRunSmartTriage = async () => {
    if (!title.trim() && !description.trim()) return;
    setIsAnalyzingAI(true);
    const res = await window.WhatsCityAIEngine.analyzeReportDraft(
      title,
      description,
      existingReports || []
    );
    setCategory(res.category);
    setPriority(res.priority);
    setAiTriageResult(res);
    setAiDetectedBadge(
      `${res.engine}: Categoria "${res.category}" · Priorità ${res.priority}`
    );
    setIsAnalyzingAI(false);
  };

  const handleSelectPoleQR = (pole) => {
    setSelectedPoleId(pole.id);
    setAddress(pole.address);
    setCoords({ lat: pole.lat, lng: pole.lng });
    if (pole.id === "QR-MEDA-01") {
      setTitle("Lampione sfarfallante vicino al Palo Smart #01");
      setCategory("Illuminazione");
    }
    setMode("form");
  };

  const handleFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImagePreview(ev.target.result);
      setAiDetectedBadge("AI Vision: Foto caricata e classificata automaticamente ✨");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const poleObj = qrPoles.find((p) => p.id === selectedPoleId);
    onCreateReport({
      title: title.trim(),
      description:
        description.trim() ||
        "Segnalazione inviata da cittadino tramite app WhatsCity per intervento rapido.",
      category,
      priority,
      zone: poleObj ? poleObj.zone : "Centro",
      address,
      lat: coords.lat + (Math.random() - 0.5) * 0.0006,
      lng: coords.lng + (Math.random() - 0.5) * 0.0006,
      qrPoleId: selectedPoleId || null,
      image: imagePreview
    });
    setTitle("");
    setDescription("");
    setAiTriageResult(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[900] bg-slate-950/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col border border-slate-200">
        {/* Header Modale */}
        <div className="bg-[#0a5c48] text-white px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base flex items-center gap-2">
              <span>📍 Nuova Segnalazione Civica</span>
            </h3>
            <p className="text-[11px] text-emerald-100/80">
              Geolocalizzata, assistita da AI o tramite QR Code Pali A2A
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white font-bold"
          >
            ✕
          </button>
        </div>

        {/* Switcher Modalità: Compila Post vs Scansiona Cartello QR */}
        <div className="grid grid-cols-2 gap-1 p-2 bg-slate-100 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setMode("form")}
            className={`py-2 rounded-xl text-xs font-bold transition-all ${
              mode === "form"
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            ✍️ Compila con AI Triage
          </button>
          <button
            type="button"
            onClick={() => setMode("qr")}
            className={`py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === "qr"
                ? "bg-amber-400 text-slate-950 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <span>📷</span>
            <span>Simula Scan QR Città</span>
          </button>
        </div>

        {/* Corpo Modale */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {mode === "qr" ? (
            <div className="space-y-4">
              {/* Riproduzione fedele del cartello giallo/verde WhatsCity (Pagina 7 PDF) */}
              <div className="mx-auto w-56 rounded-2xl overflow-hidden shadow-xl border-4 border-slate-800 bg-[#f59e0b] text-center">
                <div className="bg-[#0e9f6e] text-white font-extrabold py-2 text-sm tracking-wide">
                  WhatsCity
                </div>
                <div className="p-4 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-600 font-black text-lg shadow mb-2">
                    ✓
                  </div>
                  <div className="w-28 h-28 bg-white p-2 rounded-xl shadow-inner grid grid-cols-5 grid-rows-5 gap-1">
                    {Array.from({ length: 25 }).map((_, idx) => (
                      <div
                        key={idx}
                        className={`rounded-[2px] ${
                          idx % 2 === 0 || idx === 3 || idx === 17
                            ? "bg-slate-900"
                            : "bg-slate-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] font-bold text-slate-900 mt-2">
                    La città che ascolta. E risponde.
                  </p>
                </div>
                <div className="bg-slate-900 text-white font-black text-xs py-2 tracking-widest">
                  SCAN ME
                </div>
              </div>

              <p className="text-xs text-center text-slate-600">
                Seleziona uno dei <strong>Pali Intelligenti AEB / A2A</strong> installati in città per agganciare automaticamente coordinate GPS e telemetria ambientale IoT:
              </p>

              <div className="space-y-2">
                {qrPoles.map((pole) => (
                  <button
                    key={pole.id}
                    type="button"
                    onClick={() => handleSelectPoleQR(pole)}
                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between ${
                      selectedPoleId === pole.id
                        ? "border-emerald-600 bg-emerald-50/70"
                        : "border-slate-200 hover:border-emerald-400 bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-extrabold text-emerald-800">
                          {pole.id}
                        </span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                          AQI {pole.sensor.aqi} · {pole.sensor.temp}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-800 mt-0.5">
                        {pole.code}
                      </div>
                      <div className="text-[11px] text-slate-500">{pole.address}</div>
                    </div>
                    <span className="text-emerald-600 font-bold text-xs">Usa QR →</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <form id="create-report-form" onSubmit={handleSubmit} className="space-y-3.5">
              {/* Badge QR agganciato */}
              {selectedPoleId && (
                <div className="bg-emerald-950 text-emerald-200 px-3 py-2 rounded-xl text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span>📡</span>
                    <span>
                      Agganciato a <strong>{selectedPoleId}</strong> (Telemetria IoT inclusa)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedPoleId("")}
                    className="text-emerald-400 hover:text-white text-[11px] underline"
                  >
                    Rimuovi
                  </button>
                </div>
              )}

              {/* Titolo Segnalazione + Bottone AI Auto-Triage */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Cosa vuoi segnalare? *
                  </label>
                  <button
                    type="button"
                    onClick={handleRunSmartTriage}
                    disabled={isAnalyzingAI}
                    className="text-[11px] font-extrabold bg-emerald-100 hover:bg-emerald-200 text-emerald-900 px-2.5 py-0.5 rounded-full transition flex items-center gap-1"
                  >
                    <span>✨</span>
                    <span>{isAnalyzingAI ? "Analisi AI..." : "Analizza con AI"}</span>
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleRunSmartTriage}
                  placeholder="Es. Tombino ostruito o lampione spento in via Roma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Box Risultato AI Smart Triage & Deduplicazione */}
              {aiTriageResult && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3 text-xs space-y-1.5 animate-fadeIn">
                  <div className="flex items-center justify-between font-extrabold text-emerald-900">
                    <span>🤖 {aiTriageResult.engine}</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full">
                      Priorità {aiTriageResult.priority}
                    </span>
                  </div>
                  <p className="text-slate-700 text-[11px]">{aiTriageResult.reason}</p>
                  <div className="text-[11px] text-emerald-800 font-semibold">
                    🏢 Impresa / Ente suggerito:{" "}
                    <strong>{aiTriageResult.suggestedCompany}</strong>
                  </div>
                  {aiTriageResult.duplicateReport && (
                    <div className="bg-amber-100 border border-amber-300 text-amber-950 p-2 rounded-xl text-[11px] mt-1">
                      ⚠️ <strong>Possibile duplicato rilevato:</strong> esiste già il ticket{" "}
                      <em>"{aiTriageResult.duplicateReport.title}"</em> in{" "}
                      {aiTriageResult.duplicateReport.address}.
                    </div>
                  )}
                </div>
              )}

              {/* Scelta rapida Foto o Upload reale */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Foto del problema (con AI Classificazione)
                  </label>
                  <label className="text-[11px] font-bold text-emerald-700 cursor-pointer hover:underline">
                    + Carica dal dispositivo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Preset rapidi per testare la demo */}
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 no-scrollbar">
                  {presetPhotos.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setImagePreview(p.url);
                        setCategory(p.cat);
                        setPriority(p.prio);
                        setAiDetectedBadge(p.ai);
                        if (!title)
                          setTitle(
                            p.label.replace(/^[^\s]+\s/, "") +
                              " in " +
                              address.split(",")[0]
                          );
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 text-[11px] font-semibold text-slate-700 whitespace-nowrap border border-slate-200"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="relative mt-1.5 rounded-2xl overflow-hidden border border-slate-200 h-36 bg-slate-100">
                  <img
                    src={imagePreview}
                    alt="Anteprima"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-900/85 backdrop-blur-sm text-emerald-300 text-[10px] font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1.5">
                    <span>🤖</span>
                    <span>{aiDetectedBadge}</span>
                  </div>
                </div>
              </div>

              {/* Categoria e Priorità */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option>Illuminazione</option>
                    <option>Rifiuti</option>
                    <option>Strade & Buche</option>
                    <option>Verde & Alberi</option>
                    <option>Sicurezza & Idro</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Priorità stimata
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white"
                  >
                    <option value="Alta">🔴 Alta (Urgente)</option>
                    <option value="Media">🟡 Media</option>
                    <option value="Bassa">🟢 Ordinaria</option>
                  </select>
                </div>
              </div>

              {/* Posizione Geolocalizzata */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Posizione Geolocalizzata (GPS / Indirizzo)
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setMode("qr")}
                    className="px-3 py-2 bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 whitespace-nowrap"
                  >
                    📷 QR Palo
                  </button>
                </div>
              </div>

              {/* Descrizione */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dettagli aggiuntivi
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={handleRunSmartTriage}
                  placeholder="Descrivi il problema per agevolare la PA e le aziende locali..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </form>
          )}
        </div>

        {/* Footer Azione */}
        {mode === "form" && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <div className="text-[11px] text-emerald-800 font-semibold">
              🌱 Guadagni <strong>+15 City Impact Score</strong>
            </div>
            <button
              type="submit"
              form="create-report-form"
              className="bg-[#0e9f6e] hover:bg-[#0a7c56] text-white font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg transition"
            >
              Pubblica Segnalazione
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
