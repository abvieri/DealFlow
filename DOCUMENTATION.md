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

- Criar propostas personalizadas com múltiplos serviços
- Simular propostas sem salvar (modo demonstração)
- Gerenciar catálogo de serviços e planos
- Controlar clientes e seus dados
- Gerar PDFs profissionais das propostas
- Gerenciar usuários e permissões

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
└─────────────────┬───────────────────────┘
                  │
                  │ HTTP/REST API
                  │
┌─────────────────▼───────────────────────┐
│      Lovable Cloud (Supabase)           │
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

#### 1. **profiles**
Armazena informações adicionais dos usuários.

```typescript
interface Profile {
  id: string;                    // UUID (chave primária)
  user_id: string;               // UUID (referência ao auth.users)
  full_name: string | null;      // Nome completo
  role: 'admin' | 'user';        // Papel do usuário
  created_at: string;            // Timestamp de criação
  updated_at: string;            // Timestamp de atualização
}
```

#### 2. **clients**
Cadastro de clientes para vincular às propostas.

```typescript
interface Client {
  id: string;                    // UUID (chave primária)
  name: string;                  // Nome do cliente
  email: string | null;          // Email
  phone: string | null;          // Telefone
  company: string | null;        // Empresa
  created_at: string;            // Timestamp de criação
  updated_at: string;            // Timestamp de atualização
}
```

#### 3. **service_plans**
Catálogo de serviços disponíveis.

```typescript
interface ServicePlan {
  id: string;                    // UUID (chave primária)
  name: string;                  // Nome do serviço
  description: string | null;    // Descrição detalhada
  setup_fee: number;             // Taxa de instalação/setup (pagamento único)
  monthly_fee: number;           // Mensalidade (pagamento recorrente)
  delivery_time_days: number;    // Prazo de entrega em dias
  is_active: boolean;            // Serviço ativo/inativo
  created_at: string;            // Timestamp de criação
  updated_at: string;            // Timestamp de atualização
}
```

#### 4. **proposals**
Propostas criadas no sistema.

```typescript
interface Proposal {
  id: string;                    // UUID (chave primária)
  client_id: string | null;      // UUID (referência a clients)
  user_id: string;               // UUID (criador da proposta)
  title: string;                 // Título da proposta
  status: 'Rascunho' | 'Enviada' | 'Aprovada' | 'Rejeitada';
  discount_percentage: number;   // Desconto em percentual
  validity_days: number;         // Validade da proposta em dias
  payment_terms: string | null;  // Condições de pagamento
  notes: string | null;          // Observações/notas
  created_at: string;            // Timestamp de criação
  updated_at: string;            // Timestamp de atualização
}
```

#### 5. **proposal_items**
Itens (serviços) de cada proposta.

```typescript
interface ProposalItem {
  id: string;                    // UUID (chave primária)
  proposal_id: string;           // UUID (referência a proposals)
  service_plan_id: string;       // UUID (referência a service_plans)
  quantity: number;              // Quantidade do serviço
  custom_setup_fee: number | null;    // Taxa de setup customizada
  custom_monthly_fee: number | null;  // Mensalidade customizada
  created_at: string;            // Timestamp de criação
}
```

### Relacionamentos

```
profiles (1) ──────> (N) proposals
clients (1) ──────> (N) proposals
proposals (1) ──────> (N) proposal_items
service_plans (1) ──────> (N) proposal_items
```

### Políticas RLS (Row Level Security)

Todas as tabelas possuem RLS habilitado com políticas baseadas em `auth.uid()`:

- **SELECT:** Usuários autenticados podem ver seus próprios registros
- **INSERT:** Usuários autenticados podem criar registros
- **UPDATE:** Usuários podem atualizar apenas seus próprios registros
- **DELETE:** Usuários podem deletar apenas seus próprios registros

---

## Componentes Principais

### 1. **Layout.tsx**
Componente de layout principal com navegação.

**Responsabilidades:**
- Renderizar sidebar com menu de navegação
- Controlar estado de autenticação
- Gerenciar logout
- Exibir informações do usuário

**Props:**
```typescript
interface LayoutProps {
  children: React.ReactNode;
}
```

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

### 2. **ClientDataDialog.tsx**
Dialog para captura de dados do cliente.

**Responsabilidades:**
- Formulário de cadastro de cliente
- Validação de dados com Zod
- Salvar cliente no banco
- Vincular cliente à proposta

**Props:**
```typescript
interface ClientDataDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proposalId: string;
  onClientSaved: () => void;
}
```

**Schema de Validação:**
```typescript
const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
});
```

### 3. **Componentes UI (shadcn/ui)**

Biblioteca de componentes reutilizáveis:

- **Button:** Botões com variantes (default, outline, ghost, destructive)
- **Card:** Cards para agrupamento de conteúdo
- **Dialog:** Modais e diálogos
- **Form:** Formulários com validação
- **Input:** Campos de entrada
- **Select:** Seleção de opções
- **Table:** Tabelas de dados
- **Toast:** Notificações temporárias
- **Badge:** Badges de status
- **Tabs:** Abas de navegação
- **Sidebar:** Menu lateral responsivo

Todos os componentes seguem os padrões de acessibilidade (ARIA) e são totalmente customizáveis via Tailwind CSS.

---

## Páginas e Rotas

### Estrutura de Rotas

```typescript
// App.tsx
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
    path: "/proposals",
    children: [
      { path: "new", element: <Layout><ProposalNew /></Layout> },
      { path: "build/:id", element: <Layout><ProposalBuild /></Layout> },
      { path: "view/:id", element: <Layout><ProposalView /></Layout> },
      { path: "simulate", element: <Layout><ProposalSimulate /></Layout> },
    ],
  },
  {
    path: "/services",
    element: <Layout><Services /></Layout>,
  },
  {
    path: "/users",
    element: <Layout><Users /></Layout>,
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
- Mensagens de erro

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
Painel principal com visão geral.

**Features:**
- Cards com estatísticas (total de propostas, clientes, receita)
- Lista de propostas recentes
- Gráficos de performance
- Ações rápidas

**Queries:**
```typescript
const { data: proposals } = useQuery({
  queryKey: ['proposals'],
  queryFn: async () => {
    const { data } = await supabase
      .from('proposals')
      .select('*, client:clients(*), items:proposal_items(*)');
    return data;
  },
});
```

#### **ProposalNew.tsx**
Criação de nova proposta.

**Features:**
- Formulário de dados básicos (título, cliente, validade)
- Seleção de serviços do catálogo
- Aplicação de descontos
- Pré-visualização de valores
- Salvar como rascunho ou enviar

**Fluxo:**
```
1. Usuário preenche dados básicos
2. Seleciona serviços do catálogo
3. Ajusta quantidades e descontos
4. Visualiza resumo com totais
5. Salva proposta (status: Rascunho)
6. Redireciona para edição (/proposals/build/:id)
```

#### **ProposalBuild.tsx**
Edição de proposta existente.

**Features:**
- Editar dados da proposta
- Adicionar/remover serviços
- Alterar quantidades
- Customizar valores individuais
- Salvar alterações

**Estado:**
```typescript
const [proposal, setProposal] = useState<Proposal | null>(null);
const [items, setItems] = useState<ProposalItem[]>([]);
const [client, setClient] = useState<Client | null>(null);
```

#### **ProposalView.tsx**
Visualização e impressão de proposta.

**Features:**
- Layout formatado para impressão
- Dados do cliente e proposta
- Tabela de serviços com valores
- Totais e descontos
- Prazo de entrega (apenas serviços de pagamento único)
- Botão "Baixar PDF"
- Validação: PDF só é habilitado se cliente estiver preenchido

**Geração de PDF:**
```typescript
const handleDownloadPDF = async () => {
  if (!proposal?.client) {
    setShowClientDialog(true);
    return;
  }
  await generatePDF();
};

const generatePDF = async () => {
  setGeneratingPDF(true);
  const element = document.getElementById('proposal-content');
  const canvas = await html2canvas(element);
  const pdf = new jsPDF();
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
  pdf.save(`proposta-${proposal.id}.pdf`);
  setGeneratingPDF(false);
};
```

#### **ProposalSimulate.tsx**
Simulação de proposta (sem salvar).

**Features:**
- Mesma interface de criação de proposta
- Não salva no banco de dados
- Permite exportar para PDF temporário
- Opção de converter em proposta real

**Diferenças:**
- Não possui `proposal_id`
- Status sempre "Simulação"
- Dados mantidos apenas em estado local
- Não requer cliente para visualizar

#### **Services.tsx**
Gestão do catálogo de serviços.

**Features:**
- Listar todos os serviços
- Criar novo serviço
- Editar serviço existente
- Ativar/desativar serviço
- Filtrar por status (ativo/inativo)

**Formulário:**
```typescript
interface ServiceFormData {
  name: string;
  description: string;
  setup_fee: number;
  monthly_fee: number;
  delivery_time_days: number;
  is_active: boolean;
}
```

**Nota:** Campo "Prazo (dias)" aplica-se apenas a serviços de pagamento único (setup_fee > 0 e monthly_fee = 0).

#### **Users.tsx**
Gestão de usuários do sistema.

**Features:**
- Listar usuários
- Criar novo usuário
- Editar perfil de usuário
- Alterar role (admin/user)
- Desativar usuário

**Permissões:**
- Apenas administradores podem acessar esta página
- Usa Edge Function `create-user` para criar novos usuários

---

## Hooks Customizados

### **useAuth.tsx**
Hook para gerenciar autenticação.

```typescript
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

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
  const [role, setRole] = useState<'admin' | 'user' | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchRole = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      setRole(data?.role ?? 'user');
    };

    fetchRole();
  }, [user]);

  return { role, isAdmin: role === 'admin' };
};
```

### **use-toast.ts**
Hook para exibir notificações.

```typescript
import { toast as sonnerToast } from 'sonner';

export const toast = {
  success: (message: string) => {
    sonnerToast.success(message);
  },
  error: (message: string) => {
    sonnerToast.error(message);
  },
  info: (message: string) => {
    sonnerToast.info(message);
  },
};

export const useToast = () => {
  return { toast };
};
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

### Proteção de Rotas

```typescript
// Componente de rota protegida
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  return user ? <>{children}</> : null;
};
```

### Auto-Confirm de Email

O sistema está configurado para auto-confirmar emails (não requer verificação):

```typescript
// supabase/config.toml
[auth]
enable_signup = true
enable_email_confirmations = false  // Auto-confirm habilitado
```

---

## Integração com Backend

### Configuração do Cliente Supabase

```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### Padrão de Queries

#### SELECT (Buscar dados)
```typescript
const { data, error } = await supabase
  .from('proposals')
  .select(`
    *,
    client:clients(*),
    items:proposal_items(
      *,
      service:service_plans(*)
    )
  `)
  .eq('user_id', user.id);
```

#### INSERT (Criar registro)
```typescript
const { data, error } = await supabase
  .from('proposals')
  .insert({
    user_id: user.id,
    title: 'Nova Proposta',
    status: 'Rascunho',
  })
  .select()
  .single();
```

#### UPDATE (Atualizar registro)
```typescript
const { error } = await supabase
  .from('proposals')
  .update({ status: 'Enviada' })
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
      .select('*')
      .eq('user_id', user.id);
    
    if (error) throw error;
    return data;
  },
  enabled: !!user,  // Só executa se tiver usuário
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
    toast.error('Erro ao criar proposta');
    console.error(error);
  },
});
```

### Edge Functions

#### create-user
Função serverless para criação de usuários.

```typescript
// supabase/functions/create-user/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { email, password, full_name, role } = await req.json();
  
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Criar usuário no auth
  const { data: user, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    return new Response(JSON.stringify({ error: authError.message }), {
      status: 400,
    });
  }

  // Criar perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      user_id: user.user.id,
      full_name,
      role,
    });

  if (profileError) {
    return new Response(JSON.stringify({ error: profileError.message }), {
      status: 400,
    });
  }

  return new Response(JSON.stringify({ user }), {
    status: 200,
  });
});
```

**Uso:**
```typescript
const response = await fetch(
  `${supabaseUrl}/functions/v1/create-user`,
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    body: JSON.stringify({
      email: 'novo@usuario.com',
      password: 'senha123',
      full_name: 'Novo Usuário',
      role: 'user',
    }),
  }
);
```

---

## Geração de PDF

### Bibliotecas Utilizadas

- **jsPDF:** Criação de documentos PDF
- **html2canvas:** Captura de elementos HTML como imagem

### Processo de Geração

```typescript
const generatePDF = async () => {
  try {
    setGeneratingPDF(true);

    // 1. Capturar elemento HTML
    const element = document.getElementById('proposal-content');
    if (!element) throw new Error('Elemento não encontrado');

    // 2. Converter para canvas
    const canvas = await html2canvas(element, {
      scale: 2,  // Maior qualidade
      useCORS: true,  // Permitir imagens externas
      logging: false,
    });

    // 3. Converter canvas para imagem
    const imgData = canvas.toDataURL('image/png');

    // 4. Criar PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // 5. Calcular dimensões
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 0;

    // 6. Adicionar imagem ao PDF
    pdf.addImage(
      imgData,
      'PNG',
      imgX,
      imgY,
      imgWidth * ratio,
      imgHeight * ratio
    );

    // 7. Salvar arquivo
    pdf.save(`proposta-${proposal.id}.pdf`);

    toast.success('PDF gerado com sucesso!');
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    toast.error('Erro ao gerar PDF');
  } finally {
    setGeneratingPDF(false);
  }
};
```

### Layout do PDF

O layout é otimizado para impressão:

```tsx
<div id="proposal-content" className="bg-white p-8">
  {/* Cabeçalho com gradiente */}
  <div className="bg-gradient-to-r from-primary to-primary/80">
    <h1>Proposta Comercial</h1>
  </div>

  {/* Dados do Cliente */}
  <section>
    <h2>Dados do Cliente</h2>
    <div className="grid grid-cols-2 gap-4">
      <div>
        <strong>Nome:</strong> {client.name}
      </div>
      <div>
        <strong>Email:</strong> {client.email}
      </div>
    </div>
  </section>

  {/* Serviços */}
  <section>
    <h2>Serviços Contratados</h2>
    <table>
      <thead>
        <tr>
          <th>Serviço</th>
          <th>Qtd</th>
          <th>Setup</th>
          <th>Mensalidade</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        {items.map(item => (
          <tr key={item.id}>
            <td>{item.service.name}</td>
            <td>{item.quantity}</td>
            <td>{formatCurrency(item.custom_setup_fee)}</td>
            <td>{formatCurrency(item.custom_monthly_fee)}</td>
            <td>{formatCurrency(calculateItemTotal(item))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>

  {/* Totais */}
  <section>
    <div>
      <strong>Subtotal:</strong> {formatCurrency(subtotal)}
    </div>
    <div>
      <strong>Desconto ({discount}%):</strong> -{formatCurrency(discountAmount)}
    </div>
    <div>
      <strong>Total:</strong> {formatCurrency(total)}
    </div>
  </section>

  {/* Prazo de Entrega (apenas serviços de pagamento único) */}
  {oneTimeServices.length > 0 && (
    <section>
      <strong>Prazo de Entrega:</strong> {maxDeliveryTime} dias úteis
    </section>
  )}

  {/* Rodapé */}
  <footer className="bg-gradient-to-r from-primary to-primary/80">
    <p>Validade: {validityDays} dias</p>
    <p>Contato: contato@empresa.com</p>
  </footer>
</div>
```

### Validação Antes de Gerar PDF

```typescript
const handleDownloadPDF = async () => {
  // Validar se cliente está preenchido
  if (!proposal?.client) {
    toast.error('Preencha os dados do cliente antes de gerar o PDF');
    setShowClientDialog(true);  // Abrir dialog de cadastro
    return;
  }

  // Validar se tem serviços
  if (items.length === 0) {
    toast.error('Adicione pelo menos um serviço à proposta');
    return;
  }

  // Gerar PDF
  await generatePDF();
};
```

---

## Design System

### Tokens de Cores (index.css)

```css
:root {
  /* Cores base */
  --background: 0 0% 100%;
  --foreground: 224 71% 4%;
  
  /* Cores primárias (roxo) */
  --primary: 262 83% 58%;
  --primary-foreground: 210 40% 98%;
  
  /* Cores secundárias */
  --secondary: 220 14% 96%;
  --secondary-foreground: 220 9% 46%;
  
  /* Cores de acento */
  --accent: 220 14% 96%;
  --accent-foreground: 220 9% 46%;
  
  /* Cores destrutivas */
  --destructive: 0 84% 60%;
  --destructive-foreground: 210 40% 98%;
  
  /* Bordas e inputs */
  --border: 220 13% 91%;
  --input: 220 13% 91%;
  --ring: 262 83% 58%;
  
  /* Radius */
  --radius: 0.5rem;
}

.dark {
  --background: 224 71% 4%;
  --foreground: 210 40% 98%;
  --primary: 263 70% 50%;
  --primary-foreground: 210 40% 98%;
  /* ... outras cores dark mode */
}
```

### Classes Utilitárias Customizadas

```css
/* Gradientes */
.gradient-primary {
  background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8));
}

/* Sombras */
.shadow-elegant {
  box-shadow: 0 10px 30px -10px hsl(var(--primary) / 0.3);
}

/* Animações */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

### Variantes de Botão

```typescript
// button.tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
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

### Responsividade

Breakpoints do Tailwind:
- **sm:** 640px
- **md:** 768px
- **lg:** 1024px
- **xl:** 1280px
- **2xl:** 1536px

Exemplo de uso:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Mobile: 1 coluna, Tablet: 2 colunas, Desktop: 3 colunas */}
</div>
```

---

## Fluxos de Usuário

### 1. Criar Nova Proposta

```
[Início] → Dashboard
    ↓
[Clica em] "Nova Proposta"
    ↓
[Página] ProposalNew
    ↓
[Preenche] Título, Cliente (opcional), Validade
    ↓
[Seleciona] Serviços do catálogo
    ↓
[Ajusta] Quantidades e descontos
    ↓
[Visualiza] Resumo com totais
    ↓
[Clica em] "Salvar Rascunho"
    ↓
[Sistema] Cria proposta com status "Rascunho"
    ↓
[Redireciona] → /proposals/build/:id
    ↓
[Pode] Continuar editando ou visualizar
```

### 2. Gerar PDF de Proposta

```
[Início] → Visualização da Proposta
    ↓
[Verifica] Proposta tem cliente?
    ↓          ↓
   SIM        NÃO
    ↓          ↓
    ↓     [Abre] Dialog de Cadastro de Cliente
    ↓          ↓
    ↓     [Preenche] Dados do cliente
    ↓          ↓
    ↓     [Salva] Cliente e vincula à proposta
    ↓          ↓
    └──────────┘
         ↓
[Clica em] "Baixar PDF"
    ↓
[Sistema] Captura HTML com html2canvas
    ↓
[Sistema] Converte para PDF com jsPDF
    ↓
[Sistema] Faz download do arquivo
    ↓
[Fim] PDF salvo no dispositivo
```

### 3. Simular Proposta

```
[Início] → Dashboard
    ↓
[Clica em] "Simular Proposta"
    ↓
[Página] ProposalSimulate
    ↓
[Seleciona] Serviços (sem salvar no banco)
    ↓
[Ajusta] Quantidades e valores
    ↓
[Visualiza] Preview em tempo real
    ↓
[Pode escolher]
    ↓          ↓
   PDF     Salvar como Proposta
    ↓          ↓
Download   Cria proposta real
```

### 4. Gerenciar Serviços (Admin)

```
[Início] → Services
    ↓
[Lista] Todos os serviços
    ↓
[Pode]
├─ [Criar] Novo serviço
│     ↓
│  [Preenche] Nome, Descrição, Valores, Prazo
│     ↓
│  [Salva] Serviço ativo
│
├─ [Editar] Serviço existente
│     ↓
│  [Altera] Campos necessários
│     ↓
│  [Salva] Alterações
│
└─ [Ativar/Desativar] Serviço
      ↓
   [Toggle] Campo is_active
```

---

## Boas Práticas

### 1. **Estrutura de Componentes**

✅ **BOM:**
```typescript
// Componente focado e reutilizável
export const ProposalCard = ({ proposal }: { proposal: Proposal }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{proposal.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>Status: {proposal.status}</p>
      </CardContent>
    </Card>
  );
};
```

❌ **RUIM:**
```typescript
// Componente gigante com múltiplas responsabilidades
export const ProposalPage = () => {
  // 500 linhas de código misturando UI, lógica e queries
};
```

### 2. **Gerenciamento de Estado**

✅ **BOM:**
```typescript
// Usar TanStack Query para dados do servidor
const { data: proposals } = useQuery({
  queryKey: ['proposals'],
  queryFn: fetchProposals,
});

// Usar useState para estado local da UI
const [isDialogOpen, setIsDialogOpen] = useState(false);
```

❌ **RUIM:**
```typescript
// Misturar dados do servidor com estado local
const [proposals, setProposals] = useState([]);
useEffect(() => {
  fetchProposals().then(setProposals);
}, []);  // Re-fetch manual, sem cache
```

### 3. **Validação de Dados**

✅ **BOM:**
```typescript
const schema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  email: z.string().email("Email inválido"),
});

const { handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

❌ **RUIM:**
```typescript
const handleSubmit = (data) => {
  if (!data.name) alert("Nome obrigatório");
  if (!data.email.includes("@")) alert("Email inválido");
  // Validação manual e inconsistente
};
```

### 4. **Tratamento de Erros**

✅ **BOM:**
```typescript
try {
  const { data, error } = await supabase.from('proposals').insert(newProposal);
  if (error) throw error;
  toast.success('Proposta criada com sucesso!');
  return data;
} catch (error) {
  console.error('Erro ao criar proposta:', error);
  toast.error('Erro ao criar proposta. Tente novamente.');
  throw error;
}
```

❌ **RUIM:**
```typescript
const { data } = await supabase.from('proposals').insert(newProposal);
// Sem tratamento de erro
```

### 5. **Performance**

✅ **BOM:**
```typescript
// Memoizar cálculos pesados
const totalPrice = useMemo(() => {
  return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
}, [items]);

// Callbacks estáveis
const handleClick = useCallback(() => {
  console.log('clicked');
}, []);
```

❌ **RUIM:**
```typescript
// Recalcular em cada render
const totalPrice = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);

// Nova função em cada render
const handleClick = () => {
  console.log('clicked');
};
```

### 6. **Acessibilidade**

✅ **BOM:**
```typescript
<button
  aria-label="Fechar modal"
  onClick={handleClose}
>
  <X className="h-4 w-4" />
</button>
```

❌ **RUIM:**
```typescript
<div onClick={handleClose}>
  <X />
</div>
```

### 7. **TypeScript**

✅ **BOM:**
```typescript
interface ProposalFormData {
  title: string;
  client_id: string | null;
  validity_days: number;
}

const createProposal = (data: ProposalFormData): Promise<Proposal> => {
  // Implementação com tipos seguros
};
```

❌ **RUIM:**
```typescript
const createProposal = (data: any): any => {
  // Perde todos os benefícios do TypeScript
};
```

### 8. **Segurança**

✅ **BOM:**
```typescript
// Sempre validar no backend (RLS)
CREATE POLICY "Users can only view their own proposals"
ON proposals FOR SELECT
USING (auth.uid() = user_id);

// Validar no frontend também
if (proposal.user_id !== user.id) {
  throw new Error('Unauthorized');
}
```

❌ **RUIM:**
```typescript
// Confiar apenas no frontend
const { data } = await supabase
  .from('proposals')
  .select('*');  // Sem filtro, vulnerável
```

---

## Troubleshooting

### Problema: Erro ao gerar PDF

**Sintoma:** PDF não é gerado ou aparece em branco.

**Solução:**
1. Verificar se o elemento `proposal-content` existe no DOM
2. Garantir que todas as imagens têm CORS habilitado
3. Aumentar o `scale` do html2canvas para melhor qualidade
4. Verificar console para erros de canvas

### Problema: Cliente não aparece na proposta

**Sintoma:** Dados do cliente retornam `null` na query.

**Solução:**
1. Verificar se `client_id` foi salvo corretamente na proposta
2. Conferir se a query está fazendo o join correto: `.select('*, client:clients(*)')`
3. Validar RLS policies da tabela `clients`

### Problema: Prazo de entrega incorreto

**Sintoma:** Prazo calculado inclui serviços recorrentes.

**Solução:**
1. Filtrar apenas serviços com `monthly_fee === 0`
2. Usar `Math.max()` para pegar o maior prazo
3. Não exibir seção se não houver serviços de pagamento único

### Problema: Toast não aparece

**Sintoma:** Notificações não são exibidas.

**Solução:**
1. Verificar se `<Toaster />` está no `main.tsx`
2. Importar toast de `@/hooks/use-toast` corretamente
3. Verificar se não há erros no console bloqueando a UI

---

## Próximos Passos

### Features Planejadas

1. **Relatórios e Analytics**
   - Dashboard com gráficos de vendas
   - Exportação de relatórios em Excel
   - Métricas de conversão de propostas

2. **Notificações**
   - Email automático ao criar/atualizar proposta
   - Notificações push no navegador
   - Lembretes de propostas expiradas

3. **Integrações**
   - Sistema de pagamento (Stripe/PagSeguro)
   - CRM (HubSpot/Salesforce)
   - Contabilidade (Conta Azul)

4. **Mobile App**
   - App nativo com React Native
   - Sincronização offline
   - Notificações push

5. **Melhorias de UX**
   - Editor de propostas com drag-and-drop
   - Templates de proposta customizáveis
   - Assinatura digital de propostas

---

## Contribuindo

Para contribuir com a documentação:

1. Identifique seções desatualizadas ou incompletas
2. Adicione exemplos práticos quando possível
3. Mantenha a consistência de formatação
4. Documente novos features imediatamente após implementação

---

## Changelog

### v1.0.0 (2024-01-15)
- ✨ Lançamento inicial do sistema
- ✨ CRUD completo de propostas
- ✨ Geração de PDF
- ✨ Sistema de autenticação
- ✨ Gestão de serviços e usuários

### v1.1.0 (2024-01-20)
- ✨ Modo simulação de propostas
- ✨ Validação de cliente antes de gerar PDF
- 🐛 Correção no cálculo de prazo de entrega
- 📝 Documentação completa

---

**Última atualização:** 2024-01-20  
**Versão:** 1.1.0  
**Mantenedor:** Equipe de Desenvolvimento
