# 🎨 Guia Visual de Dropdowns - Sistema de Atendimento

## 📐 Mapa de Interações

```
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃                           HEADER PRINCIPAL                                ┃
┃                                                                           ┃
┃  ╔═══════╗  ┌───────────────┐  [IA] ╭───╮ ╭────────╮                   ┃
┃  ║ LOGO  ║  │📱 Mensagens▼ │       │🔔│ │👤 User▼│                   ┃
┃  ╚═══════╝  └───────────────┘       ╰───╯ ╰────────╯                   ┃
┃                    │                    │       │                        ┃
┗━━━━━━━━━━━━━━━━━━━│━━━━━━━━━━━━━━━━━━━━│━━━━━━━│━━━━━━━━━━━━━━━━━━━━━━┛
                     │                    │       │
       ┌─────────────┘                    │       │
       │                                  │       │
       ▼                                  ▼       ▼
┌───────────────────┐      ┌──────────────────┐  ┌─────────────────────┐
│ DROPDOWN NAVEGAÇÃO│      │  NOTIFICAÇÕES    │  │   MENU DE PERFIL   │
├───────────────────┤      ├──────────────────┤  ├─────────────────────┤
│ 📱 Mensagens  ●  │      │ ⚠️ Pgto Vencendo │  │ 👤 Nome do Usuário │
│ 🏢 Departamentos │      │ ℹ️ Nova Mensagem │  │ Conta ativa        │
│ 📁 Setores       │      │ ✅ Transfer. OK  │  ├─────────────────────┤
│ 👥 Atendentes    │      └──────────────────┘  │ 📊 Histórico       │
│ 🏷️ Tags          │                            │ ⚙️  Configurações   │
└───────────────────┘                            ├─────────────────────┤
                                                 │ 🚪 Sair            │
                                                 └─────────────────────┘
```

## 🎯 Fluxo do Dropdown de Navegação

```
                    ┌──────────────────┐
                    │ CLIQUE NO BOTÃO  │
                    │ [Mensagens ▼]    │
                    └────────┬─────────┘
                             │
                             ▼
              ┌──────────────────────────┐
              │  DROPDOWN MENU ABERTO    │
              │                          │
              │  📱 Mensagens         ● │
              │  🏢 Departamentos       │
              │  📁 Setores             │
              │  👥 Atendentes          │
              │  🏷️ Tags                │
              └──────────────────────────┘
                       │    │    │
            ┌──────────┼────┼────┴──────────┐
            │          │    │               │
            ▼          ▼    ▼               ▼
      ┌─────────┐ ┌──────┐ ┌────────┐  ┌──────┐
      │ Troca   │ │Troca │ │ Troca  │  │Click │
      │ p/Depto │ │p/Set │ │p/Atend │  │Fora  │
      └────┬────┘ └───┬──┘ └───┬────┘  └───┬──┘
           │          │        │           │
           ▼          ▼        ▼           ▼
      ┌─────────┐ ┌──────┐ ┌────────┐ ┌──────┐
      │ Mostra  │ │Mostra│ │ Mostra │ │Fecha │
      │ Depart. │ │Setor │ │Atend.  │ │Menu  │
      └─────────┘ └──────┘ └────────┘ └──────┘
```

## �� Fluxo de Navegação do Menu de Perfil

```
                    ┌──────────────┐
                    │ CLIQUE NO    │
                    │ AVATAR/NOME  │
                    └──────┬───────┘
                           │
                           ▼
              ┌────────────────────────┐
              │  DROPDOWN MENU ABERTO  │
              └────────────────────────┘
                      │    │    │
            ┌─────────┼────┼────┴────────┐
            │         │    │             │
            ▼         ▼    ▼             ▼
      ┌──────────┐ ┌────┐ ┌──────────┐ ┌──────┐
      │Histórico │ │Conf│ │  Sair    │ │Click │
      │          │ │ig  │ │          │ │Fora  │
      └────┬─────┘ └──┬─┘ └────┬─────┘ └───┬──┘
           │          │        │           │
           ▼          ▼        ▼           ▼
      ┌────────┐ ┌────────┐ ┌──────┐  ┌──────┐
      │ Tela   │ │ Tela   │ │Logout│  │Fecha │
      │Histórico│ │Config │ │      │  │Menu  │
      └────────┘ └────────┘ └──────┘  └──────┘
```

## 🖱️ Interações de Contato (Clique Direito)

```
┌─────────────────────┐
│  LISTA DE CONTATOS  │
│                     │
│  ┌───────────────┐  │
│  │ 👤 João Silva │◄─┼─── CLIQUE DIREITO
│  │ Mensagem...   │  │
│  └───────────────┘  │         │
│  ┌───────────────┐  │         │
│  │ 👤 Maria Lima │  │         ▼
│  │ Mensagem...   │  │    ┌──────────────────────┐
│  └───────────────┘  │    │ MENU DE CONTEXTO     │
└─────────────────────┘    ├──────────────────────┤
                           │ 📌 Fixar/Desafixar   │───┐
                           │ 🤖 Ativar/Desativar  │   │
                           │ 🏷️  Adicionar Tag    │───┼──► ABRE MODAL
                           │ ↔️  Transferir Depto │───┘
                           └──────────────────────┘
                                     │
                    ┌────────────────┼─────────────┐
                    │                │             │
                    ▼                ▼             ▼
              ┌─────────┐     ┌──────────┐  ┌──────────┐
              │  Fixado │     │ Modal    │  │  Modal   │
              │  no Topo│     │  Tags    │  │Transfer. │
              └─────────┘     └──────────┘  └──────────┘
```

## 📋 Modal de Transferência - Fluxo

```
┌──────────────────────────────────────┐
│  TRANSFERIR DEPARTAMENTO             │
├──────────────────────────────────────┤
│                                      │
│  Departamento: [Selecione... ▼]     │◄─── DROPDOWN 1
│      │                               │
│      └──► ┌─────────────────┐       │
│            │ Recepção        │       │
│            │ Suporte         │       │
│            │ Vendas          │       │
│            └─────────────────┘       │
│                    │                 │
│                    └─► SELECIONADO   │
│                                      │
│  Setor: [Selecione... ▼]            │◄─── DROPDOWN 2
│      │                               │     (FILTRADO)
│      └──► ┌─────────────────┐       │
│            │ Setor A         │       │
│            │ Setor B         │       │
│            └─────────────────┘       │
│                                      │
├──────────────────────────────────────┤
│  [Cancelar]        [Transferir]     │
└──────────────────────────────────────┘
              │               │
              ▼               ▼
          Fecha           Registra
           Modal          Transfer.
```

## 🎨 Estados Visuais dos Elementos

### BOTÃO DE DROPDOWN

```
┌─────────────────────────┐
│ Estado: NORMAL          │
│  [👤 User ▼]           │  Seta para baixo
│  cor: slate-700         │
└─────────────────────────┘

┌─────────────────────────┐
│ Estado: HOVER           │
│  [👤 User ▼]           │  Fundo cinza claro
│  bg: slate-100          │
└─────────────────────────┘

┌─────────────────────────┐
│ Estado: ABERTO          │
│  [👤 User ▲]           │  Seta para cima
│  rotação: 180deg        │
└─────────────────────────┘
```

### ITEM DE MENU

```
┌─────────────────────────┐
│ Estado: NORMAL          │
│  [📊] Histórico        │
│  bg: transparent        │
└─────────────────────────┘

┌─────────────────────────┐
│ Estado: HOVER           │
│  [📊] Histórico        │
│  bg: slate-50           │
│  cursor: pointer        │
└─────────────────────────┘

┌─────────────────────────┐
│ Estado: ACTIVE/CLICK    │
│  [📊] Histórico        │
│  Executa ação           │
│  Fecha menu             │
└─────────────────────────┘
```

### ABA DE NAVEGAÇÃO

```
┌─────────────────────────┐
│ Estado: INATIVA         │
│  [📱] Mensagens        │
│  text: slate-600        │
│  bg: transparent        │
└─────────────────────────┘

┌─────────────────────────┐
│ Estado: HOVER           │
│  [📱] Mensagens        │
│  bg: slate-50           │
│  scale: 1.02            │
└─────────────────────────┘

┌─────────────────────────┐
│ Estado: ATIVA           │
│  [📱] Mensagens        │
│  gradient: blue-500→600 │
│  text: white            │
│  shadow: lg             │
└─────────────────────────┘
```

## 🔄 Ciclo de Vida de um Dropdown

```
1. MONTAGEM
   │
   ▼
   isOpen = false
   │
   ▼
2. RENDER FECHADO
   │
   ▼
3. EVENTO: CLICK ──────┐
   │                   │
   ▼                   │
4. setState(true)      │
   │                   │
   ▼                   │
5. RENDER ABERTO       │
   │                   │
   │  ┌────────────────┘
   │  │
   ▼  ▼
6. DETECTA CLICK OUTSIDE?
   │         │
   SIM       NÃO
   │         │
   ▼         ▼
7. Close  ITEM CLICKED?
   │         │
   │         SIM
   │         │
   │         ▼
   │    8. Execute Action
   │         │
   └─────────┴────► 9. setState(false)
                    │
                    ▼
                 10. RENDER FECHADO
```

## 🎭 Animações

### SLIDE UP

```
Frame 1: opacity: 0, translateY: 10px
  │
  ▼
Frame 2: opacity: 0.5, translateY: 5px
  │
  ▼
Frame 3: opacity: 1, translateY: 0
```

### ROTATE CHEVRON

```
Estado Fechado: rotate(0deg)
  │
  │ transition: 200ms
  ▼
Estado Aberto: rotate(180deg)

▼  →  ▲
```

### SCALE ON HOVER

```
Normal: scale(1)
  │
  │ transition: 200ms
  ▼
Hover: scale(1.02)
```

## 📱 Layout Responsivo

### DESKTOP (≥768px)

```
┌──────────────────────────────────────────────┐
│ [Logo] [Mensagens][Depart][Set][Atend][Tags]│
│                               [🔔] [👤 User▼]│
└──────────────────────────────────────────────┘
       └─────────────┬──────────────┘
                     │
            Todos visíveis
            Hover funcional
            Chevron visível
```

### MOBILE (<768px)

```
┌──────────────────────────────────────┐
│ [☰] [Logo]            [🔔] [👤]     │
└──────────────────────────────────────┘
                              └─► Chevron oculto
                                  Nome oculto
                                  Só avatar
```

## 🎯 Indicadores Visuais

### ELEMENTOS CLICÁVEIS

```
✅ SIM - TEM INDICADOR
─────────────────────────
[👤 User ▼]           ← Chevron Down
[Dropdown ▼]          ← Chevron Down
[Botão]               ← Cursor pointer
[🔔 Badge]            ← Contador


❌ NÃO - SEM INDICADOR
─────────────────────────
[Logo]                ← Não clicável
[Texto]               ← Informativo
[Badge Status]        ← Apenas visual
```

## 🔍 Hierarquia Z-Index

```
z-50  ┌─────────────────┐
      │ DROPDOWNS       │  ← Mais alto
      │ & MODALS        │
      └─────────────────┘
z-40  ┌─────────────────┐
      │ TOOLTIPS        │
      └─────────────────┘
z-30  ┌─────────────────┐
      │ STICKY HEADER   │
      └─────────────────┘
z-10  ┌─────────────────┐
      │ SIDEBAR         │
      └─────────────────┘
z-0   ┌─────────────────┐
      │ CONTEÚDO BASE   │  ← Mais baixo
      └─────────────────┘
```

## 📐 Espaçamentos Padrão

```
╔════════════════════════╗
║  DROPDOWN              ║
║                        ║ ← py-2 (8px)
║  ┌──────────────────┐ ║
║  │ Item de Menu     │ ║ ← py-2.5 (10px)
║  └──────────────────┘ ║
║  ┌──────────────────┐ ║
║  │ Item de Menu     │ ║
║  └──────────────────┘ ║
║                        ║
╚════════════════════════╝

px-4 (16px) ←→ Padding horizontal
gap-3 (12px) ← Gap entre ícone e texto
```

## 🎨 Paleta de Cores

```
┌─────────────────────────────────────┐
│ AZUL (Primary)                      │
│ ████████ #3b82f6 (blue-500)        │
│ ████████ #2563eb (blue-600)        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ CINZA (Neutral)                     │
│ ░░░░░░░░ #f8fafc (slate-50)        │
│ ▒▒▒▒▒▒▒▒ #f1f5f9 (slate-100)       │
│ ▓▓▓▓▓▓▓▓ #475569 (slate-600)       │
│ ████████ #1e293b (slate-900)       │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ VERMELHO (Danger)                   │
│ ░░░░░░░░ #fef2f2 (red-50)          │
│ ████████ #dc2626 (red-600)         │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│ VERDE (Success)                     │
│ ░░░░░░░░ #dcfce7 (green-100)       │
│ ████████ #16a34a (green-600)       │
└─────────────────────────────────────┘
```

---

**💡 Dica:** Para testar os dropdowns, use o DevTools para simular diferentes viewports e estados de hover.

**🔧 Debug:** Adicione `console.log` nos handlers de click para rastrear o fluxo de eventos.

**📊 Performance:** Todos os dropdowns são renderizados condicionalmente (não ficam no DOM quando fechados).
