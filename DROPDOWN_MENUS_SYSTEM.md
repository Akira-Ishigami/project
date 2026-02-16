# 📋 Sistema de Dropdown Menus - Documentação Completa

## 🎯 Visão Geral

Este documento descreve todos os menus dropdown e elementos interativos do sistema de atendimento.

---

## 1️⃣ Menu de Perfil do Usuário

### 🔘 Trigger Element
**Localização:** Canto superior direito do header
**Elemento:** Avatar circular + Nome do usuário + Seta ▼

```
┌─────────────────────────────────┐
│ [👤]  Nome do Usuário  ▼       │  ← Botão clicável
└─────────────────────────────────┘
```

### 📂 Estrutura do Menu

```
👤 [Nome do Usuário] ▼
│
├─────────────────────────────────┐
│ 👤 Nome do Usuário              │ ← Header (informativo)
│ Conta ativa                     │
├─────────────────────────────────┤
│                                 │
│ 📊 Histórico                    │ → Abre tela de histórico de chamados
│                                 │
│ ⚙️  Configurações               │ → Abre tela de configurações
│                                 │
├─────────────────────────────────┤
│                                 │
│ 🚪 Sair                         │ → Logout do sistema
│                                 │
└─────────────────────────────────┘
```

### 🎨 Estados Visuais

| Estado | Descrição |
|--------|-----------|
| **Fechado** | Seta ▼ apontando para baixo |
| **Aberto** | Seta ▲ apontando para cima (rotação 180°) |
| **Hover no botão** | Fundo cinza claro (`bg-slate-100`) |
| **Hover nos itens** | Item com fundo `bg-slate-50` |
| **Hover em "Sair"** | Item com fundo vermelho claro (`bg-red-50`) |

### ⚡ Comportamento

- **Abrir:** Click no avatar ou nome
- **Fechar:** Click fora do menu ou ao selecionar uma opção
- **Animação:** Slide up ao abrir
- **Z-index:** 50 (sobrepõe outros elementos)

### 🎯 Dashboards que possuem

- ✅ **CompanyDashboard** (Empresa)
- ✅ **AttendantDashboard** (Atendente)

---

## 2️⃣ Dropdown de Navegação Principal

### 🔘 Trigger Element
**Localização:** Centro do header (lado esquerdo)
**Elemento:** Botão dropdown com ícone + label + chevron ▼

```
┌─────────────────────────┐
│ 📱 Mensagens ▼         │  ← Botão clicável
└─────────────────────────┘
```

### 📂 Estrutura do Menu

```
[Seção Ativa] ▼
│
├─────────────────────────────────┐
│ 📱 Mensagens                ●  │ ← Item ativo (com indicador)
├─────────────────────────────────┤
│ 🏢 Departamentos               │
│ 📁 Setores                     │
│ 👥 Atendentes                  │
│ 🏷️ Tags                        │
└─────────────────────────────────┘
```

**Mapeamento das seções:**

```
Navegação Principal ▼
│
├── 📱 Mensagens → Tela de conversas e atendimento
├── 🏢 Departamentos → Gerenciamento de departamentos
├── 📁 Setores → Gerenciamento de setores
├── 👥 Atendentes → Gerenciamento de atendentes (apenas Company)
└── 🏷️ Tags → Gerenciamento de tags
```

### 🎨 Estados Visuais

| Estado | Descrição |
|--------|-----------|
| **Botão fechado** | Gradiente azul com sombra, chevron ▼ para baixo |
| **Botão aberto** | Gradiente azul com sombra maior, chevron ▲ para cima |
| **Item ativo** | Fundo azul claro (`bg-blue-50`), texto azul, indicador • |
| **Item hover** | Fundo cinza claro (`bg-slate-50`) |

### ⚡ Comportamento

- **Abrir:** Click no botão dropdown
- **Fechar:** Click fora do menu ou ao selecionar um item
- **Animação:** Slide up ao abrir
- **Indicador visual:** Chevron rotaciona 180° quando aberto
- **Item ativo:** Mostra indicador (●) à direita

### 🎯 Dashboards que possuem

- ✅ **CompanyDashboard** (Empresa) - Todas as 5 opções
- ❌ **AttendantDashboard** (Atendente) - Não possui (usa apenas visualização de mensagens)

---

## 3️⃣ Menu de Contexto de Contatos

### 🔘 Trigger Element
**Localização:** Lista de contatos
**Ação:** Clique direito em qualquer contato

```
┌──────────────────────────┐
│  👤 João Silva          │  ← Clique direito aqui
│  Última mensagem...     │
└──────────────────────────┘
       ↓
┌─────────────────────────────┐
│ 📌 Fixar contato            │
│ 🤖 Ativar IA               │
│ 🏷️  Adicionar tag          │
│ ↔️  Transferir departamento │
└─────────────────────────────┘
```

### 📂 Estrutura do Menu

```
[Clique Direito no Contato]
│
├── 📌 Fixar/Desafixar contato
│   └─→ Fixa o contato no topo da lista (ordenação prioritária)
│
├── 🤖 Ativar/Desativar IA
│   └─→ Alterna o estado da IA para este contato específico
│
├── 🏷️ Adicionar tag
│   └─→ Abre modal para seleção de múltiplas tags
│
└── ↔️ Transferir departamento
    └─→ Abre modal para transferir contato entre departamentos
```

### 🎨 Estados Visuais

| Item | Estado | Aparência |
|------|--------|-----------|
| **Geral** | Hover | `bg-slate-50` |
| **Fixar** | Ícone | 📌 Pin |
| **IA** | Dinâmico | "Ativar" ou "Desativar" conforme estado |
| **Tag** | Ícone | 🏷️ Tag |
| **Transferir** | Ícone | ↔️ ArrowRightLeft |

### ⚡ Comportamento

- **Abrir:** Clique direito em um contato
- **Fechar:** Click fora do menu ou ao selecionar uma opção
- **Posicionamento:** Na posição do cursor (x, y do evento)
- **Background:** Overlay transparente para detectar clicks externos

---

## 4️⃣ Modal de Transferência

### 🔘 Trigger Element
**Origem:** Menu de contexto → "Transferir departamento"

```
┌─────────────────────────────────────┐
│  Transferir Departamento            │
│                                     │
│  Departamento: [Dropdown ▼]        │
│  Setor: [Dropdown ▼]               │
│                                     │
│  [Cancelar]  [Transferir]          │
└─────────────────────────────────────┘
```

### 📂 Dropdowns Internos

```
Modal de Transferência
│
├── Departamento ▼
│   ├── Recepção
│   ├── Suporte Técnico
│   ├── Vendas
│   └── [outros departamentos...]
│
└── Setor ▼ (condicional)
    ├── Setor A (filtrado por departamento)
    ├── Setor B
    └── [outros setores...]
```

### ⚡ Comportamento

- **Dropdown Departamento:** Lista todos os departamentos da empresa
- **Dropdown Setor:** Filtra setores baseado no departamento selecionado
- **Validação:** Não permite salvar sem departamento selecionado
- **Ação:** Cria registro na tabela `transferencias` e mensagem de sistema

---

## 5️⃣ Modal de Tags

### 🔘 Trigger Element
**Origem:** Menu de contexto → "Adicionar tag"

```
┌─────────────────────────────────────┐
│  Gerenciar Tags                     │
│                                     │
│  ☑️ Tag Urgente                     │
│  ☐ Tag VIP                          │
│  ☑️ Tag Recorrente                  │
│  ☐ Tag Em Análise                   │
│                                     │
│  [Cancelar]  [Salvar]               │
└─────────────────────────────────────┘
```

### 📂 Estrutura

```
Modal de Tags
│
├── ☑️ Tag 1 (selecionada)
├── ☐ Tag 2 (não selecionada)
├── ☑️ Tag 3 (selecionada)
└── ☐ Tag N
    └─→ Multi-seleção permitida
```

### ⚡ Comportamento

- **Seleção:** Múltiplas tags podem ser selecionadas
- **Visual:** Checkbox com cor da tag
- **Salvamento:** Usa RPC `update_contact_tags` para atualizar
- **Feedback:** Toast de sucesso/erro após ação

---

## 6️⃣ Painel de Notificações

### 🔘 Trigger Element
**Localização:** Header direito (antes do perfil)
**Elemento:** Ícone de sino 🔔 com contador

```
┌─────┐
│ 🔔  │  ← Badge com número de notificações
│  3  │
└─────┘
```

### 📂 Estrutura do Painel

```
🔔 Notificações (3) ▼
│
├───────────────────────────────────┐
│  Notificações                  ✕ │
├───────────────────────────────────┤
│                                   │
│  ⚠️ Pagamento Vencendo           │
│  Vence em 3 dias                 │
│  ───────────────────────────────  │
│                                   │
│  ℹ️ Nova Mensagem                 │
│  Contato: João Silva             │
│  ───────────────────────────────  │
│                                   │
│  ✅ Transferência Concluída       │
│  Contato movido para Suporte     │
│                                   │
└───────────────────────────────────┘
```

### 🎨 Tipos de Notificação

| Tipo | Ícone | Cor | Ação |
|------|-------|-----|------|
| **Pagamento** | ⚠️ | Amarelo | Aviso sobre vencimento |
| **Nova Mensagem** | ℹ️ | Azul | Informação de nova msg |
| **Transferência** | ✅ | Verde | Confirmação de ação |

### ⚡ Comportamento

- **Abrir:** Click no ícone do sino
- **Fechar:** Click no X ou fora do painel
- **Contador:** Badge vermelho com número de não lidas
- **Auto-dismiss:** Notificações somem após 5 segundos (algumas)

---

## 7️⃣ Dropdown de Filtros (AttendantDashboard)

### 🔘 Trigger Element
**Localização:** Sidebar de contatos
**Tipo:** Toggle de filtro

```
┌────────────────┬───────────┐
│ Meu Departamento │  Todos  │  ← Botões toggle
└────────────────┴───────────┘
```

### 📂 Estrutura

```
Filtro de Contatos
│
├── 📍 Meu Departamento (padrão)
│   └─→ Mostra apenas contatos do departamento do atendente
│
└── 🌐 Todos
    └─→ Mostra todos os contatos da empresa
```

### 🎨 Estados Visuais

| Estado | Aparência |
|--------|-----------|
| **Ativo** | Gradiente azul (`from-blue-500 to-blue-600`) |
| **Inativo** | Fundo branco com borda |

---

## 8️⃣ Dropdown de Status (TicketHistory)

### 🔘 Trigger Element
**Localização:** Tela de Histórico
**Tipo:** Botões de filtro

```
┌───────┬────────┬──────────────┬─────────────┐
│ Todos │ Aberto │ Em Processo │ Finalizado │
└───────┴────────┴──────────────┴─────────────┘
```

### 📂 Estrutura

```
Filtro de Status de Chamados
│
├── 📊 Todos → Exibe todos os chamados
├── 🔴 Aberto → Apenas chamados abertos
├── 🟡 Em Processo → Apenas em atendimento
└── 🟢 Finalizado → Apenas finalizados
```

### 🎨 Cores por Status

| Status | Cor | Badge |
|--------|-----|-------|
| **Aberto** | Vermelho | 🔴 `bg-red-100 text-red-700` |
| **Em Processo** | Amarelo | 🟡 `bg-yellow-100 text-yellow-700` |
| **Finalizado** | Verde | 🟢 `bg-green-100 text-green-700` |

---

## 📊 Hierarquia Visual

```
┌─────────────────────────────────────────────────────────┐
│                    HEADER                               │
│  [Logo] [Abas] [IA] [🔔] [👤 User ▼]                 │
└─────────────────────────────────────────────────────────┘
         │                        │          │
         ▼                        ▼          ▼
   [Navegação]            [Notificações] [Perfil]
                                          │
                                          ├─→ Histórico
                                          ├─→ Configurações
                                          └─→ Sair

┌─────────────────────────────────────────────────────────┐
│                  ÁREA DE CONTEÚDO                       │
│                                                         │
│  [Sidebar de Contatos]  │  [Área de Chat]              │
│       │                 │                               │
│   (clique direito)      │                               │
│       │                 │                               │
│       ▼                 │                               │
│  [Menu Contexto]        │                               │
│   ├─ Fixar             │                               │
│   ├─ IA                │                               │
│   ├─ Tags              │                               │
│   └─ Transferir        │                               │
│                         │                               │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Boas Práticas Implementadas

### ✅ Acessibilidade
- Indicadores visuais claros (chevrons ▼)
- Feedback visual em hover
- Animações suaves
- Contraste adequado

### ✅ UX
- Click fora fecha menus
- Escape key fecha modals
- Loading states em ações
- Toasts de confirmação

### ✅ Consistência
- Mesma estrutura de dropdown em toda aplicação
- Padrão de cores unificado
- Animações padronizadas
- Espaçamento consistente

### ✅ Performance
- Menus renderizados condicionalmente
- Event listeners limpos no unmount
- Z-index hierárquico
- Animações GPU-accelerated

---

## 🔧 Componentes Principais

| Componente | Arquivo | Uso |
|------------|---------|-----|
| **ProfileDropdown** | `ProfileDropdown.tsx` | Menu de perfil |
| **Toast** | `Toast.tsx` | Notificações temporárias |
| **Modal** | `Modal.tsx` | Base para modais |
| **TicketHistory** | `TicketHistory.tsx` | Histórico com filtros |
| **CompanyDashboard** | `CompanyDashboard.tsx` | Dashboard empresa |
| **AttendantDashboard** | `AttendantDashboard.tsx` | Dashboard atendente |

---

## 🎨 Tokens de Design

### Cores
```css
--blue-500: #3b82f6
--blue-600: #2563eb
--slate-50: #f8fafc
--slate-100: #f1f5f9
--slate-600: #475569
--red-50: #fef2f2
--red-600: #dc2626
```

### Espaçamento
```css
padding: 0.5rem (py-2)
padding: 0.75rem (py-3)
gap: 0.75rem (gap-3)
```

### Bordas
```css
border-radius: 0.5rem (rounded-lg)
border-radius: 0.75rem (rounded-xl)
```

### Sombras
```css
shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1)
shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1)
```

---

## 📱 Responsividade

### Desktop (≥768px)
- Todos os dropdowns visíveis
- Hover states funcionais
- Sidebar sempre visível

### Mobile (<768px)
- Sidebar toggle
- Nome do usuário oculto no perfil
- Chevron oculto no mobile
- Menus full-width

---

## 🚀 Próximas Melhorias

- [ ] Atalhos de teclado (Alt+H para histórico, etc)
- [ ] Breadcrumbs de navegação
- [ ] Dropdown de idiomas
- [ ] Dropdown de temas (claro/escuro)
- [ ] Search dropdown com resultados
- [ ] Dropdown de ações em massa

---

**Última atualização:** 2024-02-16
**Versão:** 1.0.0
