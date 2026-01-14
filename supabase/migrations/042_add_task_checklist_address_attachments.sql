-- Add new columns to tasks table for checklist, address, and attachments
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS checklist_items JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS checklist_completed JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';

-- Add comments
COMMENT ON COLUMN tasks.checklist_items IS 'Yapılacak işlemler listesi (opsiyonel)';
COMMENT ON COLUMN tasks.checklist_completed IS 'Tamamlanan işlemler listesi (opsiyonel)';
COMMENT ON COLUMN tasks.address IS 'Görev adresi (opsiyonel)';
COMMENT ON COLUMN tasks.attachments IS 'Ekli dosyalar (fotoğraf veya belge URL''leri)';
