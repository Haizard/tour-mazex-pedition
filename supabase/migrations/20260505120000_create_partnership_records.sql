-- Create Marketplace Partnership Records Table
-- Handles commercial agreements, status, and commission splits between tenants

CREATE TABLE IF NOT EXISTS public.marketplace_partnership_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id TEXT NOT NULL, -- MongoDB ID for shadow syncing
    provider_tenant_id TEXT NOT NULL, -- Operator who owns the tours
    distributor_tenant_id TEXT NOT NULL, -- Operator selling the tours
    status TEXT NOT NULL DEFAULT 'requested', -- requested, active, suspended, declined
    commission_percent NUMERIC(5, 2) DEFAULT 15.00,
    allowed_tour_ids TEXT[] DEFAULT '{}', -- Array of shared tour MongoDB IDs
    shared_at TIMESTAMPTZ,
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for unique partnerships and tenant lookups
CREATE UNIQUE INDEX IF NOT EXISTS idx_partnership_unique_pair 
ON public.marketplace_partnership_records (provider_tenant_id, distributor_tenant_id);

CREATE INDEX IF NOT EXISTS idx_partnership_provider ON public.marketplace_partnership_records (provider_tenant_id);
CREATE INDEX IF NOT EXISTS idx_partnership_distributor ON public.marketplace_partnership_records (distributor_tenant_id);
CREATE INDEX IF NOT EXISTS idx_partnership_status ON public.marketplace_partnership_records (status);

-- Enable RLS
ALTER TABLE public.marketplace_partnership_records ENABLE ROW LEVEL SECURITY;

-- Service role policy
DROP POLICY IF EXISTS "Service role full access" ON public.marketplace_partnership_records;
CREATE POLICY "Service role full access" ON public.marketplace_partnership_records
    USING (true)
    WITH CHECK (true);
