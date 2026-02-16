# ⚡ Referência Rápida de Dropdowns

## 📋 Tabela de Todos os Dropdowns

| # | Nome | Trigger | Localização | Itens | Ação Principal |
|---|------|---------|-------------|-------|----------------|
| 1 | **Menu de Perfil** | Avatar + Nome ▼ | Header direito | 3 | Navegação e logout |
| 2 | **Dropdown Navegação** | Botão [Seção ▼] | Header centro | 5 | Trocar seção ativa |
| 3 | **Menu de Contexto** | Clique direito | Lista contatos | 4 | Ações em contato |
| 4 | **Painel Notificações** | Ícone 🔔 | Header direito | N | Avisos do sistema |
| 5 | **Modal Transferência** | Via contexto | Overlay | 2 dropdowns | Mover contato |
| 6 | **Modal Tags** | Via contexto | Overlay | Checkboxes | Adicionar tags |
| 7 | **Filtro Departamento** | Toggle buttons | Sidebar | 2 opções | Filtrar lista |
| 8 | **Filtro Status** | Buttons | Histórico | 4 opções | Filtrar tickets |

---

## 🎯 Menu de Perfil - Cheatsheet

| Item | Ícone | Ação | Shortcut | Dashboard |
|------|-------|------|----------|-----------|
| Histórico | 📊 | `setCurrentView('historico')` | - | Company/Attendant |
| Configurações | ⚙️ | `setCurrentView('configuracoes')` | - | Company/Attendant |
| Sair | 🚪 | `signOut()` | - | Todos |

**Arquivos:**
- Componente: `src/components/ProfileDropdown.tsx`
- Usado em: `CompanyDashboard.tsx`, `AttendantDashboard.tsx`

---

## 🧭 Dropdown de Navegação - Cheatsheet

| Seção | Ícone | Conteúdo | Dashboard |
|-------|-------|----------|-----------|
| Mensagens | 📱 | Tela de conversas e atendimento | Company/Attendant |
| Departamentos | 🏢 | Gerenciamento de departamentos | Company only |
| Setores | 📁 | Gerenciamento de setores | Company only |
| Atendentes | 👥 | Gerenciamento de atendentes | Company only |
| Tags | 🏷️ | Gerenciamento de tags | Company only |

**Arquivos:**
- Componente: `src/components/NavigationDropdown.tsx`
- Usado em: `CompanyDashboard.tsx`

**Como usar:**
```tsx
const navigationItems: NavigationItem[] = [
  { id: 'mensagens', label: 'Mensagens', icon: MessageSquare },
  { id: 'departamentos', label: 'Departamentos', icon: Briefcase },
  { id: 'setores', label: 'Setores', icon: FolderTree },
  { id: 'atendentes', label: 'Atendentes', icon: UserCircle2 },
  { id: 'tags', label: 'Tags', icon: Tag },
];

<NavigationDropdown
  items={navigationItems}
  activeItem={activeTab}
  onItemChange={(itemId) => setActiveTab(itemId as TabType)}
/>
```

**Características:**
- Botão mostra seção ativa com ícone e label
- Chevron ▼ rotaciona 180° ao abrir
- Item ativo tem indicador (●) à direita
- Click fora fecha automaticamente
- Animação suave de abertura

---

## 🖱️ Menu de Contexto - Cheatsheet

| Item | Ícone | Função | Requer Modal | Atualiza DB |
|------|-------|--------|--------------|-------------|
| Fixar/Desafixar | 📌 | Toggle `pinned` | ❌ | ✅ |
| Ativar/Desativar IA | 🤖 | Toggle `ia_ativada` | ❌ | ✅ |
| Adicionar tag | 🏷️ | Multi-select tags | ✅ | ✅ |
| Transferir | ↔️ | Mudar departamento | ✅ | ✅ |

**Como abrir:**
```tsx
<div onContextMenu={(e) => handleContextMenu(e, phoneNumber)}>
  {/* Conteúdo do contato */}
</div>
```

**Como fechar:**
```tsx
useEffect(() => {
  document.addEventListener('click', closeContextMenu);
  return () => document.removeEventListener('click', closeContextMenu);
}, []);
```

---

## 🎨 Classes CSS Comuns

### Botão de Dropdown

```tsx
className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100"
```

### Menu Dropdown Container

```tsx
className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50"
```

### Item de Menu

```tsx
className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-slate-700 hover:bg-slate-50"
```

### Item de Menu (Danger)

```tsx
className="w-full flex items-center gap-3 px-4 py-2.5 text-left text-red-600 hover:bg-red-50"
```

### Chevron Animado

```tsx
<ChevronDown
  className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
/>
```

---

## 🔧 Snippets Úteis

### Criar novo dropdown

```tsx
import { useState, useRef, useEffect } from 'react';

function MyDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)}>
        Toggle
      </button>
      {isOpen && (
        <div className="dropdown-menu">
          {/* Items */}
        </div>
      )}
    </div>
  );
}
```

### Menu de contexto (clique direito)

```tsx
const [contextMenu, setContextMenu] = useState<{x: number; y: number} | null>(null);

const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault();
  setContextMenu({ x: e.clientX, y: e.clientY });
};

return (
  <>
    <div onContextMenu={handleContextMenu}>
      {/* Conteúdo clicável */}
    </div>

    {contextMenu && (
      <div
        style={{ top: contextMenu.y, left: contextMenu.x }}
        className="fixed"
      >
        {/* Menu items */}
      </div>
    )}
  </>
);
```

---

## 📊 Banco de Dados - Campos Relacionados

| Tabela | Campo | Tipo | Descrição |
|--------|-------|------|-----------|
| `contacts` | `pinned` | `boolean` | Contato fixado |
| `contacts` | `ia_ativada` | `boolean` | IA ativa |
| `contacts` | `tag_ids` | `text[]` | Array de IDs de tags |
| `contacts` | `department_id` | `uuid` | Departamento atual |
| `contacts` | `ticket_status` | `enum` | Status do chamado |
| `transferencias` | `from_department_id` | `uuid` | Departamento origem |
| `transferencias` | `to_department_id` | `uuid` | Departamento destino |

---

## 🎯 Estados de Loading

### Dropdown com loading

```tsx
{isLoading ? (
  <div className="flex items-center gap-2">
    <Loader2 className="w-4 h-4 animate-spin" />
    Carregando...
  </div>
) : (
  <span>Item Normal</span>
)}
```

### Botão com loading

```tsx
<button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="w-4 h-4 animate-spin" />
      Processando...
    </>
  ) : (
    <>
      <Save className="w-4 h-4" />
      Salvar
    </>
  )}
</button>
```

---

## ⚠️ Problemas Comuns e Soluções

### Dropdown não fecha ao clicar fora

**Problema:** Event listener não configurado
**Solução:**
```tsx
useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (ref.current && !ref.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };
  document.addEventListener('mousedown', handler);
  return () => document.removeEventListener('mousedown', handler);
}, []);
```

### Menu de contexto aparece em posição errada

**Problema:** Overflow do container
**Solução:** Usar `fixed` em vez de `absolute`
```tsx
<div
  className="fixed"
  style={{ top: y, left: x }}
>
```

### Dropdown fica atrás de outros elementos

**Problema:** Z-index baixo
**Solução:** Aumentar z-index
```tsx
className="z-50" // ou z-[999]
```

### Animação não funciona

**Problema:** Falta transição CSS
**Solução:**
```tsx
className="transition-all duration-200"
// ou
className="transition-transform duration-200"
```

---

## 📱 Breakpoints Responsivos

```css
/* Mobile First */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

**Tailwind:**
```tsx
<div className="hidden md:block">
  {/* Visível apenas em md+ */}
</div>

<div className="block md:hidden">
  {/* Visível apenas em mobile */}
</div>
```

---

## 🎨 Tokens de Animação

| Propriedade | Valor | Uso |
|-------------|-------|-----|
| `duration-200` | 200ms | Padrão para hovers |
| `duration-300` | 300ms | Dropdowns abrindo |
| `ease-in-out` | cubic-bezier | Suave início/fim |
| `scale-[1.02]` | 102% | Hover sutil |
| `rotate-180` | 180deg | Chevron invertido |

---

## 🔍 Debug Tips

### Ver estado do dropdown

```tsx
{process.env.NODE_ENV === 'development' && (
  <div className="fixed bottom-4 right-4 bg-black text-white p-2 rounded">
    isOpen: {isOpen.toString()}
  </div>
)}
```

### Log de eventos

```tsx
const handleClick = (item: string) => {
  console.log('🔍 Dropdown item clicked:', item);
  // ... rest of code
};
```

### Highlight do elemento ativo

```tsx
<div className={`
  ${isOpen ? 'ring-2 ring-blue-500' : ''}
  // Debug visual
`}>
```

---

## ✅ Checklist de Implementação

Ao criar um novo dropdown, verificar:

- [ ] Estado `isOpen` gerenciado
- [ ] Ref para detectar click outside
- [ ] Event listener limpo no unmount
- [ ] Indicador visual (chevron/arrow)
- [ ] Animação de transição
- [ ] Z-index adequado (≥50)
- [ ] Hover states em itens
- [ ] Keyboard navigation (opcional)
- [ ] Mobile responsive
- [ ] Loading states (se aplicável)
- [ ] Error handling
- [ ] Toast de confirmação (se aplicável)

---

## 📚 Arquivos Importantes

```
src/
├── components/
│   ├── ProfileDropdown.tsx      ⭐ Menu de perfil
│   ├── CompanyDashboard.tsx     📊 Dashboard empresa
│   ├── AttendantDashboard.tsx   👤 Dashboard atendente
│   ├── TicketHistory.tsx        📋 Histórico
│   ├── Toast.tsx                💬 Notificações
│   └── Modal.tsx                🖼️  Base de modais
│
└── contexts/
    └── AuthContext.tsx           🔐 Auth state
```

---

## 🚀 Performance

### Otimizações implementadas:

✅ Renderização condicional (só renderiza quando aberto)
✅ Event listeners removidos no cleanup
✅ Refs para evitar re-renders
✅ Animações GPU-accelerated (transform, opacity)
✅ Memoização de componentes pesados (useCallback, useMemo)

### Métricas:

- **Tempo de abertura:** < 200ms
- **Memória:** Minimal (sem DOM quando fechado)
- **Re-renders:** 0 quando fechado

---

**Última atualização:** 2024-02-16
