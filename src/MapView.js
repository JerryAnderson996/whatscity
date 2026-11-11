// Componente Mappa Interattiva (Leaflet) con Pin Segnalazioni e Sensori IoT Pali Intelligenti A2A
window.WhatsCityMapView = function WhatsCityMapView({
  reports,
  qrPoles,
  onSelectReport,
  onOpenNewReportFromPole,
  onOpenNewReportAtCoords
}) {
  const [categoryFilter, setCategoryFilter] = React.useState("Tutte");
  const [statusFilter, setStatusFilter] = React.useState("Tutti");
  const [showIoTPoles, setShowIoTPoles] = React.useState(true);
  const [showFilterModal, setShowFilterModal] = React.useState(false);
  const [selectedPole, setSelectedPole] = React.useState(null);
  const [selectedMapReport, setSelectedMapReport] = React.useState(null);
  const [pickLocationMode, setPickLocationMode] = React.useState(false);

  const mapContainerRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const markersLayerRef = React.useRef(null);

  const categories = ["Tutte", "Illuminazione", "Rifiuti", "Verde & Alberi", "Strade & Buche", "Sicurezza & Idro"];

  const filteredReports = React.useMemo(() => {
    return reports.filter((r) => {
      const matchCat = categoryFilter === "Tutte" || r.category === categoryFilter;
      const matchStatus =
        statusFilter === "Tutti" ||
        (statusFilter === "Aperte" && r.status === "open") ||
        (statusFilter === "In corso" && r.status === "in_progress") ||
        (statusFilter === "Risolte" && r.status === "resolved");
      return matchCat && matchStatus;
    });
  }, [reports, categoryFilter, statusFilter]);

  // Inizializzazione mappa Leaflet
  React.useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [45.6618, 9.1580],
      zoom: 15,
      zoomControl: false
    });

    L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; OpenStreetMap &copy; CARTO | A2A Smart City Layer'
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    markersLayerRef.current = markersLayer;

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Gestione click sulla mappa per aggiungere segnalazione geolocalizzata
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = (e) => {
      if (pickLocationMode) {
        setPickLocationMode(false);
        onOpenNewReportAtCoords({
          lat: Number(e.latlng.lat.toFixed(4)),
          lng: Number(e.latlng.lng.toFixed(4)),
          address: `Posizione GPS (${e.latlng.lat.toFixed(4)}, ${e.latlng.lng.toFixed(4)}), Meda`
        });
      }
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [pickLocationMode, onOpenNewReportAtCoords]);

  // Aggiornamento markers quando cambiano filtri o dati
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // 1. Aggiungi Markers Segnalazioni
    filteredReports.forEach((rep) => {
      const colorMap = {
        open: { bg: "#ef4444", ring: "rgba(239, 68, 68, 0.35)", icon: "!" },
        in_progress: { bg: "#f59e0b", ring: "rgba(245, 158, 11, 0.35)", icon: "⚙" },
        resolved: { bg: "#10b981", ring: "rgba(16, 185, 129, 0.35)", icon: "✓" }
      };
      const st = colorMap[rep.status] || colorMap.open;

      const customIcon = L.divIcon({
        className: "custom-pin-marker",
        html: `
          <div style="
            position: relative;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              position: absolute;
              inset: -5px;
              background: ${st.ring};
              border-radius: 9999px;
              animation: pulse 2s infinite;
            "></div>
            <div style="
              position: relative;
              width: 32px;
              height: 32px;
              background: ${st.bg};
              color: white;
              font-weight: 800;
              font-size: 15px;
              border-radius: 50% 50% 50% 0;
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              border: 2.5px solid white;
              box-shadow: 0 4px 10px rgba(0,0,0,0.28);
            ">
              <span style="transform: rotate(45deg);">${st.icon}</span>
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 34]
      });

      const marker = L.marker([rep.lat, rep.lng], { icon: customIcon });
      marker.on("click", () => {
        setSelectedPole(null);
        setSelectedMapReport(rep);
        map.flyTo([rep.lat, rep.lng], 16, { duration: 0.5 });
      });
      marker.addTo(layer);
    });

    // 2. Aggiungi Markers Pali Intelligenti IoT A2A
    if (showIoTPoles) {
      qrPoles.forEach((pole) => {
        const poleIcon = L.divIcon({
          className: "iot-pole-marker",
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 4px;
              background: #052e2b;
              color: #34d399;
              padding: 4px 8px;
              border-radius: 999px;
              border: 2px solid #10b981;
              box-shadow: 0 4px 12px rgba(5, 46, 43, 0.45);
              font-size: 11px;
              font-weight: 700;
              white-space: nowrap;
            ">
              <span>📡</span>
              <span>AQI ${pole.sensor.aqi}</span>
            </div>
          `,
          iconSize: [74, 28],
          iconAnchor: [37, 14]
        });

        const marker = L.marker([pole.lat, pole.lng], { icon: poleIcon });
        marker.on("click", () => {
          setSelectedMapReport(null);
          setSelectedPole(pole);
          map.flyTo([pole.lat, pole.lng], 16, { duration: 0.5 });
        });
        marker.addTo(layer);
      });
    }
  }, [filteredReports, qrPoles, showIoTPoles]);

  return (
    <div className="relative flex flex-col h-full w-full bg-slate-100 overflow-hidden select-none">
      {/* Top Overlay Filtri & Sensori IoT */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center justify-between gap-2 pointer-events-auto">
          {/* Toggle Sensori A2A */}
          <button
            onClick={() => setShowIoTPoles(!showIoTPoles)}
            className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold shadow-md transition-all border ${
              showIoTPoles
                ? "bg-[#052e2b] text-emerald-300 border-emerald-500"
                : "bg-white text-slate-700 border-slate-200"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Pali IoT A2A ({qrPoles.length})</span>
          </button>

          <div className="flex items-center gap-1.5">
            {/* Bottone Segnala su Mappa */}
            <button
              onClick={() => {
                setSelectedPole(null);
                setSelectedMapReport(null);
                setPickLocationMode(!pickLocationMode);
              }}
              className={`px-3 py-2 rounded-full text-xs font-bold shadow-md transition-all border ${
                pickLocationMode
                  ? "bg-amber-500 text-white border-amber-600 animate-pulse"
                  : "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
              }`}
            >
              {pickLocationMode ? "📍 Tocca un punto..." : "+ Pin Mappa"}
            </button>

            {/* Bottone Filtri (come nel prototipo Pagina 8) */}
            <button
              onClick={() => setShowFilterModal(!showFilterModal)}
              className="bg-white text-slate-800 px-3.5 py-2 rounded-full text-xs font-bold shadow-md border border-slate-200 flex items-center gap-1.5 hover:bg-slate-50"
            >
              <span>Filtri</span>
              {(categoryFilter !== "Tutte" || statusFilter !== "Tutti") && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>
          </div>
        </div>

        {/* Barra rapida stati (Legenda interattiva come pin prototipo) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pointer-events-auto no-scrollbar">
          {[
            { id: "Tutti", label: `Tutti (${reports.length})`, dot: "bg-slate-400" },
            { id: "Aperte", label: "Critiche / Aperte", dot: "bg-red-500" },
            { id: "In corso", label: "In lavorazione", dot: "bg-amber-500" },
            { id: "Risolte", label: "Risolte", dot: "bg-emerald-500" }
          ].map((st) => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap shadow-sm border transition-all ${
                statusFilter === st.id
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white/95 text-slate-700 border-slate-200"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${st.dot}`} />
              <span>{st.label}</span>
            </button>
          ))}
        </div>

        {/* Pannello Filtri Categorie Espandibile */}
        {showFilterModal && (
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-slate-200 pointer-events-auto animate-fadeIn">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Filtra per Categoria Urbana
              </span>
              <button
                onClick={() => {
                  setCategoryFilter("Tutte");
                  setStatusFilter("Tutti");
                }}
                className="text-[11px] text-emerald-600 font-semibold hover:underline"
              >
                Resetta
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoryFilter(cat);
                    setShowFilterModal(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                    categoryFilter === cat
                      ? "bg-emerald-600 text-white font-semibold shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Container Mappa Leaflet */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Drawer Dettaglio Segnalazione Selezionata su Mappa */}
      {selectedMapReport && (
        <div className="absolute bottom-3 left-3 right-3 z-[450] bg-white rounded-2xl p-3.5 shadow-2xl border border-slate-200 animate-slideUp">
          <div className="flex items-start gap-3">
            <img
              src={selectedMapReport.image}
              alt={selectedMapReport.title}
              className="w-20 h-20 rounded-xl object-cover flex-shrink-0 border border-slate-100"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    selectedMapReport.status === "resolved"
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedMapReport.status === "in_progress"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {selectedMapReport.statusLabel}
                </span>
                <button
                  onClick={() => setSelectedMapReport(null)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold px-1"
                >
                  ✕
                </button>
              </div>
              <h4 className="font-bold text-slate-900 text-sm truncate mt-1">
                {selectedMapReport.title}
              </h4>
              <p className="text-xs text-slate-500 truncate">{selectedMapReport.address}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-slate-600 font-medium">
                  ❤️ {selectedMapReport.thanksCount} Grazie
                </span>
                <button
                  onClick={() => onSelectReport(selectedMapReport)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl shadow-sm transition"
                >
                  Apri Ticket →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer Dettaglio Sensore IoT Palo Intelligente A2A (Pagina 7 & 12 PDF) */}
      {selectedPole && (
        <div className="absolute bottom-3 left-3 right-3 z-[450] bg-[#052e2b] text-white rounded-2xl p-4 shadow-2xl border border-emerald-500/40 animate-slideUp">
          <div className="flex items-start justify-between gap-2 mb-2.5">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  SMART POLE AEB / A2A
                </span>
                <span className="text-[11px] text-emerald-200/80 font-mono">
                  {selectedPole.id}
                </span>
              </div>
              <h4 className="font-bold text-sm text-white mt-1">{selectedPole.code}</h4>
              <p className="text-xs text-emerald-200/70">{selectedPole.address}</p>
            </div>
            <button
              onClick={() => setSelectedPole(null)}
              className="text-emerald-300/70 hover:text-white text-sm font-bold px-1.5"
            >
              ✕
            </button>
          </div>

          {/* Griglia Telemetria Real-Time IoT */}
          <div className="grid grid-cols-3 gap-2 my-2.5 bg-white/5 p-2.5 rounded-xl border border-white/10">
            <div>
              <span className="text-[10px] text-emerald-200/70 block">Qualità Aria</span>
              <span className="text-xs font-bold text-emerald-300">
                AQI {selectedPole.sensor.aqi} ({selectedPole.sensor.aqiLabel})
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-200/70 block">Temp / Umidità</span>
              <span className="text-xs font-bold text-white">
                {selectedPole.sensor.temp} · {selectedPole.sensor.humidity}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-200/70 block">PM 2.5</span>
              <span className="text-xs font-bold text-white">{selectedPole.sensor.pm25}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-emerald-100/90 mb-3">
            <span>💡 Stato LED: {selectedPole.sensor.ledStatus}</span>
          </div>

          <button
            onClick={() => {
              const pole = selectedPole;
              setSelectedPole(null);
              onOpenNewReportFromPole(pole);
            }}
            className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
          >
            <span>📷</span>
            <span>Segnala qui con QR Code ({selectedPole.id})</span>
          </button>
        </div>
      )}
    </div>
  );
};
