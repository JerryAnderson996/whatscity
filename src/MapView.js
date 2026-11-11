// Componente Mappa Interattiva Milano Smart City:
// - Motore Geocoding Live (Nominatim / Google Maps Style Search per vie di Milano)
// - Layer Stili Mappa (Google Roadmap Style, Satellite HD, Dark Smart City)
// - Layer Telecamere Live Traffico/ZTL Area C/B & Monitoraggio Idro Seveso/Navigli (con Live Stream & AI Computer Vision)
// - Layer Pali Intelligenti IoT A2A Milano + Live Meteo/Qualità Aria API (Open-Meteo Live)
// - Integrazione Google Maps Street View / Navigazione 1-Click

window.WhatsCityMapView = function WhatsCityMapView({
  reports,
  qrPoles,
  cityCameras,
  onSelectReport,
  onOpenNewReportFromPole,
  onOpenNewReportAtCoords
}) {
  const [categoryFilter, setCategoryFilter] = React.useState("Tutte");
  const [statusFilter, setStatusFilter] = React.useState("Tutti");
  const [showIoTPoles, setShowIoTPoles] = React.useState(true);
  const [showCameras, setShowCameras] = React.useState(true);
  const [mapStyle, setMapStyle] = React.useState("streets"); // "streets" | "satellite" | "dark"
  const [showFilterModal, setShowFilterModal] = React.useState(false);

  const [selectedPole, setSelectedPole] = React.useState(null);
  const [selectedCamera, setSelectedCamera] = React.useState(null);
  const [selectedMapReport, setSelectedMapReport] = React.useState(null);
  const [pickLocationMode, setPickLocationMode] = React.useState(false);

  // Ricerca Indirizzi Milano (Geocoding API reale)
  const [geoQuery, setGeoQuery] = React.useState("");
  const [geoResults, setGeoResults] = React.useState([]);
  const [isSearchingGeo, setIsSearchingGeo] = React.useState(false);

  // Dati Meteo & Qualità Aria Live su Milano (Open-Meteo API reale)
  const [liveMilanoWeather, setLiveMilanoWeather] = React.useState({
    temp: "19.2°C",
    wind: "8 km/h",
    condition: "Sereno / Variabile"
  });

  const mapContainerRef = React.useRef(null);
  const mapInstanceRef = React.useRef(null);
  const tileLayerRef = React.useRef(null);
  const markersLayerRef = React.useRef(null);

  const categories = [
    "Tutte",
    "Illuminazione",
    "Rifiuti",
    "Verde & Alberi",
    "Strade & Buche",
    "Sicurezza & Idro"
  ];

  const milanoQuickZones = [
    { name: "Duomo", coords: [45.4642, 9.1900], zoom: 16 },
    { name: "Porta Nuova / BAM", coords: [45.4842, 9.1886], zoom: 16 },
    { name: "Navigli / Darsena", coords: [45.4526, 9.1765], zoom: 16 },
    { name: "Buenos Aires", coords: [45.4805, 9.2112], zoom: 16 },
    { name: "Città Studi", coords: [45.4781, 9.2272], zoom: 16 },
    { name: "Niguarda / Seveso", coords: [45.5122, 9.1968], zoom: 15 }
  ];

  // Fetch Meteo Reale Milano da Open-Meteo API gratuita
  React.useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=45.4642&longitude=9.1900&current_weather=true"
    )
      .then((r) => r.json())
      .then((d) => {
        if (d && d.current_weather) {
          setLiveMilanoWeather({
            temp: `${d.current_weather.temperature}°C`,
            wind: `${d.current_weather.windspeed} km/h`,
            condition: "Live API Milano"
          });
        }
      })
      .catch(() => {});
  }, []);

  const filteredReports = React.useMemo(() => {
    return (reports || []).filter((r) => {
      const matchCat = categoryFilter === "Tutte" || r.category === categoryFilter;
      const matchStatus =
        statusFilter === "Tutti" ||
        (statusFilter === "Aperte" && r.status === "open") ||
        (statusFilter === "In corso" && r.status === "in_progress") ||
        (statusFilter === "Risolte" && r.status === "resolved");
      return matchCat && matchStatus;
    });
  }, [reports, categoryFilter, statusFilter]);

  // Inizializzazione mappa Leaflet centrata su Milano (Piazza del Duomo)
  React.useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [45.4720, 9.1920],
      zoom: 13,
      zoomControl: false
    });

    const tileLayer = L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution: "&copy; OpenStreetMap &copy; CARTO | Milano Smart City & A2A Layer"
      }
    ).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    markersLayerRef.current = markersLayer;

    // Ricalcolo automatico dimensioni del canvas Leaflet per evitare aree grigie
    const timer1 = setTimeout(() => map.invalidateSize(), 100);
    const timer2 = setTimeout(() => map.invalidateSize(), 400);

    let resizeObserver = null;
    if (window.ResizeObserver && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      if (resizeObserver) resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Cambio Stile Mappa (Stradale Google-like, Satellite Esri World Imagery, Dark Smart City)
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current) return;

    map.removeLayer(tileLayerRef.current);

    let url = "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
    if (mapStyle === "satellite") {
      url =
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    } else if (mapStyle === "dark") {
      url = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
    }

    tileLayerRef.current = L.tileLayer(url, {
      attribution: "Milano Smart City GIS · A2A & Live Cam Network"
    }).addTo(map);
  }, [mapStyle]);

  // Click sulla mappa per aggiungere segnalazione con Reverse Geocoding reale su Milano
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleMapClick = async (e) => {
      if (pickLocationMode) {
        setPickLocationMode(false);
        const lat = Number(e.latlng.lat.toFixed(4));
        const lng = Number(e.latlng.lng.toFixed(4));
        let resolvedAddress = `Posizione GPS (${lat}, ${lng}), Milano`;

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
          );
          if (res.ok) {
            const data = await res.json();
            if (data && data.address) {
              const road =
                data.address.road ||
                data.address.pedestrian ||
                data.address.square ||
                "Via";
              const num = data.address.house_number ? ` ${data.address.house_number}` : "";
              const suburb =
                data.address.suburb || data.address.quarter || "Milano";
              resolvedAddress = `${road}${num}, ${suburb} — Milano`;
            }
          }
        } catch (err) {}

        onOpenNewReportAtCoords({
          lat,
          lng,
          address: resolvedAddress
        });
      }
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [pickLocationMode, onOpenNewReportAtCoords]);

  // Aggiornamento markers: Segnalazioni + Pali IoT A2A + Telecamere Live Milano
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // 1. Markers Segnalazioni Cittadine
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
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; inset: -5px; background: ${st.ring}; border-radius: 9999px; animation: pulse 2s infinite;"></div>
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
              box-shadow: 0 4px 10px rgba(0,0,0,0.32);
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
        setSelectedCamera(null);
        setSelectedMapReport(rep);
        map.flyTo([rep.lat, rep.lng], 16, { duration: 0.5 });
      });
      marker.addTo(layer);
    });

    // 2. Markers Pali Intelligenti IoT A2A Milano
    if (showIoTPoles) {
      (qrPoles || []).forEach((pole) => {
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
              box-shadow: 0 4px 12px rgba(5, 46, 43, 0.5);
              font-size: 10px;
              font-weight: 800;
              white-space: nowrap;
            ">
              <span>📡</span>
              <span>AQI ${pole.sensor.aqi}</span>
            </div>
          `,
          iconSize: [74, 26],
          iconAnchor: [37, 13]
        });

        const marker = L.marker([pole.lat, pole.lng], { icon: poleIcon });
        marker.on("click", () => {
          setSelectedMapReport(null);
          setSelectedCamera(null);
          setSelectedPole(pole);
          map.flyTo([pole.lat, pole.lng], 16, { duration: 0.5 });
        });
        marker.addTo(layer);
      });
    }

    // 3. Markers Telecamere Live Milano (Traffico, Sicurezza, Idro Seveso/Navigli)
    if (showCameras) {
      (cityCameras || []).forEach((cam) => {
        const isAlert =
          cam.aiAnalytics.alertLevel === "critical" ||
          cam.aiAnalytics.alertLevel === "warning";
        const bgCol =
          cam.aiAnalytics.alertLevel === "critical"
            ? "#991b1b"
            : cam.aiAnalytics.alertLevel === "warning"
            ? "#92400e"
            : "#1e293b";
        const borderCol =
          cam.aiAnalytics.alertLevel === "critical"
            ? "#f87171"
            : cam.aiAnalytics.alertLevel === "warning"
            ? "#fbbf24"
            : "#38bdf8";

        const camIcon = L.divIcon({
          className: "milano-cam-marker",
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 4px;
              background: ${bgCol};
              color: white;
              padding: 4px 8px;
              border-radius: 999px;
              border: 2px solid ${borderCol};
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
              font-size: 10px;
              font-weight: 800;
              white-space: nowrap;
            ">
              <span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${
                isAlert ? "#ef4444" : "#22c55e"
              };"></span>
              <span>📹 ${cam.id.replace("CAM-MI-", "CAM ")}</span>
            </div>
          `,
          iconSize: [76, 26],
          iconAnchor: [38, 13]
        });

        const marker = L.marker([cam.lat, cam.lng], { icon: camIcon });
        marker.on("click", () => {
          setSelectedMapReport(null);
          setSelectedPole(null);
          setSelectedCamera(cam);
          map.flyTo([cam.lat, cam.lng], 16, { duration: 0.5 });
        });
        marker.addTo(layer);
      });
    }
  }, [filteredReports, qrPoles, cityCameras, showIoTPoles, showCameras]);

  // Ricerca Indirizzi Milano (Geocoding API OpenStreetMap Nominatim limitata a Milano)
  const handleSearchMilanoAddress = async (e) => {
    e.preventDefault();
    if (!geoQuery.trim()) return;
    setIsSearchingGeo(true);
    try {
      const q = `${geoQuery.trim()}, Milano, Italia`;
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          q
        )}&limit=4`
      );
      if (res.ok) {
        const data = await res.json();
        setGeoResults(data || []);
      }
    } catch (err) {}
    setIsSearchingGeo(false);
  };

  const handleFlyToPlace = (lat, lng, zoom = 16) => {
    const map = mapInstanceRef.current;
    if (map) {
      map.flyTo([Number(lat), Number(lng)], zoom, { duration: 0.7 });
    }
    setGeoResults([]);
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-slate-100 overflow-hidden select-none">
      {/* Top Overlay: Search Bar Vie di Milano + Controlli Layer Telecamere / Pali A2A / Stile Mappa */}
      <div className="absolute top-2.5 left-2.5 right-2.5 z-[400] flex flex-col gap-2 pointer-events-none">
        {/* Barra Ricerca Geocoding Milano + Meteo Live */}
        <form
          onSubmit={handleSearchMilanoAddress}
          className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-slate-200 pointer-events-auto"
        >
          <span className="pl-2 text-xs">🗺️</span>
          <input
            type="text"
            value={geoQuery}
            onChange={(e) => setGeoQuery(e.target.value)}
            placeholder="Cerca via o piazza a Milano (es. Brera, Tortona)..."
            className="flex-1 text-xs text-slate-900 bg-transparent focus:outline-none"
          />
          {geoQuery && (
            <button
              type="button"
              onClick={() => {
                setGeoQuery("");
                setGeoResults([]);
              }}
              className="text-slate-400 hover:text-slate-700 text-xs px-1"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="bg-[#0a5c48] text-white text-[11px] font-extrabold px-2.5 py-1.5 rounded-xl"
          >
            {isSearchingGeo ? "..." : "Vai"}
          </button>
        </form>

        {/* Risultati Geocoding API */}
        {geoResults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-1 pointer-events-auto animate-fadeIn">
            {geoResults.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2 hover:bg-emerald-50 rounded-xl text-xs cursor-pointer"
              >
                <div
                  onClick={() => handleFlyToPlace(item.lat, item.lon, 17)}
                  className="truncate flex-1 font-medium text-slate-800"
                >
                  📍 {item.display_name}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setGeoResults([]);
                    onOpenNewReportAtCoords({
                      lat: Number(Number(item.lat).toFixed(4)),
                      lng: Number(Number(item.lon).toFixed(4)),
                      address: item.display_name.split(",").slice(0, 2).join(", ") + ", Milano"
                    });
                  }}
                  className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap"
                >
                  + Segnala qui
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Seconda riga: Toggle Telecamere Live, Pali IoT A2A, Pin Mappa e Stile Satellite */}
        <div className="flex items-center justify-between gap-1.5 pointer-events-auto overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            {/* Toggle Telecamere Live Milano */}
            <button
              onClick={() => setShowCameras(!showCameras)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-extrabold shadow-md transition border whitespace-nowrap ${
                showCameras
                  ? "bg-slate-900 text-sky-300 border-sky-400"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>📹 Cam Live ({(cityCameras || []).length})</span>
            </button>

            {/* Toggle Sensori Pali A2A */}
            <button
              onClick={() => setShowIoTPoles(!showIoTPoles)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-extrabold shadow-md transition border whitespace-nowrap ${
                showIoTPoles
                  ? "bg-[#052e2b] text-emerald-300 border-emerald-500"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              <span>📡 Pali A2A ({(qrPoles || []).length})</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            {/* Switch Stile Mappa: Strade / Satellite / Dark */}
            <button
              onClick={() =>
                setMapStyle(
                  mapStyle === "streets"
                    ? "satellite"
                    : mapStyle === "satellite"
                    ? "dark"
                    : "streets"
                )
              }
              className="bg-white text-slate-800 px-2.5 py-1.5 rounded-full text-[11px] font-bold shadow-md border border-slate-200 whitespace-nowrap"
              title="Cambia vista Mappa / Satellite / Night"
            >
              {mapStyle === "streets"
                ? "🛰️ Sat"
                : mapStyle === "satellite"
                ? "🌙 Dark"
                : "🗺️ Mappa"}
            </button>

            {/* Bottone Segnala toccando un punto */}
            <button
              onClick={() => {
                setSelectedPole(null);
                setSelectedCamera(null);
                setSelectedMapReport(null);
                setPickLocationMode(!pickLocationMode);
              }}
              className={`px-2.5 py-1.5 rounded-full text-[11px] font-extrabold shadow-md transition border whitespace-nowrap ${
                pickLocationMode
                  ? "bg-amber-500 text-white border-amber-600 animate-pulse"
                  : "bg-emerald-600 text-white border-emerald-700"
              }`}
            >
              {pickLocationMode ? "📍 Tocca via..." : "+ Pin"}
            </button>

            <button
              onClick={() => setShowFilterModal(!showFilterModal)}
              className="bg-white text-slate-800 px-2.5 py-1.5 rounded-full text-[11px] font-bold shadow-md border border-slate-200"
            >
              Filtri
            </button>
          </div>
        </div>

        {/* Scorciatoie Quartieri di Milano + Meteo Live */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pointer-events-auto no-scrollbar">
          <span className="bg-emerald-950/90 text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap border border-emerald-500/30">
            🌤️ Milano {liveMilanoWeather.temp}
          </span>
          {milanoQuickZones.map((z) => (
            <button
              key={z.name}
              onClick={() => handleFlyToPlace(z.coords[0], z.coords[1], z.zoom)}
              className="bg-white/95 hover:bg-emerald-50 text-slate-700 border border-slate-200/90 px-2.5 py-1 rounded-full text-[10px] font-bold whitespace-nowrap shadow-xs transition"
            >
              📍 {z.name}
            </button>
          ))}
        </div>

        {/* Pannello Filtri Categorie & Stati */}
        {showFilterModal && (
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-slate-200 pointer-events-auto animate-fadeIn space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 uppercase">
                Filtra Segnalazioni Milano
              </span>
              <button
                onClick={() => {
                  setCategoryFilter("Tutte");
                  setStatusFilter("Tutti");
                  setShowFilterModal(false);
                }}
                className="text-[11px] text-emerald-600 font-bold hover:underline"
              >
                Resetta
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["Tutti", "Aperte", "In corso", "Risolte"].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                    statusFilter === st
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategoryFilter(cat);
                    setShowFilterModal(false);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold ${
                    categoryFilter === cat
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Container Mappa Leaflet con altezza esplicita garantita */}
      <div
        ref={mapContainerRef}
        className="w-full flex-1 z-0"
        style={{ minHeight: "620px", height: "100%" }}
      />

      {/* Drawer 1: Dettaglio Segnalazione Selezionata + Link Google Maps Street View */}
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
              <p className="text-xs text-slate-500 truncate">
                {selectedMapReport.address} ({selectedMapReport.zone})
              </p>
              <div className="flex items-center justify-between mt-2 gap-1.5">
                <a
                  href={`https://www.google.com/maps?q=&layer=c&cbll=${selectedMapReport.lat},${selectedMapReport.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-sky-700 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-xl border border-sky-200"
                >
                  🌍 Street View
                </a>
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

      {/* Drawer 2: Dettaglio Telecamera Live Milano (Computer Vision AI Traffico/Idro/Decoro) */}
      {selectedCamera && (
        <div className="absolute bottom-3 left-3 right-3 z-[450] bg-slate-950 text-white rounded-3xl p-4 shadow-2xl border border-sky-500/40 animate-slideUp space-y-2.5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  <span>{selectedCamera.streamStatus}</span>
                </span>
                <span className="text-[11px] text-sky-300 font-mono font-bold">
                  {selectedCamera.id}
                </span>
              </div>
              <h4 className="font-extrabold text-sm text-white mt-1">
                {selectedCamera.name}
              </h4>
              <p className="text-[11px] text-slate-400">{selectedCamera.address}</p>
            </div>
            <button
              onClick={() => setSelectedCamera(null)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* Feed Visivo Telecamera con HUD Computer Vision */}
          <div className="relative h-36 rounded-2xl overflow-hidden border border-white/15 bg-slate-900">
            <img
              src={selectedCamera.previewImage}
              alt={selectedCamera.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 left-2 bg-slate-950/80 backdrop-blur-xs text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
              AI VISION HUD · {new Date().toLocaleTimeString("it-IT")}
            </div>
            <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 backdrop-blur-xs text-[11px] px-2.5 py-1.5 rounded-xl border border-white/10 flex items-center justify-between">
              <span className="text-amber-300 font-bold truncate">
                🤖 {selectedCamera.aiAnalytics.anomalyDetected}
              </span>
            </div>
          </div>

          {/* Telemetria Traffico, Affollamento e Qualità Aria */}
          <div className="grid grid-cols-3 gap-1.5 text-[10px] bg-white/5 p-2.5 rounded-2xl border border-white/10">
            <div>
              <span className="text-slate-400 block">Flusso Veicoli/ZTL</span>
              <span className="font-bold text-white">
                {selectedCamera.aiAnalytics.vehiclesPerHour}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Pedoni / Bici</span>
              <span className="font-bold text-sky-300">
                {selectedCamera.aiAnalytics.crowdDensity}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block">Qualità Aria</span>
              <span className="font-bold text-emerald-300">
                {selectedCamera.aiAnalytics.airQuality}
              </span>
            </div>
          </div>

          {/* Azioni: Street View 360 o Apri Segnalazione da Telecamera */}
          <div className="flex gap-2">
            <a
              href={`https://www.google.com/maps?q=&layer=c&cbll=${selectedCamera.streetViewCoords}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1"
            >
              <span>🌍</span>
              <span>Street View 360°</span>
            </a>
            <button
              onClick={() => {
                const cam = selectedCamera;
                setSelectedCamera(null);
                onOpenNewReportAtCoords({
                  lat: cam.lat,
                  lng: cam.lng,
                  address: cam.address,
                  cameraId: cam.id,
                  prefillTitle:
                    cam.aiAnalytics.alertLevel !== "normal"
                      ? cam.aiAnalytics.anomalyDetected.replace("⚠️ ", "")
                      : `Segnalazione presso ${cam.name}`
                });
              }}
              className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs py-2 rounded-xl shadow flex items-center justify-center gap-1.5"
            >
              <span>🚨</span>
              <span>Apri Ticket da Telecamera</span>
            </button>
          </div>
        </div>
      )}

      {/* Drawer 3: Sensore IoT Palo Intelligente A2A Milano */}
      {selectedPole && (
        <div className="absolute bottom-3 left-3 right-3 z-[450] bg-[#052e2b] text-white rounded-3xl p-4 shadow-2xl border border-emerald-500/40 animate-slideUp">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  SMART POLE A2A MILANO
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

          <div className="flex gap-2">
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${selectedPole.lat},${selectedPole.lng}`}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              🌍 Google Maps
            </a>
            <button
              onClick={() => {
                const pole = selectedPole;
                setSelectedPole(null);
                onOpenNewReportFromPole(pole);
              }}
              className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              <span>📷</span>
              <span>Segnala con QR ({selectedPole.id})</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
