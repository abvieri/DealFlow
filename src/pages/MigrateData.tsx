import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Database, FileText, Copy } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";

export default function MigrateData() {
  const [isExporting, setIsExporting] = useState(false);

  const tables = [
    'clients',
    'proposals', 
    'proposal_items',
    'services',
    'service_plans',
    'user_roles',
    'proposal_templates'
  ];

  const exportTable = async (tableName: string) => {
    try {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*');

      if (error) throw error;

      const jsonData = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tableName}_export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Tabela ${tableName} exportada com sucesso!`);
    } catch (err: any) {
      console.error(`Erro ao exportar ${tableName}:`, err);
      toast.error(`Erro ao exportar ${tableName}: ${err.message}`);
    }
  };

  const exportAllTables = async () => {
    setIsExporting(true);
    const allData: any = {};

    try {
      for (const tableName of tables) {
        const { data, error } = await supabase
          .from(tableName as any)
          .select('*');

        if (error) throw error;
        allData[tableName] = data;
      }

      const jsonData = JSON.stringify(allData, null, 2);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_tables_export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Todas as tabelas exportadas com sucesso!');
    } catch (err: any) {
      console.error('Erro ao exportar tabelas:', err);
      toast.error(`Erro ao exportar: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  const downloadSchema = () => {
    const schema = `-- Script SQL para recriar o schema no Supabase externo
-- Execute este script no SQL Editor do seu projeto Supabase

-- 1. Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Criar tabelas
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE public.service_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  plan_name TEXT NOT NULL,
  monthly_fee NUMERIC DEFAULT 0 NOT NULL,
  setup_fee NUMERIC DEFAULT 0 NOT NULL,
  deliverables TEXT,
  delivery_time_days INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'Rascunho' NOT NULL,
  total_monthly NUMERIC DEFAULT 0 NOT NULL,
  total_setup NUMERIC DEFAULT 0 NOT NULL,
  discount_value NUMERIC DEFAULT 0,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE public.proposal_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  service_plan_id UUID NOT NULL REFERENCES public.service_plans(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, role)
);

CREATE TABLE public.proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL,
  template_items JSONB DEFAULT '[]'::jsonb NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 3. Habilitar RLS em todas as tabelas
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;

-- 4. Criar função has_role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 5. Criar políticas RLS
-- Clients
CREATE POLICY "Users can create clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view their own clients" ON public.clients FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their own clients" ON public.clients FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete their own clients" ON public.clients FOR DELETE USING (auth.uid() IS NOT NULL);

-- Services
CREATE POLICY "Users can view all services" ON public.services FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can create services" ON public.services FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update services" ON public.services FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete services" ON public.services FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Service Plans
CREATE POLICY "Users can view all service plans" ON public.service_plans FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admins can create service plans" ON public.service_plans FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update service plans" ON public.service_plans FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete service plans" ON public.service_plans FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Proposals
CREATE POLICY "Users can create proposals" ON public.proposals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own proposals" ON public.proposals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own proposals" ON public.proposals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own proposals" ON public.proposals FOR DELETE USING (auth.uid() = user_id);

-- Proposal Items
CREATE POLICY "Users can view proposal items" ON public.proposal_items FOR SELECT USING (EXISTS (SELECT 1 FROM proposals WHERE proposals.id = proposal_items.proposal_id AND proposals.user_id = auth.uid()));
CREATE POLICY "Users can create proposal items" ON public.proposal_items FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM proposals WHERE proposals.id = proposal_items.proposal_id AND proposals.user_id = auth.uid()));
CREATE POLICY "Users can delete proposal items" ON public.proposal_items FOR DELETE USING (EXISTS (SELECT 1 FROM proposals WHERE proposals.id = proposal_items.proposal_id AND proposals.user_id = auth.uid()));

-- User Roles
CREATE POLICY "Users can view their own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Proposal Templates
CREATE POLICY "Users can view all templates" ON public.proposal_templates FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can create templates" ON public.proposal_templates FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can delete templates" ON public.proposal_templates FOR DELETE USING (auth.uid() IS NOT NULL);

-- 6. Criar trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_proposals_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_proposals_updated_at
BEFORE UPDATE ON public.proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_proposals_updated_at();
`;

    const blob = new Blob([schema], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.sql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Script SQL baixado com sucesso!');
  };

  const copyInstructions = () => {
    const instructions = `INSTRUÇÕES PARA MIGRAÇÃO DO LOVABLE CLOUD PARA SUPABASE EXTERNO

1. PREPARAR O SUPABASE EXTERNO:
   - Acesse seu projeto Supabase (lrdxrziulcdjdbmitqvl)
   - Vá em SQL Editor
   - Clique em "Download Schema" para baixar o script schema.sql
   - Execute o script schema.sql completo no SQL Editor

2. EXPORTAR DADOS DO LOVABLE CLOUD:
   - Clique em "Exportar Todas as Tabelas" para baixar all_tables_export.json
   - OU exporte tabelas individuais conforme necessário

3. IMPORTAR DADOS NO SUPABASE:
   - Vá em Table Editor no seu Supabase externo
   - Para cada tabela, clique em "Insert" > "Insert row"
   - OU use o SQL Editor para fazer INSERT em massa:
   
   Exemplo de INSERT em massa:
   INSERT INTO public.services (id, name, description, created_at)
   VALUES 
     ('uuid-1', 'Nome', 'Descrição', '2024-01-01'),
     ('uuid-2', 'Nome2', 'Descrição2', '2024-01-02');

4. CRIAR USUÁRIO ADMIN:
   - Vá em Authentication > Users no Supabase
   - Clique em "Add user" > "Create new user"
   - Email: contato@vierigroup.com
   - Senha: Vieri!Group@2024
   - Após criar, copie o User ID
   - No SQL Editor, execute:
   
   INSERT INTO public.user_roles (user_id, role)
   VALUES ('USER_ID_COPIADO', 'admin');

5. CONFIGURAR AUTHENTICATION:
   - Em Authentication > URL Configuration
   - Site URL: https://vgproposta.lovable.app (ou seu domínio)
   - Redirect URLs: Adicione todas as URLs permitidas

6. ATUALIZAR SEU PROJETO:
   - Crie um NOVO projeto no Lovable
   - Desabilite Cloud antes de começar (Settings > Tools > Disable Cloud)
   - Conecte ao seu Supabase externo usando as credenciais
   - Faça o deploy do código

IMPORTANTE: Não é possível desconectar do Lovable Cloud em projetos existentes.
Você DEVE criar um novo projeto do zero para usar o Supabase externo.`;

    navigator.clipboard.writeText(instructions);
    toast.success('Instruções copiadas para área de transferência!');
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            <CardTitle>Exportação de Dados - Lovable Cloud</CardTitle>
          </div>
          <CardDescription>
            Exporte todos os dados para migração manual ao Supabase externo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert>
            <AlertDescription>
              <strong>⚠️ AVISO IMPORTANTE:</strong> Não é possível desconectar do Lovable Cloud em projetos existentes. 
              Para usar seu Supabase externo, você precisará criar um NOVO projeto no Lovable.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">1. Baixar Script do Schema</h3>
            <p className="text-sm text-muted-foreground">
              Primeiro, baixe o script SQL para recriar toda a estrutura do banco no seu Supabase externo.
            </p>
            <Button onClick={downloadSchema} variant="outline" className="w-full">
              <FileText className="mr-2 h-4 w-4" />
              Download Schema SQL
            </Button>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">2. Exportar Dados</h3>
            <p className="text-sm text-muted-foreground">
              Exporte os dados em formato JSON para importação manual.
            </p>
            
            <Button 
              onClick={exportAllTables} 
              disabled={isExporting}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              {isExporting ? 'Exportando...' : 'Exportar Todas as Tabelas'}
            </Button>

            <div className="grid grid-cols-2 gap-2">
              {tables.map(table => (
                <Button
                  key={table}
                  onClick={() => exportTable(table)}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2 h-3 w-3" />
                  {table}
                </Button>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">3. Instruções de Migração</h3>
            <p className="text-sm text-muted-foreground">
              Copie as instruções completas passo-a-passo para a migração.
            </p>
            <Button onClick={copyInstructions} variant="outline" className="w-full">
              <Copy className="mr-2 h-4 w-4" />
              Copiar Instruções Completas
            </Button>
          </div>

          <Alert>
            <AlertDescription className="text-sm">
              <strong>Próximos Passos:</strong>
              <ol className="list-decimal list-inside mt-2 space-y-1">
                <li>Execute o schema.sql no SQL Editor do Supabase externo</li>
                <li>Importe os dados JSON em cada tabela</li>
                <li>Crie o usuário admin (contato@vierigroup.com)</li>
                <li>Crie um NOVO projeto no Lovable sem Cloud</li>
                <li>Conecte ao Supabase externo usando suas credenciais</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
