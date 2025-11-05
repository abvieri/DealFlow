import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting data migration...');

    // Cliente do banco atual (Lovable Cloud)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const currentDb = createClient(supabaseUrl, supabaseKey);

    // Parse da URL do banco externo
    const externalDbUrl = Deno.env.get('EXTERNAL_DATABASE_URL')!;
    const urlMatch = externalDbUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/(.+)/);
    
    if (!urlMatch) {
      throw new Error('Invalid database URL format');
    }

    // Extrair o host do Supabase (db.xxxxx.supabase.co -> xxxxx.supabase.co)
    const [, user, password, dbHost] = urlMatch;
    const projectRef = dbHost.split('.')[1]; // lrdxrziulcdjdbmitqvl
    const externalProjectUrl = `https://${projectRef}.supabase.co`;
    
    console.log('Connecting to external database...');
    
    // Cliente do banco externo - usando service role key que é a senha fornecida
    const externalDb = createClient(externalProjectUrl, password, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    const results = {
      clients: { success: 0, errors: 0 },
      services: { success: 0, errors: 0 },
      service_plans: { success: 0, errors: 0 },
      proposals: { success: 0, errors: 0 },
      proposal_items: { success: 0, errors: 0 },
      proposal_templates: { success: 0, errors: 0 },
    };

    // Migrar clients
    console.log('Migrating clients...');
    const { data: clients, error: clientsError } = await externalDb
      .from('clients')
      .select('*');

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      results.clients.errors++;
    } else if (clients && clients.length > 0) {
      for (const client of clients) {
        const { error } = await currentDb
          .from('clients')
          .upsert(client, { onConflict: 'id' });
        
        if (error) {
          console.error('Error inserting client:', error);
          results.clients.errors++;
        } else {
          results.clients.success++;
        }
      }
    }

    // Migrar services
    console.log('Migrating services...');
    const { data: services, error: servicesError } = await externalDb
      .from('services')
      .select('*');

    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      results.services.errors++;
    } else if (services && services.length > 0) {
      for (const service of services) {
        const { error } = await currentDb
          .from('services')
          .upsert(service, { onConflict: 'id' });
        
        if (error) {
          console.error('Error inserting service:', error);
          results.services.errors++;
        } else {
          results.services.success++;
        }
      }
    }

    // Migrar service_plans
    console.log('Migrating service_plans...');
    const { data: servicePlans, error: servicePlansError } = await externalDb
      .from('service_plans')
      .select('*');

    if (servicePlansError) {
      console.error('Error fetching service_plans:', servicePlansError);
      results.service_plans.errors++;
    } else if (servicePlans && servicePlans.length > 0) {
      for (const plan of servicePlans) {
        const { error } = await currentDb
          .from('service_plans')
          .upsert(plan, { onConflict: 'id' });
        
        if (error) {
          console.error('Error inserting service_plan:', error);
          results.service_plans.errors++;
        } else {
          results.service_plans.success++;
        }
      }
    }

    // Migrar proposals
    console.log('Migrating proposals...');
    const { data: proposals, error: proposalsError } = await externalDb
      .from('proposals')
      .select('*');

    if (proposalsError) {
      console.error('Error fetching proposals:', proposalsError);
      results.proposals.errors++;
    } else if (proposals && proposals.length > 0) {
      for (const proposal of proposals) {
        const { error } = await currentDb
          .from('proposals')
          .upsert(proposal, { onConflict: 'id' });
        
        if (error) {
          console.error('Error inserting proposal:', error);
          results.proposals.errors++;
        } else {
          results.proposals.success++;
        }
      }
    }

    // Migrar proposal_items
    console.log('Migrating proposal_items...');
    const { data: proposalItems, error: proposalItemsError } = await externalDb
      .from('proposal_items')
      .select('*');

    if (proposalItemsError) {
      console.error('Error fetching proposal_items:', proposalItemsError);
      results.proposal_items.errors++;
    } else if (proposalItems && proposalItems.length > 0) {
      for (const item of proposalItems) {
        const { error } = await currentDb
          .from('proposal_items')
          .upsert(item, { onConflict: 'id' });
        
        if (error) {
          console.error('Error inserting proposal_item:', error);
          results.proposal_items.errors++;
        } else {
          results.proposal_items.success++;
        }
      }
    }

    // Migrar proposal_templates
    console.log('Migrating proposal_templates...');
    const { data: templates, error: templatesError } = await externalDb
      .from('proposal_templates')
      .select('*');

    if (templatesError) {
      console.error('Error fetching proposal_templates:', templatesError);
      results.proposal_templates.errors++;
    } else if (templates && templates.length > 0) {
      for (const template of templates) {
        const { error } = await currentDb
          .from('proposal_templates')
          .upsert(template, { onConflict: 'id' });
        
        if (error) {
          console.error('Error inserting proposal_template:', error);
          results.proposal_templates.errors++;
        } else {
          results.proposal_templates.success++;
        }
      }
    }

    console.log('Migration completed!', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Migração concluída com sucesso!',
        results
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in migrate-data function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
