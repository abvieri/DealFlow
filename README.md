# 📊 Sistema de Gestão de Propostas

## Descrição

Sistema completo para gestão de propostas comerciais, construído com **React**, **TypeScript** e **Vite**. Esta aplicação oferece uma interface moderna e intuitiva para criar, simular e gerenciar propostas de serviços, com controle de usuários, clientes e planos de serviços. Utiliza Lovable Cloud (Supabase) como backend para autenticação, banco de dados e armazenamento.

## 🚀 Funcionalidades

- **Dashboard Administrativo:** Visão geral do sistema com estatísticas e métricas importantes.
- **Gestão de Propostas:** Criação, edição, visualização e simulação de propostas comerciais.
- **Geração de PDF:** Export de propostas em formato PDF com dados do cliente e serviços.
- **Gestão de Clientes:** Cadastro e gerenciamento de dados de clientes.
- **Catálogo de Serviços:** Configuração de planos de serviços com valores de setup e mensalidades.
- **Sistema de Usuários:** Controle de acesso com autenticação e níveis de permissão.
- **Simulador de Propostas:** Ferramenta para criar propostas sem salvar (modo rascunho).
- **Cálculo Automático:** Sistema inteligente de cálculo de prazos e valores.
- **Interface Responsiva:** Layout adaptável para diferentes dispositivos.
- **Tema Dark/Light:** Suporte completo para temas claro e escuro.

## 💻 Tecnologias Utilizadas

### Frontend
- **[React 18](https://react.dev/)**: Biblioteca principal para construção da interface.
- **[TypeScript](https://www.typescriptlang.org/)**: Tipagem estática para maior segurança.
- **[Vite](https://vitejs.dev/)**: Build tool moderna e extremamente rápida.
- **[React Router DOM](https://reactrouter.com/)**: Gerenciamento de rotas e navegação.
- **[Tailwind CSS](https://tailwindcss.com/)**: Framework CSS utilitário para estilização.
- **[shadcn/ui](https://ui.shadcn.com/)**: Componentes UI reutilizáveis e acessíveis.
- **[TanStack Query](https://tanstack.com/query)**: Gerenciamento de estado assíncrono e cache.
- **[React Hook Form](https://react-hook-form.com/)**: Formulários performáticos com validação.
- **[Zod](https://zod.dev/)**: Validação de schemas e tipos.

### Backend & Infraestrutura
- **[Lovable Cloud](https://lovable.dev/)**: Plataforma backend completa (Supabase).
- **Autenticação**: Sistema de login e registro de usuários.
- **Banco de Dados PostgreSQL**: Armazenamento relacional robusto.
- **Row Level Security (RLS)**: Políticas de segurança em nível de linha.
- **Edge Functions**: Funções serverless para lógica customizada.

### Bibliotecas Adicionais
- **[Lucide React](https://lucide.dev/)**: Ícones modernos e consistentes.
- **[jsPDF](https://github.com/parallax/jsPDF)**: Geração de documentos PDF.
- **[html2canvas](https://html2canvas.hertzen.com/)**: Captura de screenshots para PDF.
- **[date-fns](https://date-fns.org/)**: Manipulação de datas.
- **[Recharts](https://recharts.org/)**: Gráficos e visualizações de dados.
- **[Sonner](https://sonner.emilkowal.ski/)**: Notificações toast elegantes.

## 📋 Pré-requisitos

Para rodar este projeto, você precisará ter instalado:
- **[Node.js](https://nodejs.org/)** (versão 18 ou superior)
- **[npm](https://www.npmjs.com/)** (geralmente vem com Node.js)

## 📂 Estrutura do Projeto

```
📦 projeto
├── 📂 public
│   ├── robots.txt
│   ├── favicon.ico
│   └── placeholder.svg
├── 📂 src
│   ├── 📂 components
│   │   ├── ClientDataDialog.tsx
│   │   ├── Layout.tsx
│   │   └── 📂 ui (componentes shadcn/ui)
│   ├── 📂 hooks
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   ├── useAuth.tsx
│   │   └── useUserRole.tsx
│   ├── 📂 integrations
│   │   └── 📂 supabase
│   │       ├── client.ts
│   │       └── types.ts
│   ├── 📂 lib
│   │   └── utils.ts
│   ├── 📂 pages
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── NotFound.tsx
│   │   ├── ProposalBuild.tsx
│   │   ├── ProposalNew.tsx
│   │   ├── ProposalSimulate.tsx
│   │   ├── ProposalView.tsx
│   │   ├── Services.tsx
│   │   └── Users.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── 📂 supabase
│   ├── 📂 functions
│   │   └── 📂 create-user
│   ├── 📂 migrations
│   └── config.toml
├── .env
├── .gitignore
├── components.json
├── eslint.config.js
├── index.html
├── package.json
├── postcss.config.js
├── README.md
├── tailwind.config.ts
├── tsconfig.json
└── vite.config.ts
```

## 📌 Como Rodar o Projeto

### 1️⃣ Clonar o repositório
```sh
git clone <URL_DO_REPOSITORIO>
cd <NOME_DO_PROJETO>
```

### 2️⃣ Instalar dependências
```sh
npm install
```

### 3️⃣ Configurar variáveis de ambiente
O arquivo `.env` é gerado automaticamente pelo Lovable Cloud com as seguintes variáveis:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### 4️⃣ Rodar o projeto
```sh
npm run dev
```
Acesse **http://localhost:8080** no navegador.

## 🔧 Scripts Disponíveis

- **`npm run dev`**: Inicia o servidor de desenvolvimento
- **`npm run build`**: Cria a build de produção
- **`npm run preview`**: Visualiza a build de produção localmente
- **`npm run lint`**: Executa o linter ESLint

## 📜 Padrões de Commit

Seguindo o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- **feat:** Adicionar nova funcionalidade
- **fix:** Corrigir um erro/bug
- **docs:** Alterações na documentação
- **style:** Ajustes de formatação (espaços, indentação, etc.)
- **refactor:** Melhorias no código sem alterar funcionalidades
- **test:** Adição ou modificação de testes
- **chore:** Outras mudanças (dependências, configuração, etc.)
- **perf:** Melhorias de performance

### Exemplos:
```sh
git commit -m "feat: adiciona geração de PDF para propostas"
git commit -m "fix: corrige cálculo de prazo de entrega"
git commit -m "docs: atualiza README com instruções de deploy"
```

## 🔐 Segurança

O projeto implementa múltiplas camadas de segurança:
- Autenticação baseada em JWT
- Row Level Security (RLS) no banco de dados
- Validação de dados com Zod
- Proteção contra XSS e CSRF
- Variáveis de ambiente para credenciais sensíveis

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feat/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona nova feature'`)
4. Push para a branch (`git push origin feat/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT.

## 📞 Suporte

- **Documentação do Lovable:** [docs.lovable.dev](https://docs.lovable.dev/)
- **Comunidade Discord:** [Lovable Discord](https://discord.com/channels/1119885301872070706/1280461670979993613)
- **URL do Projeto:** [https://lovable.dev/projects/a461a67d-1587-4b96-beed-de44f0be6fbf](https://lovable.dev/projects/a461a67d-1587-4b96-beed-de44f0be6fbf)

## 🎯 Roadmap

- [ ] Exportação de propostas em Excel
- [ ] Sistema de notificações por email
- [ ] Dashboard com analytics avançados
- [ ] Integração com sistemas de pagamento
- [ ] App mobile (React Native)
- [ ] Relatórios personalizáveis
- [ ] Sistema de templates de proposta

---

Desenvolvido com ❤️ usando [Lovable](https://lovable.dev)
