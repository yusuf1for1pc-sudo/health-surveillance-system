-- 1. Create Heatmap View (Grid Aggregation for Privacy)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rounds lat/long to 2 decimal places (approx 1.1km grid) to hide exact patient location
CREATE OR REPLACE VIEW public.gov_disease_heatmap AS
SELECT 
    ROUND(p.latitude::numeric, 2) as lat_grid,
    ROUND(p.longitude::numeric, 2) as lon_grid,
    m.icd_label as disease,
    COUNT(*) as case_count
FROM medical_records m
JOIN patients p ON m.patient_id = p.id
WHERE 
    p.latitude IS NOT NULL 
    AND p.longitude IS NOT NULL
    AND m.created_at > (NOW() - INTERVAL '30 days') -- Active outbreaks only
GROUP BY 
    ROUND(p.latitude::numeric, 2), 
    ROUND(p.longitude::numeric, 2),
    m.icd_label;

-- 2. Create Disease Thresholds Table
CREATE TABLE IF NOT EXISTS public.disease_thresholds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    disease_name TEXT NOT NULL,
    region TEXT NOT NULL, -- City or State
    threshold_count INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed some thresholds
INSERT INTO public.disease_thresholds (disease_name, region, threshold_count) VALUES
('Dengue', 'Mumbai', 50),
('Malaria', 'Mumbai', 30),
('Cholera', 'Pune', 10)
ON CONFLICT DO NOTHING;

-- 3. Create Alerts Table
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    severity TEXT CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    region TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ignored')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 4. Create Materialized View for Daily Analytics (Performance)
CREATE MATERIALIZED VIEW IF NOT EXISTS public.gov_analytics_daily AS
SELECT 
    p.city,
    p.state,
    m.icd_label as disease,
    DATE(m.created_at) as record_date,
    COUNT(*) as daily_count
FROM medical_records m
JOIN patients p ON m.patient_id = p.id
GROUP BY p.city, p.state, m.icd_label, DATE(m.created_at);

-- Index for faster querying
CREATE INDEX IF NOT EXISTS idx_gov_analytics_city_date ON public.gov_analytics_daily(city, record_date);

-- Function to refresh analytics (can be called via cron or manually)
CREATE OR REPLACE FUNCTION refresh_gov_analytics()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    REFRESH MATERIALIZED VIEW public.gov_analytics_daily;
END;
$$;

-- 5. Automated Alert Generation Function
CREATE OR REPLACE FUNCTION generate_alerts()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    r RECORD;
    t RECORD;
    active_count INTEGER;
BEGIN
    -- Refresh stats first
    PERFORM refresh_gov_analytics();

    -- Check against thresholds
    FOR t IN SELECT * FROM disease_thresholds LOOP
        -- Count cases in the last 7 days for the region + disease
        SELECT SUM(daily_count) INTO active_count
        FROM gov_analytics_daily
        WHERE city = t.region 
          AND disease = t.disease_name
          AND record_date > (CURRENT_DATE - INTERVAL '7 days');

        IF active_count >= t.threshold_count THEN
            -- Check if active alert already exists to avoid spam
            IF NOT EXISTS (
                SELECT 1 FROM alerts 
                WHERE message LIKE '%' || t.disease_name || '%' 
                AND region = t.region 
                AND status = 'active'
                AND created_at > (NOW() - INTERVAL '24 hours')
            ) THEN
                INSERT INTO alerts (title, message, severity, region)
                VALUES (
                    'Outbreak Alert: ' || t.disease_name,
                    'Detected ' || active_count || ' cases of ' || t.disease_name || ' in ' || t.region || ' (Threshold: ' || t.threshold_count || ')',
                    'high',
                    t.region
                );
            END IF;
        END IF;
    END LOOP;
END;
$$;

-- 6. Strict RLS Policies
ALTER TABLE public.disease_thresholds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Grant access to gov_disease_heatmap uses underlying table permissions, so we need to wrap it 
-- OR use a security definer function, simpler to just ensure RLS on underlying tables restricts access.
-- But standard views don't have RLS. Materialized views do NOT support RLS directly in older PG, 
-- but we can restrict access via GRANTs.

-- Revoke all on view from public
REVOKE ALL ON public.gov_disease_heatmap FROM PUBLIC;
REVOKE ALL ON public.gov_analytics_daily FROM PUBLIC;

-- Grant only to authenticated (we'll filter in app) or specific roles if available
GRANT SELECT ON public.gov_disease_heatmap TO authenticated;
GRANT SELECT ON public.gov_analytics_daily TO authenticated;

-- ALERTS Security
CREATE POLICY "Alerts viewable by Gov/Admin only" ON public.alerts
FOR SELECT USING (
    auth.role() = 'authenticated' AND (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('government', 'platform_admin')
        )
    )
);

CREATE POLICY "Thresholds manageable by Gov/Admin" ON public.disease_thresholds
USING (
    auth.role() = 'authenticated' AND (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role IN ('government', 'platform_admin')
        )
    )
);
