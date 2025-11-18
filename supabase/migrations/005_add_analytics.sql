-- Analytics table for tracking QR scans and clicks
CREATE TABLE IF NOT EXISTS analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('view', 'click')),
  event_data JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_analytics_employee_id ON analytics(employee_id);
CREATE INDEX idx_analytics_created_at ON analytics(created_at);
CREATE INDEX idx_analytics_event_type ON analytics(event_type);

-- RLS Policies
ALTER TABLE analytics ENABLE ROW LEVEL SECURITY;

-- Companies can view analytics for their own employees
CREATE POLICY "Companies can view own employee analytics"
  ON analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM employees
      WHERE employees.id = analytics.employee_id
      AND employees.company_id = auth.uid()
    )
  );

-- Public can insert analytics (for tracking views and clicks)
CREATE POLICY "Public can insert analytics"
  ON analytics FOR INSERT
  WITH CHECK (true);

-- Function to get view count for an employee
CREATE OR REPLACE FUNCTION get_employee_view_count(emp_id UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(*) FROM analytics
  WHERE employee_id = emp_id AND event_type = 'view';
$$ LANGUAGE SQL SECURITY DEFINER;

-- Function to get click count for an employee
CREATE OR REPLACE FUNCTION get_employee_click_count(emp_id UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(*) FROM analytics
  WHERE employee_id = emp_id AND event_type = 'click';
$$ LANGUAGE SQL SECURITY DEFINER;

