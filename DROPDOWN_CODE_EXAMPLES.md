# 💻 Exemplos de Código - Dropdowns

## 🎯 Exemplos Prontos Para Copiar

### 1. Dropdown Básico

```tsx
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

function BasicDropdown() {
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
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
      >
        <span>Selecionar Opção</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 animate-slideUp">
          <button
            onClick={() => {
              console.log('Opção 1 selecionada');
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors"
          >
            Opção 1
          </button>
          <button
            onClick={() => {
              console.log('Opção 2 selecionada');
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors"
          >
            Opção 2
          </button>
          <button
            onClick={() => {
              console.log('Opção 3 selecionada');
              setIsOpen(false);
            }}
            className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors"
          >
            Opção 3
          </button>
        </div>
      )}
    </div>
  );
}
```

---

### 2. Dropdown com Ícones

```tsx
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Home, Settings, User, LogOut } from 'lucide-react';

function IconDropdown() {
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

  const menuItems = [
    { icon: Home, label: 'Início', action: () => console.log('Início') },
    { icon: User, label: 'Perfil', action: () => console.log('Perfil') },
    { icon: Settings, label: 'Configurações', action: () => console.log('Config') },
    { icon: LogOut, label: 'Sair', action: () => console.log('Sair'), danger: true },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
      >
        <span>Menu</span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={() => {
                  item.action();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                  item.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

---

### 3. Menu de Contexto (Clique Direito)

```tsx
import { useState, useEffect } from 'react';
import { Copy, Edit, Trash2, Share } from 'lucide-react';

function ContextMenu() {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    const handleScroll = () => setContextMenu(null);

    document.addEventListener('click', handleClick);
    document.addEventListener('scroll', handleScroll);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  return (
    <>
      {/* Elemento que abre o menu */}
      <div
        onContextMenu={handleContextMenu}
        className="p-8 border-2 border-dashed border-slate-300 rounded-lg text-center cursor-pointer hover:border-blue-500 transition-colors"
      >
        Clique com o botão direito aqui
      </div>

      {/* Menu de Contexto */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button
            onClick={() => {
              console.log('Copiar');
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copiar
          </button>
          <button
            onClick={() => {
              console.log('Editar');
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={() => {
              console.log('Compartilhar');
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-left text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Share className="w-4 h-4" />
            Compartilhar
          </button>
          <div className="border-t border-slate-100 my-1" />
          <button
            onClick={() => {
              console.log('Excluir');
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-3 px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </button>
        </div>
      )}
    </>
  );
}
```

---

### 4. Dropdown com Busca

```tsx
import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

function SearchableDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = [
    'React',
    'Vue',
    'Angular',
    'Svelte',
    'Next.js',
    'Nuxt.js',
    'Gatsby',
    'Remix',
  ];

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-300 rounded-lg hover:border-blue-500 transition-colors"
      >
        <span className={selected ? 'text-slate-900' : 'text-slate-500'}>
          {selected || 'Selecione um framework'}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          {/* Search Input */}
          <div className="p-2 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-center text-slate-500 text-sm">
                Nenhum resultado encontrado
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSelected(option);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                  className="w-full flex items-center justify-between px-4 py-2 text-left hover:bg-slate-50 transition-colors"
                >
                  <span>{option}</span>
                  {selected === option && <Check className="w-4 h-4 text-blue-500" />}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### 5. Dropdown com Grupos

```tsx
import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

function GroupedDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const groups = [
    {
      title: 'Frontend',
      items: ['React', 'Vue', 'Angular'],
    },
    {
      title: 'Backend',
      items: ['Node.js', 'Django', 'Laravel'],
    },
    {
      title: 'Database',
      items: ['PostgreSQL', 'MongoDB', 'Redis'],
    },
  ];

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
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-300 rounded-lg hover:border-blue-500 transition-colors"
      >
        <span className={selected ? 'text-slate-900' : 'text-slate-500'}>
          {selected || 'Selecione uma tecnologia'}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {groups.map((group, groupIndex) => (
            <div key={groupIndex}>
              {/* Group Title */}
              <div className="px-4 py-2 bg-slate-50 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {group.title}
                </span>
              </div>

              {/* Group Items */}
              <div className="py-1">
                {group.items.map((item) => (
                  <button
                    key={item}
                    onClick={() => {
                      setSelected(item);
                      setIsOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors ${
                      selected === item ? 'bg-blue-50 text-blue-600' : 'text-slate-700'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 6. Dropdown Multi-Select

```tsx
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, X } from 'lucide-react';

function MultiSelectDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const options = ['React', 'Vue', 'Angular', 'Svelte', 'Next.js'];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOption = (option: string) => {
    setSelected((prev) =>
      prev.includes(option)
        ? prev.filter((item) => item !== option)
        : [...prev, option]
    );
  };

  const removeItem = (item: string) => {
    setSelected((prev) => prev.filter((i) => i !== item));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[42px] flex items-center justify-between px-3 py-2 bg-white border border-slate-300 rounded-lg hover:border-blue-500 transition-colors"
      >
        <div className="flex flex-wrap gap-1 flex-1">
          {selected.length === 0 ? (
            <span className="text-slate-500">Selecione opções...</span>
          ) : (
            selected.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm"
              >
                {item}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeItem(item);
                  }}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 ml-2 transition-transform flex-shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          {options.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                onClick={() => toggleOption(option)}
                className="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-slate-50 transition-colors"
              >
                <div
                  className={`w-5 h-5 border-2 rounded flex items-center justify-center ${
                    isSelected
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-slate-300'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <span className={isSelected ? 'font-medium text-blue-600' : 'text-slate-700'}>
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

---

### 7. Dropdown com Loading State

```tsx
import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

function LoadingDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [options, setOptions] = useState<string[]>([]);
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

  // Simular carregamento de dados
  const loadOptions = async () => {
    setIsLoading(true);
    // Simular API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setOptions(['React', 'Vue', 'Angular', 'Svelte', 'Next.js']);
    setIsLoading(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (options.length === 0) {
      loadOptions();
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-between px-4 py-2 bg-white border border-slate-300 rounded-lg hover:border-blue-500 transition-colors"
      >
        <span className={selected ? 'text-slate-900' : 'text-slate-500'}>
          {selected || 'Selecione uma opção'}
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              <span className="text-slate-600">Carregando opções...</span>
            </div>
          ) : options.length === 0 ? (
            <div className="px-4 py-8 text-center text-slate-500">
              Nenhuma opção disponível
            </div>
          ) : (
            <div className="py-1">
              {options.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    setSelected(option);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

### 8. Animação Personalizada

```tsx
// Adicionar ao index.css ou tailwind.config.js

/* Animações personalizadas */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideUp {
  animation: slideUp 200ms ease-out;
}

.animate-slideDown {
  animation: slideDown 200ms ease-out;
}
```

---

## 🎨 Componentes CSS Utilitários

```css
/* Dropdown Base */
.dropdown-base {
  @apply absolute bg-white rounded-lg shadow-xl border border-slate-200 z-50;
}

/* Dropdown Item */
.dropdown-item {
  @apply w-full px-4 py-2 text-left hover:bg-slate-50 transition-colors;
}

/* Dropdown Item Danger */
.dropdown-item-danger {
  @apply w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 transition-colors;
}

/* Dropdown Divider */
.dropdown-divider {
  @apply border-t border-slate-100 my-1;
}

/* Dropdown Header */
.dropdown-header {
  @apply px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase tracking-wider;
}
```

---

**💡 Dica:** Todos os exemplos acima são totalmente funcionais e podem ser copiados diretamente para o seu projeto!

**🔧 Customização:** Ajuste as cores, tamanhos e animações de acordo com o design system do seu projeto.

**📚 Documentação Completa:** Veja `DROPDOWN_MENUS_SYSTEM.md` para especificações técnicas detalhadas.
