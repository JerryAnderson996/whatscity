// Dati iniziali completi per WhatsCity (Meda / Brianza - AEB Gruppo A2A)
window.WHATSCITY_INITIAL_DATA = {
  currentUser: {
    id: "user-1",
    name: "Maria Rossi",
    roleBadge: "Cittadino attivo",
    userType: "Privato",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    impactScore: 145,
    reportsCount: 15,
    badgesCount: 3,
    redeemedRewards: ["rew-1"],
    badges: [
      { id: "b1", name: "Sentinella Verde", icon: "🌱", desc: "5+ segnalazioni ambientali risolte", unlocked: true },
      { id: "b2", name: "Occhio Civico", icon: "⚡", desc: "Prima segnalazione tramite QR Pali A2A", unlocked: true },
      { id: "b3", name: "Collaboratore Top", icon: "🏆", desc: "Oltre 100 punti City Impact Score", unlocked: true },
      { id: "b4", name: "Guardiano Idro", icon: "💧", desc: "Prevenzione allagamenti e caditoie", unlocked: false },
      { id: "b5", name: "Ambasciatore Smart", icon: "📡", desc: "10 scansioni QR Pali Intelligenti", unlocked: false },
      { id: "b6", name: "Eroe Urbano A2A", icon: "🌟", desc: "Raggiungi 300 punti Impact Score", unlocked: false }
    ]
  },
  rewardsCatalog: [
    {
      id: "rew-1",
      title: "Bonus 10€ Bolletta Luce/Gas AEB - A2A",
      sponsor: "AEB Gruppo A2A",
      cost: 100,
      icon: "⚡",
      description: "Sconto diretto in bolletta per i cittadini virtuosi che contribuiscono al monitoraggio energetico."
    },
    {
      id: "rew-2",
      title: "2 Biglietti Mobilità Sostenibile / Bike Sharing",
      sponsor: "Comune di Meda & Mobilità Verde",
      cost: 60,
      icon: "🚲",
      description: "Voucher gratuito di 4 ore per e-bike cittadine o trasporto pubblico locale."
    },
    {
      id: "rew-3",
      title: "Sconto 20% Mercato Agricolo & Zero Waste",
      sponsor: "Eco Azienda Brianza",
      cost: 80,
      icon: "🌿",
      description: "Buono spesa presso i negozi sostenibili aderenti al circuito WhatsCity."
    },
    {
      id: "rew-4",
      title: "Piantumazione Albero a Tuo Nome nel Parco",
      sponsor: "Rete Imprese Virtuose Meda",
      cost: 150,
      icon: "🌳",
      description: "Un nuovo albero piantato a Meda con targhetta digitale associata al tuo profilo civico."
    }
  ],
  notifications: [
    {
      id: "not-1",
      title: "Squadra AEB in uscita in Via Roma",
      body: "La tua segnalazione 'Lampione rotto in via Roma' è in lavorazione da AEB Luce & Reti S.p.A.",
      time: "35 min fa",
      read: false,
      type: "progress"
    },
    {
      id: "not-2",
      title: "+15 City Impact Score guadagnati!",
      body: "Grazie per aver confermato la risoluzione del marciapiede in Via de Rossi 11.",
      time: "Ieri",
      read: false,
      type: "reward"
    },
    {
      id: "not-3",
      title: "Allerta Preventiva Meteo & Idro (Palo #04)",
      body: "I sensori IoT A2A sul Torrente Tarò monitorano le piogge previste: segnala eventuali caditoie ostruite.",
      time: "2 giorni fa",
      read: true,
      type: "alert"
    }
  ],
  qrPoles: [
    {
      id: "QR-MEDA-01",
      code: "Palo Smart A2A #01 - Via Roma 14",
      zone: "Centro",
      lat: 45.6618,
      lng: 9.1585,
      address: "Via Roma 14, Meda (MB)",
      sensor: {
        aqi: 28,
        aqiLabel: "Buona",
        pm25: "9 µg/m³",
        temp: "18.4°C",
        humidity: "62%",
        ledStatus: "Funzionante (Dimming 80%)",
        trafficFlow: "Moderato (34 veicoli/ora)"
      }
    },
    {
      id: "QR-MEDA-02",
      code: "Palo Smart A2A #02 - Piazza Municipio",
      zone: "Centro",
      lat: 45.6632,
      lng: 9.1562,
      address: "Piazza Municipio, Meda (MB)",
      sensor: {
        aqi: 22,
        aqiLabel: "Ottima",
        pm25: "6 µg/m³",
        temp: "18.1°C",
        humidity: "60%",
        ledStatus: "Funzionante (100%)",
        trafficFlow: "ZTL - Pedonale"
      }
    },
    {
      id: "QR-MEDA-03",
      code: "Palo Smart A2A #03 - Via XXIV Maggio",
      zone: "Polo Sud",
      lat: 45.6589,
      lng: 9.1610,
      address: "Via XXIV Maggio 8, Meda (MB)",
      sensor: {
        aqi: 45,
        aqiLabel: "Discreta",
        pm25: "16 µg/m³",
        temp: "19.0°C",
        humidity: "58%",
        ledStatus: "Anomalia rilevata su lampione secondario",
        trafficFlow: "Intenso (112 veicoli/ora)"
      }
    },
    {
      id: "QR-MEDA-04",
      code: "Palo Smart A2A #04 - Parco Berlinguer / Torrente Tarò",
      zone: "Nord / Parco",
      lat: 45.6655,
      lng: 9.1538,
      address: "Via Indipendenza / Torrente Tarò, Meda (MB)",
      sensor: {
        aqi: 19,
        aqiLabel: "Ottima",
        pm25: "5 µg/m³",
        temp: "17.5°C",
        humidity: "74%",
        ledStatus: "Funzionante (Eco-Mode)",
        waterLevel: "Livello idrometrico normale (0.42m)"
      }
    }
  ],
  reports: [
    {
      id: "rep-101",
      authorName: "Maria Rossi",
      authorRole: "Privato",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      title: "Lampione rotto in via Roma",
      description: "Lampione spento da una settimana vicino all'attraversamento pedonale, segnalo per la riparazione urgente.",
      category: "Illuminazione",
      priority: "Alta",
      status: "in_progress",
      statusLabel: "In lavorazione",
      zone: "Centro",
      address: "Via Roma 14, Meda",
      lat: 45.6615,
      lng: 9.1588,
      qrPoleId: "QR-MEDA-01",
      createdAt: "2 ore fa",
      thanksCount: 18,
      thankedByMe: false,
      citizenConfirmed: false,
      assignedCompany: "AEB Luce & Reti S.p.A.",
      image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop&q=80",
      afterImage: null,
      comments: [
        { author: "Comune di Meda (PA)", text: "Ticket validato e assegnato con priorità alta.", time: "1 ora fa" },
        { author: "AEB Luce & Reti S.p.A.", text: "Squadra tecnica in uscita questo pomeriggio per sostituzione driver LED.", time: "35 min fa" }
      ]
    },
    {
      id: "rep-102",
      authorName: "Eco Azienda Brianza",
      authorRole: "Impresa Virtuosa ⭐",
      authorAvatar: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=150&auto=format&fit=crop&q=80",
      title: "Potatura degli alberi e pulizia verde in Via XXIV Maggio",
      description: "Intervento presa in carico per rami secchi sporgenti sulla pista ciclabile segnalati dai residenti.",
      category: "Verde & Alberi",
      priority: "Media",
      status: "in_progress",
      statusLabel: "In attesa di completamento",
      zone: "Polo Sud",
      address: "Via XXIV Maggio, Meda",
      lat: 45.6592,
      lng: 9.1605,
      qrPoleId: "QR-MEDA-03",
      createdAt: "5 ore fa",
      thanksCount: 24,
      thankedByMe: true,
      citizenConfirmed: false,
      assignedCompany: "Eco Azienda Brianza",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80",
      afterImage: null,
      comments: [
        { author: "Marco V.", text: "Grazie mille! Passando in bici era davvero pericoloso.", time: "3 ore fa" }
      ]
    },
    {
      id: "rep-103",
      authorName: "Luca Bianchi",
      authorRole: "Privato",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
      title: "Abbandono rifiuti ingombranti vicino area ecologica",
      description: "Segnalo sacchi e vecchi mobili abbandonati fuori dai cassonetti. Rilevato tramite QR code del palo intelligente.",
      category: "Rifiuti",
      priority: "Alta",
      status: "open",
      statusLabel: "Aperta",
      zone: "Nord / Parco",
      address: "Via Indipendenza 42, Meda",
      lat: 45.6648,
      lng: 9.1545,
      qrPoleId: "QR-MEDA-04",
      createdAt: "Ieri",
      thanksCount: 31,
      thankedByMe: false,
      citizenConfirmed: false,
      assignedCompany: null,
      image: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=800&auto=format&fit=crop&q=80",
      afterImage: null,
      comments: []
    },
    {
      id: "rep-104",
      authorName: "Maria Rossi",
      authorRole: "Privato",
      authorAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      title: "Ricostruzione marciapiede e buca profonda",
      description: "Pavimentazione sconnessa sistemata in tempi record grazie alla collaborazione tra Comune e impresa edile locale!",
      category: "Strade & Buche",
      priority: "Media",
      status: "resolved",
      statusLabel: "Completato",
      zone: "Centro",
      address: "Via de Rossi 11, Meda",
      lat: 45.6627,
      lng: 9.1552,
      qrPoleId: "QR-MEDA-02",
      createdAt: "3 giorni fa",
      thanksCount: 42,
      thankedByMe: true,
      citizenConfirmed: true,
      assignedCompany: "EdilStrade Briantea S.r.l.",
      image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=80",
      afterImage: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=80",
      comments: [
        { author: "EdilStrade Briantea S.r.l.", text: "Intervento completato con asfalto drenante eco-sostenibile. Allegata foto post-lavori!", time: "2 giorni fa" },
        { author: "Maria Rossi", text: "Confermo la risoluzione! Ottimo lavoro 👏", time: "2 giorni fa" }
      ]
    },
    {
      id: "rep-105",
      authorName: "Davide Ronzulli",
      authorRole: "Architetto Civico",
      authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
      title: "Caditoia ostruita da fogliame (Prevenzione Allagamenti)",
      description: "In vista delle piogge autunnali, segnalo tombino di scolo completamente ostruito per prevenire allagamenti stradali come quelli del 22/09/2025.",
      category: "Sicurezza & Idro",
      priority: "Alta",
      status: "open",
      statusLabel: "Aperta",
      zone: "Sud / Stazione",
      address: "Via Solferino, Meda",
      lat: 45.6601,
      lng: 9.1571,
      qrPoleId: null,
      createdAt: "4 ore fa",
      thanksCount: 19,
      thankedByMe: false,
      citizenConfirmed: false,
      assignedCompany: null,
      image: "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=800&auto=format&fit=crop&q=80",
      afterImage: null,
      comments: []
    }
  ]
};
