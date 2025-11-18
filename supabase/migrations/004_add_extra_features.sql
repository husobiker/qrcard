-- Add extra links (Linktree style) to employees
ALTER TABLE employees
ADD COLUMN extra_links JSONB DEFAULT '[]'::jsonb;

-- Add meeting link (Google Meet, Zoom, etc.)
ALTER TABLE employees
ADD COLUMN meeting_link TEXT;

-- Add file URLs (CV, PDF, brochure, presentation)
ALTER TABLE employees
ADD COLUMN cv_url TEXT;
ALTER TABLE employees
ADD COLUMN pdf_url TEXT;
ALTER TABLE employees
ADD COLUMN brochure_url TEXT;
ALTER TABLE employees
ADD COLUMN presentation_url TEXT;

-- Add gallery images (array of image URLs)
ALTER TABLE employees
ADD COLUMN gallery_images JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN employees.extra_links IS 'Array of extra links in format: [{"title": "Kampanya", "url": "https://...", "icon": "link"}]';
COMMENT ON COLUMN employees.meeting_link IS 'Google Meet, Zoom, or other meeting platform link';
COMMENT ON COLUMN employees.gallery_images IS 'Array of image URLs for personal portfolio/gallery';

