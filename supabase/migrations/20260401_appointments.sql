-- Appointments / viewing requests table
CREATE TABLE IF NOT EXISTS public.appointments (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id   uuid NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id     uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  requester_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status        text NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','cancelled','completed')),
  requested_at  timestamptz NOT NULL,
  confirmed_at  timestamptz,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for quick lookup by property or requester
CREATE INDEX IF NOT EXISTS appointments_property_id_idx ON public.appointments (property_id);
CREATE INDEX IF NOT EXISTS appointments_requester_id_idx ON public.appointments (requester_id);
CREATE INDEX IF NOT EXISTS appointments_tenant_id_idx ON public.appointments (tenant_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS appointments_updated_at ON public.appointments;
CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Requester can read their own appointments
CREATE POLICY "requester_read_own" ON public.appointments
  FOR SELECT USING (requester_id = auth.uid());

-- Requester can create appointments
CREATE POLICY "requester_insert" ON public.appointments
  FOR INSERT WITH CHECK (requester_id = auth.uid());

-- Requester can cancel their own pending appointments
CREATE POLICY "requester_cancel_own" ON public.appointments
  FOR UPDATE USING (
    requester_id = auth.uid() AND status = 'pending'
  ) WITH CHECK (status = 'cancelled');

-- Agent / tenant admin can read appointments on their properties
CREATE POLICY "agent_read_own_property" ON public.appointments
  FOR SELECT USING (
    agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id
        AND p.user_id = auth.uid()
    )
  );

-- Agent can update status (confirm/complete/cancel)
CREATE POLICY "agent_update_status" ON public.appointments
  FOR UPDATE USING (
    agent_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.properties p
      WHERE p.id = property_id
        AND p.user_id = auth.uid()
    )
  );
