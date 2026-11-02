-- ============================================================
-- SIGAP DPUPR PBD — SQL Migration
-- Tabel: sigap_daily_reports & sigap_daily_report_items
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- 1. Tabel Laporan Harian
CREATE TABLE IF NOT EXISTS sigap_daily_reports (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id    uuid REFERENCES sigap_pengawasan(id) ON DELETE CASCADE NOT NULL,
  report_date   date NOT NULL,
  weather       text DEFAULT 'Cerah' CHECK (weather IN ('Cerah', 'Hujan', 'Berawan')),
  manpower      integer DEFAULT 0,
  findings      text,
  coords        text,
  photo_urls    text[] DEFAULT '{}',
  is_verified   boolean DEFAULT false,
  verified_by   uuid REFERENCES auth.users(id),
  verified_at   timestamptz,
  created_by    uuid REFERENCES auth.users(id),
  created_at    timestamptz DEFAULT now()
);

-- 2. Tabel Item Per Laporan (Volume Pekerjaan Harian per DKH Item)
CREATE TABLE IF NOT EXISTS sigap_daily_report_items (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id     uuid REFERENCES sigap_daily_reports(id) ON DELETE CASCADE NOT NULL,
  dkh_item_id   uuid,
  day_vol       numeric DEFAULT 0
);

-- 3. Indexes untuk performa
CREATE INDEX IF NOT EXISTS idx_daily_reports_project_id ON sigap_daily_reports(project_id);
CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON sigap_daily_reports(report_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_report_items_report_id ON sigap_daily_report_items(report_id);

-- 4. Enable Row Level Security
ALTER TABLE sigap_daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE sigap_daily_report_items ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Semua user login bisa baca laporan harian"
  ON sigap_daily_reports FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Semua user login bisa baca item laporan"
  ON sigap_daily_report_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "User login bisa buat laporan"
  ON sigap_daily_reports FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "User login bisa buat item laporan"
  ON sigap_daily_report_items FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Verifikator bisa update status laporan"
  ON sigap_daily_reports FOR UPDATE
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('PPK', 'PPTK', 'ADMIN', 'STAF_DINAS')
    )
  );
