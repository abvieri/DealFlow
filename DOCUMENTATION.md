# 📚 Documentação Técnica Completa

## Índice
1. [Visão Geral do Sistema](#visão-geral-do-sistema)
2. [Arquitetura](#arquitetura)
3. [Estrutura de Dados](#estrutura-de-dados)
4. [Componentes Principais](#componentes-principais)
5. [Páginas e Rotas](#páginas-e-rotas)
6. [Hooks Customizados](#hooks-customizados)
7. [Sistema de Autenticação](#sistema-de-autenticação)
8. [Integração com Backend](#integração-com-backend)
9. [Geração de PDF](#geração-de-pdf)
10. [Design System](#design-system)
11. [Fluxos de Usuário](#fluxos-de-usuário)
12. [Boas Práticas](#boas-práticas)

---

## Visão Geral do Sistema

O Sistema de Gestão de Propostas é uma aplicação full-stack para gerenciamento comercial, focada na criação e gestão de propostas de serviços. O sistema permite:

- Criar propostas personalizadas com múltiplos serviços organizados por categorias
- Simular propostas sem salvar (modo demonstração)
- Gerenciar catálogo de serviços com planos e categorias
- Controlar clientes e seus dados com histórico de propostas
- Gerar PDFs profissionais das propostas usando @react-pdf/renderer
- Gerenciar usuários e permissões baseadas em roles

### Principais Casos de Uso

1. **Vendedor:** Criar propostas, simular valores, enviar para clientes
2. **Gerente:** Visualizar propostas, aprovar descontos, analisar métricas
3. **Administrador:** Gerenciar usuários, configurar serviços, controlar acessos

---

## Arquitetura

### Stack Tecnológico

```
┌─────────────────────────────────────────┐
│           Frontend (React)              │
│  - React 18 + TypeScript                │
│  - Vite (Build Tool)                    │
│  - TailwindCSS + shadcn/ui              │
│  - React Router DOM                     │
│  - TanStack Query (React Query)         │
│  - @react-pdf/renderer (PDF)            │
└─────────────────┬───────────────────────┘
                  │
                  │ HTTP/REST API
                  │
┌─────────────────▼───────────────────────┐
│         Lovable Cloud (Supabase)        │
│  - PostgreSQL Database                  │
│  - Authentication (JWT)                 │
│  - Row Level Security (RLS)             │
│  - Edge Functions (Serverless)          │
│  - Real-time Subscriptions              │
└─────────────────────────────────────────┘
```

### Padrão de Arquitetura

O projeto segue uma arquitetura de **componentes funcionais** com:
- **Separação de responsabilidades:** UI, lógica de negócio e estado separados
- **Composição:** Componentes pequenos e reutilizáveis
- **Hooks customizados:** Lógica compartilhada encapsulada
- **Type safety:** TypeScript em todo o código

---

## Estrutura de Dados

### Tabelas Principais

#### 1. **clients**
Cadastro de clientes para vincular às propostas.

```typescript
interface Client {
  id: string;                    // UUID (chave primária)
  name: string;                  // Nome do cliente (NOT NULL)
  email: string | null;          // Email
  phone: string | null;          // Telefone
  company: string | null;        // Empresa
  created_at: string;            // Timestamp de criação
}
```

#### 2. **categories**
Categorias para organizar serviços.

```typescript
interface Category {
  id: number;                    // Serial (chave primária)
  name: string;                  // Nome da categoria
  created_at: string;            // Timestamp de criação
}
```

#### 3. **services**
Serviços disponíveis no catálogo.

```typescript
interface Service {
  id: string;                    // UUID (chave primária)
  name: string;                  // Nome do serviço (NOT NULL)
  description: string | null;    // Descrição detalhada
  category_id: number | null;    // Referência a categories
  created_at: string;            // Timestamp de criação
}
```

#### 4. **service_plans**
Planos específicos de cada serviço.

```typescript
interface ServicePlan {
  id: string;                    // UUID (chave primária)
  service_id: string;            // UUID (referência a services, NOT NULL)
  plan_name: string;             // Nome do plano (NOT NULL)
  monthly_fee: number;           // Fee mensal (padrão: 0)
  setup_fee: number;             // Fee de implementação (padrão: 0)
  deliverables: string | null;   // Entregáveis do plano
  delivery_time_days: number;    // Prazo de entrega em dias (padrão: 0)
  created_at: string;            // Timestamp de criação
}
```

#### 5. **proposals**
Propostas criadas no sistema.

```typescript
interface Proposal {
  id: string;                    // UUID (chave primária)
  user_id: string | null;        // UUID (criador da proposta)
  client_id: string | null;      // UUID (referência a clients)
  total_monthly: number;         // Total mensal (padrão: 0)
  total_setup: number;           // Total de implementação (padrão: 0)
  discount_value: number;        // Valor do desconto (padrão: 0)
  version: number;               // Versão da proposta (padrão: 1)
  status: string;                // Status (padrão: 'Rascunho')
  created_at: string;            // Timestamp de criação
  updated_at: string;            // Timestamp de atualização
}
```

Status possíveis: `Rascunho`, `Salva`, `Enviada`, `Aceita`, `Recusada`

#### 6. **proposal_items**
Itens (serviços) de cada proposta.

```typescript
interface ProposalItem {
  id: string;                    // UUID (chave primária)
  proposal_id: string;           // UUID (referência a proposals, NOT NULL)
  service_plan_id: string;       // UUID (referência a service_plans, NOT NULL)
  created_at: string;            // Timestamp de criação
}
```

#### 7. **proposal_templates**
Templates de propostas para reutilização.

```typescript
interface ProposalTemplate {
  id: string;                    // UUID (chave primária)
  template_name: string;         // Nome do template (NOT NULL)
  template_items: jsonb;         // Itens do template em JSON (padrão: '[]')
  created_at: string;            // Timestamp de criação
}
```

#### 8. **user_roles**
Sistema de roles separado para segurança.

```typescript
interface UserRole {
  id: string;                    // UUID (chave primária)
  user_id: string;               // UUID (referência ao auth.users, NOT NULL)
  role: 'admin' | 'moderator' | 'user'; // Role do usuário (app_role enum)
  created_at: string;            // Timestamp de criação
}
```

### Relacionamentos

```
categories (1) ──────> (N) services
services (1) ──────> (N) service_plans
clients (1) ──────> (N) proposals
proposals (1) ──────> (N) proposal_items
service_plans (1) ──────> (N) proposal_items
auth.users (1) ──────> (1) user_roles
```

### Políticas RLS (Row Level Security)

#### clients
- **SELECT, INSERT, UPDATE, DELETE:** Usuários autenticados podem gerenciar todos os clientes

#### services & service_plans
- **SELECT:** Todos usuários autenticados podem visualizar
- **INSERT, UPDATE, DELETE:** Apenas administradores (usando função `has_role()`)

#### proposals & proposal_items
- **SELECT, INSERT, UPDATE, DELETE:** Usuários podem gerenciar apenas suas próprias propostas (baseado em `user_id`)

#### proposal_templates
- **SELECT, INSERT, DELETE:** Todos usuários autenticados
- **UPDATE:** Não permitido

#### user_roles
- **SELECT:** Usuários podem ver seu próprio role; Administradores podem ver todos
- **INSERT, DELETE:** Apenas administradores
- **UPDATE:** Não permitido

### Funções de Banco de Dados

#### has_role
Função de segurança para verificar roles de usuários.

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

#### update_proposals_updated_at
Trigger function para atualizar `updated_at` automaticamente.

```sql
CREATE OR REPLACE FUNCTION public.update_proposals_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
```

---

## Componentes Principais

### 1. **Layout.tsx**
Componente de layout principal com navegação via Sidebar.

**Responsabilidades:**
- Renderizar sidebar com menu de navegação
- Controlar estado de autenticação
- Gerenciar logout
- Exibir informações do usuário

**Estrutura:**
```tsx
<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    <header>
      <SidebarTrigger />
      <UserMenu />
    </header>
    <main>
      {children}
    </main>
  </SidebarInset>
</SidebarProvider>
```

### 2. **ClientSelectionDialog.tsx**
Dialog para seleção ou criação de cliente.

**Responsabilidades:**
- Listar clientes existentes
- Criar novo cliente inline
- Vincular cliente à proposta
- Validação de dados

### 3. **ClientDataDialog.tsx**
Dialog simplificado para captura de dados do cliente.

**Responsabilidades:**
- Formulário de cadastro rápido de cliente
- Validação de dados
- Salvar cliente no banco
- Vincular cliente à proposta

### 4. **ProposalObservations.tsx**
Componente para adicionar observações às propostas.

**Responsabilidades:**
- Campo de texto para observações
- Salvar observações no banco
- Exibir observações existentes

### 5. **ProposalDocument.tsx**
Componente para geração de PDF usando @react-pdf/renderer.

**Responsabilidades:**
- Estrutura do documento PDF
- Formatação profissional
- Dados do cliente e proposta
- Tabela de serviços com valores
- Cálculos e totais

### 6. **Componentes UI (shadcn/ui)**

Biblioteca completa de componentes reutilizáveis e acessíveis:

- **Button:** Botões com variantes (default, outline, ghost, destructive, secondary)
- **Card:** Cards para agrupamento de conteúdo
- **Dialog:** Modais e diálogos
- **Form:** Formulários com validação
- **Input:** Campos de entrada
- **Select:** Seleção de opções
- **Table:** Tabelas de dados
- **Toast/Sonner:** Notificações temporárias
- **Badge:** Badges de status e categorias
- **Tabs:** Abas de navegação e filtros
- **Sidebar:** Menu lateral responsivo
- **Accordion:** Conteúdo expansível
- **Alert:** Mensagens de alerta
- **Avatar:** Avatares de usuário
- **Calendar:** Seletor de datas
- **Checkbox:** Caixas de seleção
- **Progress:** Barras de progresso
- **Textarea:** Campos de texto multilinha
- **Tooltip:** Dicas contextuais

Todos os componentes seguem os padrões de acessibilidade (ARIA) e são totalmente customizáveis via Tailwind CSS.

---

## Páginas e Rotas

### Estrutura de Rotas

```typescript
// App.tsx - Principais rotas
const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout><Dashboard /></Layout>,
  },
  {
    path: "/auth",
    element: <Auth />,
  },
  {
    path: "/proposal/new",
    element: <Layout><ProposalNew /></Layout>,
  },
  {
    path: "/proposal/:id/edit",
    element: <Layout><ProposalBuild /></Layout>,
  },
  {
    path: "/proposal/:id/view",
    element: <Layout><ProposalView /></Layout>,
  },
  {
    path: "/proposal/simulate",
    element: <Layout><ProposalSimulate /></Layout>,
  },
  {
    path: "/services",
    element: <Layout><Services /></Layout>,
  },
  {
    path: "/clients",
    element: <Layout><Clients /></Layout>,
  },
  {
    path: "/users",
    element: <Layout><Users /></Layout>,
  },
  {
    path: "/migrate-data",
    element: <Layout><MigrateData /></Layout>,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
```

### Páginas Detalhadas

#### **Auth.tsx**
Página de autenticação (login/registro).

**Features:**
- Formulário de login
- Formulário de registro
- Validação de campos
- Redirecionamento após login
- Mensagens de erro com toast
- Auto-confirm de email habilitado

**Fluxo:**
```
1. Usuário acessa /auth
2. Escolhe entre Login ou Registro
3. Preenche formulário
4. Credenciais enviadas ao Supabase Auth
5. Se sucesso → Redireciona para Dashboard
6. Se erro → Exibe mensagem de erro
```

#### **Dashboard.tsx**
Painel principal com listagem de propostas.

**Features:**
- Tabela de propostas com dados principais
- Badges de status coloridos
- Botões para criar nova proposta
- Botão para simular proposta
- Ações rápidas (visualizar, editar, excluir)
- Formatação de datas em português
- Loading states

**Dados exibidos:**
- Cliente
- Data de criação
- Status (Rascunho, Salva, Enviada, Aceita, Recusada)
- Fee Mensal
- Implementação
- Ações (Visualizar, Editar, Excluir)

#### **ProposalNew.tsx**
Criação de nova proposta (primeira etapa).

**Features:**
- Seleção ou criação de cliente
- Criação inicial da proposta com status "Rascunho"
- Redirecionamento automático para ProposalBuild

**Fluxo:**
```
1. Usuário clica em "Criar Nova Proposta"
2. Sistema cria proposta em branco (status: Rascunho)
3. Redireciona para /proposal/:id/edit
4. Usuário adiciona serviços e configura proposta
```

#### **ProposalBuild.tsx**
Edição e construção de proposta (portfólio de produtos).

**Features:**
- Grid de serviços organizados por categorias
- Sistema de filtros por categoria (tabs)
- Busca por nome ou descrição
- Seletor de planos por serviço
- Carrinho lateral fixo com resumo
- Adicionar/remover serviços do carrinho
- Aplicação de descontos (percentual ou valor fixo)
- Cálculo automático de totais
- Visualização de Fee Mensal e Implementação separados
- Botão "Revisar e Fechar Proposta"

**Componentes:**
- Grid responsivo de serviços (3 colunas desktop)
- Cards de serviço com informações e preços
- Carrinho sticky lateral
- Tabs para filtro de categorias
- Campo de busca

**Fluxo:**
```
1. Usuário navega pelos serviços
2. Filtra por categoria se necessário
3. Seleciona plano desejado
4. Adiciona ao carrinho
5. Aplica desconto (opcional)
6. Revisa totais
7. Clica em "Revisar e Fechar Proposta"
8. Redireciona para ProposalView
```

#### **ProposalView.tsx**
Visualização e finalização de proposta.

**Features:**
- Hero section com gradiente e informações principais
- Seletor de status da proposta
- Cards com estatísticas (Valor Total, Total de Serviços)
- Informações completas do cliente
- Grid de serviços com cards visuais
- Accordion com detalhes de cada serviço
- Resumo financeiro com breakdown de valores
- Componente de observações editável
- Geração de PDF profissional
- Validações antes de gerar PDF

**Layout:**
- Hero section com gradiente primary
- Cards de informações do cliente
- Grid de serviços (3 colunas)
- Accordion com entregáveis
- Card de resumo financeiro
- Área de observações

**Validações:**
- Proposta deve estar salva (não pode ser Rascunho)
- Cliente deve estar vinculado
- Mostra dialog para selecionar cliente se necessário

**Geração de PDF:**
Usa `@react-pdf/renderer` para criar PDFs de alta qualidade:
```typescript
const blob = await pdf(<ProposalDocument {...props} />).toBlob();
// Baixa o arquivo
```

#### **ProposalSimulate.tsx**
Simulação de proposta sem salvar no banco.

**Features:**
- Interface idêntica ao ProposalBuild
- Dados mantidos apenas em estado local
- Não requer cliente
- Não salva no banco de dados
- Permite exportar para PDF temporário
- Opção de converter em proposta real

**Diferenças:**
- Não possui `proposal_id` no banco
- Status sempre "Simulação"
- Dados não persistem ao sair da página
- Ideal para demonstrações rápidas

#### **Services.tsx**
Gestão do catálogo de serviços e planos.

**Features:**
- Listar todos os serviços com seus planos
- Criar novo serviço com múltiplos planos
- Editar serviço existente e seus planos
- Excluir serviço (e seus planos automaticamente)
- Organização por categorias
- Cards expansíveis por serviço
- Dialog modal para criação/edição

**Formulário de Serviço:**
- Nome do serviço
- Descrição
- Categoria
- Múltiplos planos:
  - Nome do plano
  - Fee Mensal (R$)
  - Implementação (R$)
  - Prazo de Entrega (dias)
  - Entregáveis (texto)

**Permissões:**
- Apenas administradores podem criar/editar/excluir serviços
- Todos usuários autenticados podem visualizar

#### **Clients.tsx**
Gestão de clientes do sistema.

**Features:**
- Listar todos os clientes
- Busca por nome, email ou empresa
- Cards com informações principais
- Criar novo cliente (redireciona para ProposalNew)
- Editar cliente existente (dialog modal)
- Excluir cliente
- Visualizar detalhes do cliente
- Histórico de propostas do cliente
- Navegação rápida para propostas

**Dialog de Detalhes:**
- Informações completas do cliente
- Data de cadastro
- Lista de propostas vinculadas
- Status e valores de cada proposta
- Botão para visualizar cada proposta

**Componentes:**
- Grid responsivo de clientes
- Campo de busca
- Dialogs para edição, exclusão e detalhes
- Cards com ações (Detalhes, Editar, Excluir)

#### **Users.tsx**
Gestão de usuários do sistema.

**Features:**
- Listar usuários
- Criar novo usuário (usa Edge Function `create-user`)
- Editar perfil de usuário
- Alterar role (admin/moderator/user)
- Desativar usuário

**Permissões:**
- Apenas administradores podem acessar esta página
- Criação de usuários via Edge Function serverless

#### **MigrateData.tsx**
Página para migração de dados (administrativa).

**Features:**
- Ferramentas de migração de dados
- Importação/exportação
- Uso de Edge Function `migrate-data`

---

## Hooks Customizados

### **useAuth.tsx**
Hook para gerenciar autenticação.

```typescript
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Buscar sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return { user, loading, signIn, signUp, signOut };
};
```

### **useUserRole.tsx**
Hook para verificar role do usuário.

```typescript
export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<'admin' | 'moderator' | 'user' | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setRole(null);
      setLoading(false);
      return;
    }

    const fetchRole = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      setRole(data?.role ?? 'user');
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  return { 
    role, 
    loading,
    isAdmin: role === 'admin',
    isModerator: role === 'moderator' || role === 'admin',
  };
};
```

### **use-toast.ts**
Hook para exibir notificações usando Sonner.

```typescript
import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message: string, options?: { description?: string }) => {
    sonnerToast.success(message, options);
  },
  error: (message: string, options?: { description?: string }) => {
    sonnerToast.error(message, options);
  },
  info: (message: string, options?: { description?: string }) => {
    sonnerToast.info(message, options);
  },
  warning: (message: string, options?: { description?: string }) => {
    sonnerToast.warning(message, options);
  },
};

export const useToast = () => {
  return { toast };
};
```

**Uso:**
```typescript
import { toast } from "sonner";

toast.success("Operação concluída!");
toast.error("Erro ao processar", { description: error.message });
```

### **use-mobile.tsx**
Hook para detectar dispositivo móvel.

```typescript
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};
```

---

## Sistema de Autenticação

### Fluxo de Autenticação

```
┌──────────────┐
│ Usuário não  │
│ autenticado  │
└──────┬───────┘
       │
       ▼
┌──────────────┐     Login/Registro     ┌─────────────────┐
│  Auth.tsx    │───────────────────────>│ Supabase Auth   │
└──────┬───────┘                        └────────┬────────┘
       │                                         │
       │                                         │ JWT Token
       │                                         │
       ▼                                         ▼
┌──────────────────────────────────────────────────────────┐
│              useAuth Hook (Context)                      │
│  - Gerencia estado do usuário                           │
│  - Persiste sessão no localStorage                      │
│  - Escuta mudanças de auth                              │
└────────────────────────┬─────────────────────────────────┘
                         │
                         │ user.id
                         │
                         ▼
              ┌──────────────────────┐
              │  Queries protegidas  │
              │  com RLS             │
              └──────────────────────┘
```

### Sistema de Roles

O sistema utiliza uma tabela separada `user_roles` para gerenciar permissões:

**Enum de Roles:**
```sql
CREATE TYPE app_role AS ENUM ('admin', 'moderator', 'user');
```

**Função de Verificação:**
```sql
CREATE FUNCTION has_role(_user_id uuid, _role app_role)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;
```

**Uso em RLS:**
```sql
-- Apenas administradores podem criar serviços
CREATE POLICY "Admins can create services"
ON services FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));
```

### Auto-Confirm de Email

O sistema está configurado para auto-confirmar emails (não requer verificação):

```typescript
// Configuração no Supabase
// Settings -> Authentication -> Email Auth
// Enable Confirm Email: false (auto-confirm habilitado)
```

---

## Integração com Backend

### Configuração do Cliente Supabase

```typescript
// src/integrations/supabase/client.ts (gerado automaticamente)
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(
  SUPABASE_URL, 
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);
```

### Padrão de Queries

#### SELECT (Buscar dados)
```typescript
const { data, error } = await supabase
  .from('proposals')
  .select(`
    *,
    clients(*),
    proposal_items(
      *,
      service_plans(
        *,
        services(name)
      )
    )
  `)
  .eq('user_id', user.id)
  .order('created_at', { ascending: false });
```

#### INSERT (Criar registro)
```typescript
const { data, error } = await supabase
  .from('proposals')
  .insert({
    user_id: user.id,
    status: 'Rascunho',
    total_monthly: 0,
    total_setup: 0,
  })
  .select()
  .single();
```

#### UPDATE (Atualizar registro)
```typescript
const { error } = await supabase
  .from('proposals')
  .update({ 
    status: 'Enviada',
    total_monthly: 1500,
    total_setup: 3000,
  })
  .eq('id', proposalId);
```

#### DELETE (Deletar registro)
```typescript
const { error } = await supabase
  .from('proposals')
  .delete()
  .eq('id', proposalId);
```

### TanStack Query Integration

```typescript
// Query para listar propostas
const { data: proposals, isLoading } = useQuery({
  queryKey: ['proposals', user?.id],
  queryFn: async () => {
    const { data, error } = await supabase
      .from('proposals')
      .select('*, clients(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  enabled: !!user,
});

// Mutation para criar proposta
const createProposal = useMutation({
  mutationFn: async (newProposal: NewProposal) => {
    const { data, error } = await supabase
      .from('proposals')
      .insert(newProposal)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['proposals'] });
    toast.success('Proposta criada com sucesso!');
  },
  onError: (error) => {
    toast.error('Erro ao criar proposta', { 
      description: error.message 
    });
  },
});
```

### Edge Functions

#### create-user
Função serverless para criação de usuários administrativos.

**Localização:** `supabase/functions/create-user/index.ts`

**Funcionalidade:**
- Criar usuário no Supabase Auth
- Atribuir role ao usuário
- Confirmar email automaticamente
- Retornar dados do usuário criado

**Uso:**
```typescript
const { data, error } = await supabase.functions.invoke('create-user', {
  body: {
    email: 'novo@usuario.com',
    password: 'senha123',
    role: 'user',
  },
});
```

#### setup-admin
Função para configuração inicial de administrador.

**Localização:** `supabase/functions/setup-admin/index.ts`

**Funcionalidade:**
- Criar primeiro usuário administrador
- Configurar role como admin
- Inicializar sistema

#### migrate-data
Função para migração de dados.

**Localização:** `supabase/functions/migrate-data/index.ts`

**Funcionalidade:**
- Importar dados de fontes externas
- Migrar estruturas de dados
- Transformar formatos

---

## Geração de PDF

### Biblioteca Utilizada

**@react-pdf/renderer** - Biblioteca moderna para criar PDFs a partir de componentes React.

**Vantagens:**
- Renderização do lado do cliente
- Componentes React nativos
- Estilização com CSS-in-JS
- Alta qualidade de saída
- Suporte a fontes customizadas
- Melhor performance

### Componente ProposalDocument

```typescript
// src/components/pdf/ProposalDocument.tsx
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export const ProposalDocument = ({ proposalData, clientData, items }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Proposta Comercial</Text>
        <Text style={styles.client}>{clientData.company || clientData.name}</Text>
      </View>

      {/* Informações do Cliente */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dados do Cliente</Text>
        <Text>Nome: {clientData.name}</Text>
        <Text>Email: {clientData.email}</Text>
        <Text>Telefone: {clientData.phone}</Text>
      </View>

      {/* Serviços */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Serviços Contratados</Text>
        {items.map((item, index) => (
          <View key={index} style={styles.serviceItem}>
            <Text style={styles.serviceName}>{item.service_name}</Text>
            <Text style={styles.planName}>{item.plan_name}</Text>
            <Text>Fee Mensal: R$ {item.monthly_fee.toFixed(2)}</Text>
            <Text>Implementação: R$ {item.setup_fee.toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Totais */}
      <View style={styles.totals}>
        <Text>Total Mensal: R$ {proposalData.total_monthly.toFixed(2)}</Text>
        <Text>Total Implementação: R$ {proposalData.total_setup.toFixed(2)}</Text>
        <Text style={styles.finalTotal}>
          Total: R$ {(proposalData.total_monthly + proposalData.total_setup - proposalData.discount_value).toFixed(2)}
        </Text>
      </View>
    </Page>
  </Document>
);

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    padding: 20,
    backgroundColor: '#6366f1',
    color: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  // ... more styles
});
```

### Processo de Geração

```typescript
// src/pages/ProposalView.tsx
import { pdf } from '@react-pdf/renderer';
import { ProposalDocument } from '@/components/pdf/ProposalDocument';

const handleDownloadPDF = async () => {
  // 1. Validações
  if (!proposal?.client) {
    toast.error("Cliente não encontrado");
    return;
  }

  if (proposal.status === "Rascunho") {
    toast.error("Salve a proposta antes de gerar PDF");
    return;
  }

  // 2. Gerar blob do PDF
  setIsDownloading(true);
  toast.info("Gerando PDF...");

  try {
    const blob = await pdf(
      <ProposalDocument 
        proposalData={proposal} 
        clientData={proposal.client} 
        items={formattedItems} 
      />
    ).toBlob();

    // 3. Criar URL e baixar
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Proposta - ${proposal.client.company || proposal.client.name}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("PDF baixado com sucesso!");
  } catch (err) {
    console.error(err);
    toast.error("Erro ao gerar PDF");
  } finally {
    setIsDownloading(false);
  }
};
```

### Estrutura do PDF

O PDF gerado contém:

1. **Cabeçalho:**
   - Logo da empresa
   - Título "Proposta Comercial"
   - Nome/Empresa do cliente

2. **Dados do Cliente:**
   - Nome completo
   - Email
   - Telefone
   - Empresa

3. **Serviços Contratados:**
   - Nome do serviço
   - Nome do plano
   - Fee Mensal
   - Implementação
   - Prazo de entrega
   - Entregáveis (descrição)

4. **Resumo Financeiro:**
   - Total Fee Mensal
   - Total Implementação
   - Desconto aplicado
   - **Valor Total Final**

5. **Rodapé:**
   - Data de validade
   - Informações de contato
   - Termos e condições

---

## Design System

### Tokens de Cor (CSS Variables)

```css
/* src/index.css */
:root {
  /* Background Colors */
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  
  /* Primary Brand Colors */
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  
  /* Secondary Colors */
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  
  /* Muted Colors */
  --muted: 210 40% 96.1%;
  --muted-foreground: 215.4 16.3% 46.9%;
  
  /* Accent Colors */
  --accent: 210 40% 96.1%;
  --accent-foreground: 222.2 47.4% 11.2%;
  
  /* Destructive/Error Colors */
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  
  /* Border & Input */
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 221.2 83.2% 53.3%;
  
  /* Card */
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  
  /* Popover */
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  
  /* Chart Colors */
  --chart-1: 12 76% 61%;
  --chart-2: 173 58% 39%;
  --chart-3: 197 37% 24%;
  --chart-4: 43 74% 66%;
  --chart-5: 27 87% 67%;
  
  /* Radius */
  --radius: 0.5rem;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  /* ... dark mode variants */
}
```

### Tokens Customizados

```css
/* Gradientes */
.gradient-primary {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8));
}

/* Sombras Elegantes */
.shadow-elegant {
  box-shadow: 0 10px 30px -10px hsl(var(--primary) / 0.3);
}

/* Animações */
.transition-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Componentes de Botão

```typescript
// src/components/ui/button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

### Breakpoints Tailwind

```javascript
// tailwind.config.ts
export default {
  theme: {
    screens: {
      'sm': '640px',   // Mobile landscape
      'md': '768px',   // Tablet
      'lg': '1024px',  // Desktop
      'xl': '1280px',  // Large desktop
      '2xl': '1536px', // Extra large
    },
  },
};
```

### Grid Responsivo

```tsx
// Exemplo de uso
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Conteúdo */}
</div>
```

---

## Fluxos de Usuário

### 1. Criar Nova Proposta

```
1. Dashboard → Botão "Criar Nova Proposta"
2. ProposalNew → Sistema cria proposta em branco
3. Redirecionamento automático → ProposalBuild
4. Selecionar Categoria (Tabs)
5. Buscar Serviços (opcional)
6. Para cada serviço:
   a. Selecionar Plano
   b. Clicar em "Adicionar"
7. Revisar Carrinho lateral
8. Aplicar Desconto (opcional)
9. Clicar em "Revisar e Fechar Proposta"
10. ProposalView → Revisar proposta
11. Selecionar/Criar Cliente
12. Alterar Status para "Salva"
13. Adicionar Observações (opcional)
14. Gerar PDF
```

### 2. Simular Proposta

```
1. Dashboard → Botão "Simular Proposta"
2. ProposalSimulate → Interface de construção
3. Adicionar Serviços (mesmo fluxo de ProposalBuild)
4. Aplicar Desconto
5. Visualizar Totais
6. Opções:
   a. Gerar PDF temporário
   b. Converter em Proposta Real (salvar)
   c. Descartar
```

### 3. Gerenciar Clientes

```
1. Menu Lateral → Clientes
2. Visualizar Grid de Clientes
3. Buscar Cliente (opcional)
4. Ações disponíveis:
   a. Detalhes → Ver histórico de propostas
   b. Editar → Atualizar informações
   c. Excluir → Remover cliente
5. Criar Novo Cliente → Redireciona para ProposalNew
```

### 4. Gerenciar Serviços (Admin)

```
1. Menu Lateral → Serviços
2. Visualizar Lista de Serviços
3. Clicar em "Novo Serviço"
4. Preencher Formulário:
   a. Nome do Serviço
   b. Categoria
   c. Descrição
   d. Adicionar Planos:
      - Nome do Plano
      - Fee Mensal
      - Implementação
      - Prazo
      - Entregáveis
5. Clicar em "Criar Serviço"
6. Sistema salva Serviço e Planos
```

### 5. Gerar PDF de Proposta

```
1. ProposalView → Visualizar proposta
2. Validações:
   a. Status deve ser diferente de "Rascunho"
   b. Cliente deve estar vinculado
3. Clicar em "Baixar PDF"
4. Sistema:
   a. Gera componente ProposalDocument
   b. Converte para blob PDF
   c. Baixa arquivo automaticamente
5. Toast de sucesso
```

---

## Boas Práticas

### Estrutura de Componentes

```typescript
// Componente bem estruturado
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ComponentProps {
  id: string;
  onSuccess?: () => void;
}

export const Component = ({ id, onSuccess }: ComponentProps) => {
  // 1. Estados
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // 2. Effects
  useEffect(() => {
    fetchData();
  }, [id]);

  // 3. Handlers
  const fetchData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('table')
        .select('*')
        .eq('id', id);
      
      if (error) throw error;
      setData(data);
    } catch (error: any) {
      toast.error("Erro ao carregar", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // 4. Render
  if (loading) return <div>Carregando...</div>;
  
  return (
    <div>
      {/* UI */}
    </div>
  );
};
```

### Gerenciamento de Estado

**Estado Local (useState):**
```typescript
// Para UI state simples
const [isOpen, setIsOpen] = useState(false);
const [searchTerm, setSearchTerm] = useState("");
```

**TanStack Query (Server State):**
```typescript
// Para dados do servidor
const { data, isLoading, error } = useQuery({
  queryKey: ['proposals'],
  queryFn: fetchProposals,
});

const mutation = useMutation({
  mutationFn: createProposal,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['proposals'] });
  },
});
```

### Validação de Dados

Usar **Zod** com **react-hook-form**:

```typescript
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

### Tratamento de Erros

```typescript
try {
  const { data, error } = await supabase
    .from('table')
    .insert(values);
  
  if (error) throw error;
  
  toast.success("Operação concluída!");
  onSuccess?.();
} catch (error: any) {
  console.error("Erro:", error);
  toast.error("Erro ao processar", {
    description: error.message || "Tente novamente",
  });
}
```

### Performance

**Memoização:**
```typescript
import { useMemo, useCallback } from "react";

// Valores computados
const total = useMemo(() => {
  return items.reduce((sum, item) => sum + item.price, 0);
}, [items]);

// Callbacks estáveis
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

**Lazy Loading:**
```typescript
import { lazy, Suspense } from "react";

const HeavyComponent = lazy(() => import("./HeavyComponent"));

<Suspense fallback={<div>Carregando...</div>}>
  <HeavyComponent />
</Suspense>
```

### Acessibilidade

```tsx
// ARIA attributes
<button
  aria-label="Fechar dialog"
  aria-expanded={isOpen}
  aria-controls="menu"
>
  <Icon />
</button>

// Navegação por teclado
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Clique aqui
</div>
```

### TypeScript

```typescript
// Tipos explícitos
interface Proposal {
  id: string;
  client_id: string | null;
  total_monthly: number;
  total_setup: number;
}

// Generics
function fetchData<T>(url: string): Promise<T> {
  return fetch(url).then(res => res.json());
}

// Type Guards
function isProposal(data: unknown): data is Proposal {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'total_monthly' in data
  );
}
```

### Segurança

**RLS Policies:**
```sql
-- Usuários só veem suas próprias propostas
CREATE POLICY "Users can view own proposals"
ON proposals FOR SELECT
USING (auth.uid() = user_id);

-- Administradores têm acesso total
CREATE POLICY "Admins can manage services"
ON services FOR ALL
USING (has_role(auth.uid(), 'admin'));
```

**Validação Frontend + Backend:**
```typescript
// Frontend: validação de UX
const schema = z.object({
  email: z.string().email(),
});

// Backend: RLS garante segurança real
-- Policy no banco
CREATE POLICY "..." ON table USING (...);
```

---

## Troubleshooting

### Problemas Comuns

#### 1. PDF não gera
**Possíveis causas:**
- Proposta com status "Rascunho"
- Cliente não vinculado
- Erro na biblioteca @react-pdf/renderer

**Solução:**
```typescript
// Validar antes de gerar
if (proposal.status === "Rascunho") {
  toast.error("Salve a proposta antes de gerar PDF");
  return;
}

if (!proposal.client) {
  toast.error("Vincule um cliente à proposta");
  setShowClientDialog(true);
  return;
}
```

#### 2. Dados não aparecem
**Possíveis causas:**
- RLS policies incorretas
- Usuário não autenticado
- Relação de dados incorreta

**Solução:**
```typescript
// Verificar autenticação
const { user } = useAuth();
if (!user) {
  navigate('/auth');
  return;
}

// Verificar RLS policies no banco
-- SELECT com política
SELECT * FROM proposals WHERE user_id = auth.uid();
```

#### 3. Toast não aparece
**Possíveis causas:**
- Componente Toaster não renderizado
- Import incorreto

**Solução:**
```tsx
// Adicionar no root layout
import { Toaster } from "@/components/ui/sonner";

<App>
  <Toaster />
  {children}
</App>
```

#### 4. Serviços não carregam no ProposalBuild
**Possíveis causas:**
- RLS policy bloqueando SELECT
- Relações não carregadas
- Categorias ausentes

**Solução:**
```typescript
// Query completa com relações
const { data, error } = await supabase
  .from("services")
  .select("*, service_plans(*), categories(name)")
  .order("created_at", { ascending: false });
```

---

## Próximos Passos

### Features Planejadas

- [ ] **Exportação Excel:** Export de propostas e relatórios em formato Excel
- [ ] **Notificações Email:** Sistema de notificações por email para propostas
- [ ] **Dashboard Analytics:** Gráficos e métricas avançadas de vendas
- [ ] **Integração Pagamento:** Conectar com gateways de pagamento (Stripe, PagSeguro)
- [ ] **App Mobile:** Versão React Native para iOS e Android
- [ ] **Relatórios Customizáveis:** Criador de relatórios personalizados
- [ ] **Sistema de Templates:** Salvar e reutilizar templates de propostas
- [ ] **Kanban de Propostas:** Visualização em quadro Kanban por status
- [ ] **Filtros Avançados:** Filtros por data, status, cliente, valor
- [ ] **Assinatura Digital:** Assinatura eletrônica de propostas
- [ ] **Multi-idioma:** Suporte para múltiplos idiomas
- [ ] **Histórico de Versões:** Versionamento de propostas
- [ ] **Comentários:** Sistema de comentários em propostas
- [ ] **Webhooks:** Integração via webhooks para eventos

### Melhorias Técnicas

- [ ] **Testes Unitários:** Implementar testes com Vitest
- [ ] **Testes E2E:** Testes end-to-end com Playwright
- [ ] **CI/CD:** Pipeline de integração e deploy contínuo
- [ ] **Monitoramento:** Implementar Sentry para error tracking
- [ ] **Cache:** Implementar estratégias de cache avançadas
- [ ] **PWA:** Transformar em Progressive Web App
- [ ] **Otimização SEO:** Melhorias para SEO
- [ ] **Acessibilidade:** Auditoria completa de acessibilidade
- [ ] **Performance:** Análise e otimização de performance

---

## Contribuindo

Para contribuir com a documentação:

1. Mantenha a estrutura de seções
2. Use exemplos de código quando possível
3. Documente novas features assim que implementadas
4. Atualize diagramas quando arquitetura mudar
5. Mantenha consistência de formato

---

## Changelog

### v2.0.0 (Atual)
- Sistema de categorias para serviços
- Página de gestão de clientes
- PDF com @react-pdf/renderer
- Sistema de roles separado (user_roles)
- Melhorias visuais em ProposalView
- Filtros por categoria em ProposalBuild
- Observações em propostas

### v1.0.0 (Inicial)
- Sistema básico de propostas
- Autenticação com Supabase
- CRUD de serviços e planos
- Geração de PDF básica
- Dashboard com listagem
- RLS policies implementadas

---

**Última atualização:** 2025-11-08  
**Versão do Sistema:** 2.0.0  
**Mantenedor:** Equipe de Desenvolvimento
