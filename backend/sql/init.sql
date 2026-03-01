CREATE TABLE IF NOT EXISTS clothes (
  id UUID PRIMARY KEY,
  short_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  colors TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  seasons TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  occasions TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  description TEXT,
  image_url TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT clothes_category_chk CHECK (category IN ('top', 'bottom', 'dress', 'outerwear', 'shoes', 'accessory', 'bag')),
  CONSTRAINT clothes_status_chk CHECK (status IN ('draft', 'published', 'archived'))
);

CREATE INDEX IF NOT EXISTS clothes_status_idx ON clothes (status, created_at DESC);
CREATE INDEX IF NOT EXISTS clothes_category_idx ON clothes (category, created_at DESC);
CREATE INDEX IF NOT EXISTS clothes_colors_gin_idx ON clothes USING GIN (colors);
CREATE INDEX IF NOT EXISTS clothes_seasons_gin_idx ON clothes USING GIN (seasons);
CREATE INDEX IF NOT EXISTS clothes_occasions_gin_idx ON clothes USING GIN (occasions);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS clothes_set_updated_at ON clothes;
CREATE TRIGGER clothes_set_updated_at
BEFORE UPDATE ON clothes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
