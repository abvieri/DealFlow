-- Drop existing policies for services table
DROP POLICY IF EXISTS "Users can create services" ON public.services;
DROP POLICY IF EXISTS "Users can update services" ON public.services;
DROP POLICY IF EXISTS "Users can delete services" ON public.services;

-- Create new admin-only policies for services
CREATE POLICY "Admins can create services" 
ON public.services 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update services" 
ON public.services 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete services" 
ON public.services 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Drop existing policies for service_plans table
DROP POLICY IF EXISTS "Users can create service plans" ON public.service_plans;
DROP POLICY IF EXISTS "Users can update service plans" ON public.service_plans;
DROP POLICY IF EXISTS "Users can delete service plans" ON public.service_plans;

-- Create new admin-only policies for service_plans
CREATE POLICY "Admins can create service plans" 
ON public.service_plans 
FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update service plans" 
ON public.service_plans 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete service plans" 
ON public.service_plans 
FOR DELETE 
USING (public.has_role(auth.uid(), 'admin'::app_role));