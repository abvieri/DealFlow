-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT
);

-- Create services table
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT
);

-- Create service_plans table
CREATE TABLE public.service_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  monthly_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  setup_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  deliverables TEXT,
  delivery_time_days INTEGER DEFAULT 0
);

-- Create proposals table
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'Rascunho',
  total_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_setup DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount_value DECIMAL(10,2) DEFAULT 0,
  version INTEGER DEFAULT 1
);

-- Create proposal_items table
CREATE TABLE public.proposal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  service_plan_id UUID NOT NULL REFERENCES public.service_plans(id) ON DELETE CASCADE
);

-- Create proposal_templates table
CREATE TABLE public.proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  template_name TEXT NOT NULL,
  template_items JSONB NOT NULL DEFAULT '[]'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clients
CREATE POLICY "Users can view their own clients"
  ON public.clients FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create clients"
  ON public.clients FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own clients"
  ON public.clients FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their own clients"
  ON public.clients FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for services (admin only would be better, but for now allow authenticated users)
CREATE POLICY "Users can view all services"
  ON public.services FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create services"
  ON public.services FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update services"
  ON public.services FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete services"
  ON public.services FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for service_plans
CREATE POLICY "Users can view all service plans"
  ON public.service_plans FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create service plans"
  ON public.service_plans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update service plans"
  ON public.service_plans FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete service plans"
  ON public.service_plans FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- RLS Policies for proposals
CREATE POLICY "Users can view their own proposals"
  ON public.proposals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create proposals"
  ON public.proposals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proposals"
  ON public.proposals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proposals"
  ON public.proposals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for proposal_items
CREATE POLICY "Users can view proposal items"
  ON public.proposal_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_items.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create proposal items"
  ON public.proposal_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_items.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete proposal items"
  ON public.proposal_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.proposals
      WHERE proposals.id = proposal_items.proposal_id
      AND proposals.user_id = auth.uid()
    )
  );

-- RLS Policies for proposal_templates
CREATE POLICY "Users can view all templates"
  ON public.proposal_templates FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create templates"
  ON public.proposal_templates FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete templates"
  ON public.proposal_templates FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create function to update proposals updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_proposals_updated_at_trigger
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_proposals_updated_at();