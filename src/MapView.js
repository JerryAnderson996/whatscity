// Componente Mappa Interattiva Milano Smart City (Stile Waze, 100% Free No-API-Key):
// - 4 Modalità Mappa:
//   1. 🗺️ Waze Clean (Esri World Street Map + filtro Waze pastel, MAI "API KEY REQUIRED")
//   2. 🚗 Waze Live Traffic (Iframe Ufficiale Waze Live Map centrato su Milano con traffico e avvisi reali!)
//   3. 🛰️ Satellite HD (Esri World Imagery)
//   4. 🗺️ OSM Standard (OpenStreetMap ufficiale)
// - Layer Telecamere Live Milano con Webcam Reali (SkylineWebcams Duomo, iLMeteo Navigli, LombardiaWebcam, Windy Live Radar)
// - Layer Pali Intelligenti IoT A2A Milano + Meteo Live

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
  const [mapStyle, setMapStyle] = React.useState("waze"); // "waze" | "waze_live" | "satellite" | "osm"
  const [wazeCoords, setWazeCoords] = React.useState({ lat: 45.4642, lng: 9.1900, zoom: 14 });
  const [showFilterModal, setShowFilterModal] = React.useState(false);

  const [selectedPole, setSelectedPole] = React.useState(null);
  const [selectedCamera, setSelectedCamera] = React.useState(null);
  const [camFeedTab, setCamFeedTab] = React.useState("live_radar"); // "live_radar" | "waze_cam" | "ai_hud"
  const [selectedMapReport, setSelectedMapReport] = React.useState(null);
  const [pickLocationMode, setPickLocationMode] = React.useState(false);

  // Ricerca Indirizzi Milano (Geocoding API reale)
  const [geoQuery, setGeoQuery] = React.useState("");
  const [geoResults, setGeoResults] = React.useState([]);
  const [isSearchingGeo, setIsSearchingGeo] = React.useState(false);

  // Dati Meteo Live su Milano (Open-Meteo API reale)
  const [liveMilanoWeather, setLiveMilanoWeather] = React.useState({
    temp: "14.5°C",
    wind: "9 km/h"
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

  React.useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=45.4642&longitude=9.1900&current_weather=true"
    )
      .then((r) => r.json())
      .then((d) => {
        if (d && d.current_weather) {
          setLiveMilanoWeather({
            temp: `${d.current_weather.temperature}°C`,
            wind: `${d.current_weather.windspeed} km/h`
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

  // Funzione helper per restituire l'URL dei tile SENZA MAI RICHIEDERE API KEY
  const getTileUrlForStyle = (style) => {
    if (style === "satellite") {
      return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
    }
    if (style === "osm") {
      return "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
    }
    // Default "waze": Esri World Street Map (gratuito, senza watermark API KEY, super nitido stile navigatore Waze)
    return "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}";
  };

  // Inizializzazione mappa Leaflet centrata su Milano
  React.useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [45.4685, 9.1900],
      zoom: 13,
      zoomControl: false
    });

    const tileLayer = L.tileLayer(getTileUrlForStyle(mapStyle), {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap &copy; Esri | WhatsCity Waze-Style Navigation"
    }).addTo(map);

    L.control.zoom({ position: "bottomright" }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    markersLayerRef.current = markersLayer;

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

  // Cambio Stile Mappa
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !tileLayerRef.current || mapStyle === "waze_live") return;

    map.removeLayer(tileLayerRef.current);
    tileLayerRef.current = L.tileLayer(getTileUrlForStyle(mapStyle), {
      maxZoom: 19,
      attribution: "WhatsCity Smart Navigation Milano · OpenStreetMap & Esri"
    }).addTo(map);
    setTimeout(() => map.invalidateSize(), 100);
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

  // Aggiornamento markers in stile WAZE (Bubble 3D arrotondate con ombra e icone grandi)
  React.useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    // 1. Markers Segnalazioni in stile Waze Alert Bubble
    filteredReports.forEach((rep) => {
      const catEmoji =
        rep.category === "Illuminazione"
          ? "💡"
          : rep.category === "Rifiuti"
          ? "🗑️"
          : rep.category === "Verde & Alberi"
          ? "🌳"
          : rep.category === "Sicurezza & Idro"
          ? "🌊"
          : "🚧";

      const colorMap = {
        open: { bg: "#ff3b30", border: "#ffffff", badge: "!" },
        in_progress: { bg: "#ffcc00", border: "#1e293b", badge: "🔧" },
        resolved: { bg: "#10b981", border: "#ffffff", badge: "✓" }
      };
      const st = colorMap[rep.status] || colorMap.open;

      const customIcon = L.divIcon({
        className: "custom-pin-marker",
        html: `
          <div style="
            position: relative;
            width: 44px;
            height: 48px;
            display: flex;
            flex-direction: column;
            align-items: center;
            filter: drop-shadow(0 6px 10px rgba(0,0,0,0.35));
            cursor: pointer;
          ">
            <div style="
              width: 40px;
              height: 40px;
              background: ${st.bg};
              border: 3px solid #ffffff;
              border-radius: 9999px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 19px;
              position: relative;
            ">
              <span>${catEmoji}</span>
              <span style="
                position: absolute;
                top: -4px;
                right: -4px;
                width: 16px;
                height: 16px;
                background: #0f172a;
                color: #fff;
                border-radius: 999px;
                font-size: 9px;
                font-weight: 900;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 1.5px solid #fff;
              ">${st.badge}</span>
            </div>
            <div style="
              width: 0;
              height: 0;
              border-left: 7px solid transparent;
              border-right: 7px solid transparent;
              border-top: 8px solid #ffffff;
              margin-top: -2px;
            "></div>
          </div>
        `,
        iconSize: [44, 48],
        iconAnchor: [22, 46]
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

    // 2. Markers Pali Intelligenti IoT A2A Milano (Pillola Smeraldo Waze-style)
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
              padding: 5px 10px;
              border-radius: 999px;
              border: 2.5px solid #10b981;
              box-shadow: 0 6px 14px rgba(5, 46, 43, 0.45);
              font-size: 11px;
              font-weight: 800;
              white-space: nowrap;
            ">
              <span>📡</span>
              <span>AQI ${pole.sensor.aqi}</span>
            </div>
          `,
          iconSize: [82, 30],
          iconAnchor: [41, 15]
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

    // 3. Markers Telecamere Live Milano (Badge Waze Blu/Rosso Live Cam)
    if (showCameras) {
      (cityCameras || []).forEach((cam) => {
        const isAlert =
          cam.aiAnalytics.alertLevel === "critical" ||
          cam.aiAnalytics.alertLevel === "warning";
        const bgCol =
          cam.aiAnalytics.alertLevel === "critical"
            ? "#dc2626"
            : cam.aiAnalytics.alertLevel === "warning"
            ? "#d97706"
            : "#0284c7";

        const camIcon = L.divIcon({
          className: "milano-cam-marker",
          html: `
            <div style="
              display: flex;
              align-items: center;
              gap: 5px;
              background: ${bgCol};
              color: white;
              padding: 5px 10px;
              border-radius: 999px;
              border: 2.5px solid #ffffff;
              box-shadow: 0 6px 14px rgba(0, 0, 0, 0.4);
              font-size: 11px;
              font-weight: 800;
              white-space: nowrap;
            ">
              <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${
                isAlert ? "#fef08a" : "#4ade80"
              };"></span>
              <span>📹 ${cam.id.replace("CAM-MI-", "CAM ")}</span>
            </div>
          `,
          iconSize: [86, 30],
          iconAnchor: [43, 15]
        });

        const marker = L.marker([cam.lat, cam.lng], { icon: camIcon });
        marker.on("click", () => {
          setSelectedMapReport(null);
          setSelectedPole(null);
          setCamFeedTab("live_radar");
          setSelectedCamera(cam);
          map.flyTo([cam.lat, cam.lng], 16, { duration: 0.5 });
        });
        marker.addTo(layer);
      });
    }
  }, [filteredReports, qrPoles, cityCameras, showIoTPoles, showCameras]);

  // Ricerca Indirizzi Milano
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
    setWazeCoords({ lat: Number(lat), lng: Number(lng), zoom });
    const map = mapInstanceRef.current;
    if (map && mapStyle !== "waze_live") {
      map.flyTo([Number(lat), Number(lng)], zoom, { duration: 0.7 });
    }
    setGeoResults([]);
  };

  return (
    <div className="relative flex flex-col h-full w-full bg-slate-100 overflow-hidden select-none">
      {/* Top Overlay Stile Waze: Ricerca + Selettore Mappa Waze / Traffico Live / Telecamere */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pointer-events-auto">
          {/* Barra Ricerca Geocoding Milano */}
          <form
            onSubmit={handleSearchMilanoAddress}
            className="flex-1 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-slate-200/90"
          >
            <span className="text-sm">🚗</span>
            <input
              type="text"
              value={geoQuery}
              onChange={(e) => setGeoQuery(e.target.value)}
              placeholder="Cerca via o incrocio a Milano (es. Brera, Corso Como, Duomo)..."
              className="flex-1 text-xs font-semibold text-slate-900 bg-transparent focus:outline-none"
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
              className="bg-[#0099ff] hover:bg-[#007acc] text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-xs transition"
            >
              {isSearchingGeo ? "..." : "Cerca"}
            </button>
          </form>

          {/* Selettore Modalità Mappa Waze */}
          <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-lg border border-slate-200/90 overflow-x-auto no-scrollbar">
            {[
              { id: "waze", label: "🗺️ Mappa Pin & Cam" },
              { id: "waze_live", label: "🚗 Waze Traffico Live" },
              { id: "satellite", label: "🛰️ Satellite HD" }
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMapStyle(m.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition ${
                  mapStyle === m.id
                    ? "bg-[#0099ff] text-white shadow-xs"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Risultati Geocoding API */}
        {geoResults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-2 space-y-1 pointer-events-auto animate-fadeIn max-w-xl">
            {geoResults.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 p-2 hover:bg-sky-50 rounded-xl text-xs cursor-pointer"
              >
                <div
                  onClick={() => handleFlyToPlace(item.lat, item.lon, 17)}
                  className="truncate flex-1 font-semibold text-slate-800"
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
                      address:
                        item.display_name.split(",").slice(0, 2).join(", ") + ", Milano"
                    });
                  }}
                  className="bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg whitespace-nowrap"
                >
                  + Segnala qui
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Barra controlli Layer (Telecamere Live, Pali A2A, Pin, Quartieri Milano) */}
        <div className="flex items-center justify-between gap-2 pointer-events-auto overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowCameras(!showCameras)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold shadow-md transition border whitespace-nowrap ${
                showCameras
                  ? "bg-[#0284c7] text-white border-white"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <span>📹 Telecamere Live ({(cityCameras || []).length})</span>
            </button>

            <button
              onClick={() => setShowIoTPoles(!showIoTPoles)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold shadow-md transition border whitespace-nowrap ${
                showIoTPoles
                  ? "bg-[#052e2b] text-emerald-300 border-emerald-500"
                  : "bg-white text-slate-600 border-slate-200"
              }`}
            >
              <span>📡 Pali A2A ({(qrPoles || []).length})</span>
            </button>

            <button
              onClick={() => {
                setSelectedPole(null);
                setSelectedCamera(null);
                setSelectedMapReport(null);
                if (mapStyle === "waze_live") setMapStyle("waze");
                setPickLocationMode(!pickLocationMode);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold shadow-md transition border whitespace-nowrap ${
                pickLocationMode
                  ? "bg-amber-500 text-white border-white animate-pulse"
                  : "bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700"
              }`}
            >
              {pickLocationMode ? "📍 Tocca un punto sulla mappa..." : "+ Segnala su Mappa"}
            </button>

            <button
              onClick={() => setShowFilterModal(!showFilterModal)}
              className="bg-white text-slate-800 px-3 py-1.5 rounded-full text-xs font-bold shadow-md border border-slate-200 whitespace-nowrap"
            >
              Filtri
            </button>
          </div>

          {/* Scorciatoie Quartieri di Milano */}
          <div className="flex items-center gap-1.5">
            <span className="bg-slate-900/90 text-emerald-300 text-[11px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap">
              🌤️ Milano {liveMilanoWeather.temp}
            </span>
            {milanoQuickZones.map((z) => (
              <button
                key={z.name}
                onClick={() => handleFlyToPlace(z.coords[0], z.coords[1], z.zoom)}
                className="bg-white/95 hover:bg-sky-50 text-slate-700 border border-slate-200 px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap shadow-xs transition"
              >
                📍 {z.name}
              </button>
            ))}
          </div>
        </div>

        {/* Pannello Filtri Categorie & Stati */}
        {showFilterModal && (
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 shadow-xl border border-slate-200 pointer-events-auto animate-fadeIn space-y-2.5 max-w-md">
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

      {/* VISTA 1: IFRAME UFFICIALE WAZE LIVE TRAFFIC MILANO (Quando l'utente clicca "🚗 Waze Traffico Live") */}
      {mapStyle === "waze_live" && (
        <div className="w-full flex-1 z-10 pt-28 sm:pt-24 bg-slate-900 flex flex-col">
          <iframe
            title="Waze Live Map Milano"
            src={`https://embed.waze.com/it/iframe?zoom=${wazeCoords.zoom}&lat=${wazeCoords.lat}&lon=${wazeCoords.lng}&pin=1`}
            className="w-full flex-1 border-0"
            allowFullScreen
          />
          <div className="bg-slate-900 text-white px-4 py-2 text-xs flex items-center justify-between">
            <span>
              🚗 <strong>Waze Live Traffic Milano</strong> (Traffico, incidenti e cantieri in tempo reale)
            </span>
            <button
              onClick={() => setMapStyle("waze")}
              className="bg-[#0099ff] text-white font-bold px-3 py-1 rounded-lg text-xs"
            >
              Torna ai Pin & Telecamere WhatsCity →
            </button>
          </div>
        </div>
      )}

      {/* VISTA 2: Container Mappa Interattiva Leaflet con Pin Waze, Pali A2A e Telecamere Live */}
      <div
        ref={mapContainerRef}
        className={`w-full flex-1 z-0 ${mapStyle === "waze_live" ? "hidden" : "block"}`}
        style={{ minHeight: "580px", height: "100%" }}
      />

      {/* Drawer 1: Dettaglio Segnalazione Selezionata */}
      {selectedMapReport && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[420px] z-[450] bg-white rounded-3xl p-4 shadow-2xl border border-slate-200 animate-slideUp">
          <div className="flex items-start gap-3">
            <img
              src={selectedMapReport.image}
              alt={selectedMapReport.title}
              className="w-20 h-20 rounded-2xl object-cover flex-shrink-0 border border-slate-100"
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
              <h4 className="font-extrabold text-slate-900 text-sm truncate mt-1">
                {selectedMapReport.title}
              </h4>
              <p className="text-xs text-slate-500 truncate">
                {selectedMapReport.address} ({selectedMapReport.zone})
              </p>
              <div className="flex items-center justify-between mt-2.5 gap-2">
                <button
                  onClick={() => {
                    setWazeCoords({
                      lat: selectedMapReport.lat,
                      lng: selectedMapReport.lng,
                      zoom: 16
                    });
                    setSelectedMapReport(null);
                    setMapStyle("waze_live");
                  }}
                  className="text-[11px] font-extrabold text-[#0099ff] bg-sky-50 hover:bg-sky-100 px-3 py-1.5 rounded-xl border border-sky-200"
                >
                  🚗 Vedi Traffico Waze qui
                </button>
                <button
                  onClick={() => onSelectReport(selectedMapReport)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3.5 py-1.5 rounded-xl shadow-sm transition"
                >
                  Apri Ticket →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Drawer 2: TELECAMERA LIVE REALE DI MILANO (Embed Live Radar/Meteo + Waze Traffic + Link Webcam Reale Attiva) */}
      {selectedCamera && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[460px] z-[450] bg-slate-950 text-white rounded-3xl p-4 shadow-2xl border border-sky-500/50 animate-slideUp space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 bg-red-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
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
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* Switcher Feed Live Reali dentro il Player della Telecamera */}
          <div className="grid grid-cols-3 gap-1 bg-white/10 p-1 rounded-xl text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setCamFeedTab("live_radar")}
              className={`py-1.5 rounded-lg transition ${
                camFeedTab === "live_radar"
                  ? "bg-[#0099ff] text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              🌦️ Live Meteo/Cam
            </button>
            <button
              type="button"
              onClick={() => setCamFeedTab("waze_cam")}
              className={`py-1.5 rounded-lg transition ${
                camFeedTab === "waze_cam"
                  ? "bg-[#0099ff] text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              🚗 Live Waze
            </button>
            <button
              type="button"
              onClick={() => setCamFeedTab("ai_hud")}
              className={`py-1.5 rounded-lg transition ${
                camFeedTab === "ai_hud"
                  ? "bg-[#0099ff] text-white"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              🤖 AI Vision HUD
            </button>
          </div>

          {/* Finestra Player Live (Iframe Windy Live / Waze Live / AI Snapshot) */}
          <div className="relative h-48 rounded-2xl overflow-hidden border border-white/15 bg-slate-900">
            {camFeedTab === "live_radar" && (
              <iframe
                title={`Live Radar & Cam ${selectedCamera.name}`}
                src={selectedCamera.windyEmbedUrl}
                className="w-full h-full border-0"
                allowFullScreen
              />
            )}
            {camFeedTab === "waze_cam" && (
              <iframe
                title={`Waze Traffic Live ${selectedCamera.name}`}
                src={selectedCamera.wazeEmbedUrl}
                className="w-full h-full border-0"
                allowFullScreen
              />
            )}
            {camFeedTab === "ai_hud" && (
              <div className="relative w-full h-full">
                <img
                  src={selectedCamera.previewImage}
                  alt={selectedCamera.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 left-2 bg-slate-950/80 text-[10px] font-mono text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40">
                  AI VISION HUD · {new Date().toLocaleTimeString("it-IT")}
                </div>
                <div className="absolute bottom-2 left-2 right-2 bg-slate-950/85 text-[11px] px-2.5 py-1.5 rounded-xl border border-white/10">
                  <span className="text-amber-300 font-bold">
                    🤖 {selectedCamera.aiAnalytics.anomalyDetected}
                  </span>
                </div>
              </div>
            )}
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

          {/* Azioni: Apri Webcam Reale Attiva a Milano (SkylineWebcams / iLMeteo / Windy) o Apri Ticket */}
          <div className="flex gap-2">
            <a
              href={selectedCamera.liveWebcamUrl}
              target="_blank"
              rel="noreferrer"
              className="flex-1 px-3 py-2.5 rounded-xl bg-[#0099ff] hover:bg-[#007acc] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <span>📹</span>
              <span>Apri Stream Webcam Reale Milano ↗</span>
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
              className="px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-xs rounded-xl shadow whitespace-nowrap"
            >
              🚨 Segnala qui
            </button>
          </div>
        </div>
      )}

      {/* Drawer 3: Sensore IoT Palo Intelligente A2A Milano */}
      {selectedPole && (
        <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-[420px] z-[450] bg-[#052e2b] text-white rounded-3xl p-4 shadow-2xl border border-emerald-500/40 animate-slideUp">
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
            <button
              onClick={() => {
                setWazeCoords({ lat: selectedPole.lat, lng: selectedPole.lng, zoom: 16 });
                setSelectedPole(null);
                setMapStyle("waze_live");
              }}
              className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              🚗 Traffico Waze
            </button>
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
