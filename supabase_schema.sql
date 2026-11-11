-- =============================================================================
-- WHATSCITY - SCHEMA DATABASE POSTGRESQL PER SUPABASE (Backend Cloud Real-Time)
-- =============================================================================
-- Istruzioni:
-- 1. Crea un progetto gratuito su https://supabase.com
-- 2. Vai nella sezione "SQL Editor" -> "New query"
-- 3. Incolla tutto questo script e clicca su "Run"
-- 4. Copia "Project URL" e "anon public key" da Project Settings -> API
--    e incollali nel pannello "☁️ Cloud DB" dentro WhatsCity!
-- =============================================================================

-- 1. Tabella Utenti (Cittadini, Aziende B2B, Operatori PA)
CREATE TABLE IF NOT EXISTS public.whatscity_users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'citizen', -- 'citizen' | 'company' | 'pa'
  role_badge TEXT DEFAULT 'Cittadino attivo',
  user_type TEXT DEFAULT 'Privato',
  avatar TEXT,
  bio TEXT DEFAULT '',
  neighborhood TEXT DEFAULT 'Centro',
  vat_number TEXT DEFAULT '',
  company_sector TEXT DEFAULT '',
  department TEXT DEFAULT '',
  impact_score INTEGER DEFAULT 50,
  esg_score INTEGER DEFAULT 100,
  reports_count INTEGER DEFAULT 0,
  badges_count INTEGER DEFAULT 1,
  redeemed_rewards JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabella Segnalazioni / Post Social Geolocalizzati
CREATE TABLE IF NOT EXISTS public.whatscity_reports (
  id TEXT PRIMARY KEY,
  author_id TEXT,
  author_name TEXT NOT NULL,
  author_role TEXT DEFAULT 'Privato',
  author_avatar TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'Media',
  status TEXT DEFAULT 'open', -- 'open' | 'in_progress' | 'resolved'
  status_label TEXT DEFAULT 'Aperta',
  zone TEXT DEFAULT 'Centro',
  address TEXT NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  qr_pole_id TEXT,
  created_at TEXT DEFAULT 'Adesso',
  created_timestamp TIMESTAMPTZ DEFAULT NOW(),
  thanks_count INTEGER DEFAULT 0,
  liked_by JSONB DEFAULT '[]'::jsonb,
  citizen_confirmed BOOLEAN DEFAULT FALSE,
  assigned_company TEXT,
  image TEXT,
  after_image TEXT,
  comments JSONB DEFAULT '[]'::jsonb
);

-- Abilita accesso pubblico per la demo/MVP (Row Level Security aperta per lettura/scrittura rapida)
ALTER TABLE public.whatscity_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatscity_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public users access" ON public.whatscity_users;
CREATE POLICY "Public users access" ON public.whatscity_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public reports access" ON public.whatscity_reports;
CREATE POLICY "Public reports access" ON public.whatscity_reports FOR ALL USING (true) WITH CHECK (true);
