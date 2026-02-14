# Sistema de Tema Global - Documentação

## Visão Geral

O sistema de tema foi completamente refatorado para ser **global, consistente e persistente**. Agora funciona de forma unificada em todas as telas, tanto para Company quanto para Attendant.

---

## Como Funciona

### 1. Persistência no Banco de Dados

**Tabela:** `companies`
**Coluna:** `dark_mode` (boolean, default: false)

- O modo escuro é salvo **por empresa** no banco de dados
- Quando um usuário faz login, o modo é carregado automaticamente
- Quando alterna o modo, é salvo imediatamente no banco
- Funciona tanto para Company (owner) quanto para Attendant (usa company_id)

---

### 2. Variáveis CSS Centralizadas

**Arquivo:** `src/index.css`

Todas as cores são definidas em variáveis CSS que mudam automaticamente quando a classe `.dark` é aplicada no `<html>`.

#### Variáveis Disponíveis:

**Fundos:**
- `--bg-primary` - Fundo principal (branco / preto)
- `--bg-secondary` - Fundo secundário (cinza claro / cinza escuro)
- `--bg-tertiary` - Fundo terciário
- `--bg-hover` - Fundo hover
- `--bg-card` - Fundo de cards
- `--bg-sidebar` - Fundo da sidebar
- `--bg-header` - Fundo do header
- `--bg-input` - Fundo de inputs

**Textos:**
- `--text-primary` - Texto principal
- `--text-secondary` - Texto secundário
- `--text-tertiary` - Texto terciário
- `--text-input` - Texto em inputs

**Bordas:**
- `--border-primary` - Borda principal
- `--border-secondary` - Borda secundária
- `--border-card` - Borda de cards
- `--border-input` - Borda de inputs

**Mensagens:**
- `--message-incoming-bg` - Fundo mensagem recebida
- `--message-incoming-text` - Texto mensagem recebida
- `--message-outgoing-bg` - Fundo mensagem enviada
- `--message-outgoing-text` - Texto mensagem enviada

#### Classes CSS Utilitárias:

```css
.bg-app-primary     /* Usa --bg-primary */
.bg-app-secondary   /* Usa --bg-secondary */
.bg-app-card        /* Usa --bg-card */
.bg-app-sidebar     /* Usa --bg-sidebar */
.bg-app-header      /* Usa --bg-header */
.bg-app-input       /* Usa --bg-input */

.text-app-primary   /* Usa --text-primary */
.text-app-secondary /* Usa --text-secondary */
.text-app-tertiary  /* Usa --text-tertiary */

.border-app-primary /* Usa --border-primary */
.border-app-card    /* Usa --border-card */

.message-incoming   /* Mensagem recebida */
.message-outgoing   /* Mensagem enviada */

.hover-app:hover    /* Hover state */
```

---

### 3. ThemeContext Refatorado

**Arquivo:** `src/contexts/ThemeContext.tsx`

#### Principais Mudanças:

1. **Carregamento do Banco:**
   - Ao chamar `loadCompanyTheme(companyId)`, carrega `dark_mode` do banco
   - Aplica automaticamente a classe `.dark` no `<html>`

2. **Alternância do Modo:**
   - `toggleDarkMode()` alterna o estado local
   - Salva automaticamente no banco de dados
   - Funciona para Company e Attendant

3. **Aplicação Automática:**
   - useEffect monitora `darkMode`
   - Adiciona/remove classe `.dark` do `documentElement`
   - CSS reage automaticamente através das variáveis

---

### 4. Modo Claro (Light Mode)

**Características:**
- Fundo branco puro (#FFFFFF)
- Cards brancos
- Textos escuros (#0F172A)
- Bordas sutis cinza claro (#E2E8F0)
- Visual limpo e profissional

---

### 5. Modo Escuro (Dark Mode) - Estilo ChatGPT

**Características:**
- Fundo preto puro (#000000)
- Cards levemente mais claros (#141414)
- Textos brancos suaves (#ECECF1)
- Bordas sutis (#262626)
- Inputs escuros (#202023)
- Visual elegante e consistente

---

## Como Usar

### Para Alternar o Modo:

```tsx
import { useTheme } from '../contexts/ThemeContext';

function Component() {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button onClick={toggleDarkMode}>
      {darkMode ? 'Modo Claro' : 'Modo Escuro'}
    </button>
  );
}
```

### Para Carregar o Tema ao Fazer Login:

```tsx
import { useTheme } from '../contexts/ThemeContext';

function Dashboard() {
  const { loadCompanyTheme } = useTheme();

  useEffect(() => {
    if (companyId) {
      loadCompanyTheme(companyId);
    }
  }, [companyId]);
}
```

### Para Estilizar Componentes:

**Opção 1: Classes Utilitárias**
```tsx
<div className="bg-app-primary text-app-primary border-app-primary">
  Conteúdo
</div>
```

**Opção 2: Tailwind + dark:**
```tsx
<div className="bg-white dark:bg-black text-slate-900 dark:text-white">
  Conteúdo
</div>
```

**Recomendação:** Use as classes utilitárias `.bg-app-*` para garantir consistência total.

---

## Telas Afetadas

✅ **Todas as telas do sistema:**
- Login
- Dashboard Company
- Dashboard Attendant
- Chat/Mensagens
- Configurações
- Departamentos
- Setores
- Atendentes
- Tags
- Modais
- Sidebars
- Headers

---

## Vantagens do Novo Sistema

1. **Global:** Uma única fonte de verdade (`.dark` no root)
2. **Consistente:** Todas as telas usam as mesmas variáveis
3. **Persistente:** Salvo no banco, não se perde ao atualizar
4. **Simples:** Não precisa lógica duplicada em componentes
5. **Profissional:** Cores definidas para modo claro e escuro elegantes
6. **Performático:** CSS reage automaticamente sem re-renders desnecessários

---

## Regras de Desenvolvimento

### ✅ FAÇA:
- Use as classes utilitárias `.bg-app-*`, `.text-app-*`
- Mantenha as cores centralizadas no `index.css`
- Teste em modo claro E escuro
- Use a paleta definida

### ❌ NÃO FAÇA:
- Criar lógica de tema individual em componentes
- Usar `bg-white` sem `dark:bg-black`
- Criar variáveis de cor locais
- Adicionar overrides CSS em componentes
- Misturar estilos diferentes

---

## Troubleshooting

### O modo não está sendo aplicado?
1. Verifique se `ThemeProvider` envolve todo o app
2. Verifique se `loadCompanyTheme()` foi chamado após login
3. Inspecione se a classe `.dark` está no `<html>`

### Cores estão inconsistentes?
1. Use as classes utilitárias `.bg-app-*`
2. Não use classes Tailwind diretas sem `dark:`
3. Verifique se não há overrides CSS locais

### Modo não persiste ao recarregar?
1. Verifique se `dark_mode` está sendo salvo no banco
2. Verifique se `loadCompanyTheme()` está sendo chamado
3. Verifique permissões RLS da tabela `companies`

---

## Estrutura de Arquivos

```
src/
├── contexts/
│   └── ThemeContext.tsx          # Context global do tema
├── index.css                      # Variáveis CSS e estilos globais
└── components/
    └── [componentes]              # Usam as classes utilitárias
```

---

## Conclusão

O sistema agora é **profissional, consistente e fácil de manter**. Todas as telas reagem automaticamente ao modo escolhido, que é persistido no banco de dados por empresa.

Não há mais gambiarras, overrides isolados ou lógica duplicada. Tudo funciona através de um sistema centralizado e elegante.
