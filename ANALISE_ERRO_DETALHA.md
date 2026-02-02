# Análise Detalhada do Erro

## Cenário: Trocar Departamento de um Contato Múltiplas Vezes

### ❌ ANTES (com constraint UNIQUE problemático)

```
Contato: João (contact_id = 'abc-123')

1️⃣ PRIMEIRA TRANSFERÊNCIA
   Recepção → Departamento A
   
   INSERT INTO transferencias (
     contact_id = 'abc-123',
     departamento_origem_id = NULL,
     departamento_destino_id = 'dept-A',
     position = 1  ← HARDCODED (problema!)
   )
   ✅ Sucesso: (contact_id='abc-123', position=1) é único


2️⃣ SEGUNDA TRANSFERÊNCIA
   Departamento A → Departamento B
   
   INSERT INTO transferencias (
     contact_id = 'abc-123',
     departamento_origem_id = 'dept-A',
     departamento_destino_id = 'dept-B',
     position = 1  ← MESMO VALOR! 😱
   )
   ❌ ERRO: duplicate key value violates unique constraint
            "transferencias_contact_position_ux" (contact_id, position)
   
   Porque: ('abc-123', 1) JÁ EXISTE!


3️⃣ TERCEIRA TRANSFERÊNCIA
   ❌ NUNCA EXECUTA (usuário volta com erro)
```

### ✅ DEPOIS (com trigger auto-incremento)

```
Contato: João (contact_id = 'abc-123')

1️⃣ PRIMEIRA TRANSFERÊNCIA
   Recepção → Departamento A
   
   INSERT INTO transferencias (
     contact_id = 'abc-123',
     departamento_origem_id = NULL,
     departamento_destino_id = 'dept-A',
     position = NULL  ← TRIGGER CALCULA
   )
   
   TRIGGER executa:
   SELECT COALESCE(MAX(position), 0) + 1 FROM transferencias
   WHERE contact_id = 'abc-123'
   → 0 + 1 = 1
   
   INSERT executado com position = 1
   ✅ Sucesso


2️⃣ SEGUNDA TRANSFERÊNCIA
   Departamento A → Departamento B
   
   INSERT INTO transferencias (
     contact_id = 'abc-123',
     departamento_origem_id = 'dept-A',
     departamento_destino_id = 'dept-B',
     position = NULL  ← TRIGGER CALCULA
   )
   
   TRIGGER executa:
   SELECT COALESCE(MAX(position), 0) + 1 FROM transferencias
   WHERE contact_id = 'abc-123'
   → 1 + 1 = 2
   
   INSERT executado com position = 2
   ✅ Sucesso


3️⃣ TERCEIRA TRANSFERÊNCIA
   Departamento B → Departamento C
   
   INSERT INTO transferencias (
     contact_id = 'abc-123',
     departamento_origem_id = 'dept-B',
     departamento_destino_id = 'dept-C',
     position = NULL  ← TRIGGER CALCULA
   )
   
   TRIGGER executa:
   SELECT COALESCE(MAX(position), 0) + 1 FROM transferencias
   WHERE contact_id = 'abc-123'
   → 2 + 1 = 3
   
   INSERT executado com position = 3
   ✅ Sucesso

Resultado Final:
┌─────────────────┬─────────────────┬──────────────┬─────────────┬──────────┐
│   contact_id    │ departamento_ori │departamento_d│  position   │ created_ │
│                 │     gem_id      │ estino_id    │             │   at     │
├─────────────────┼─────────────────┼──────────────┼─────────────┼──────────┤
│ abc-123         │ NULL            │ dept-A       │ 1           │ 11:00    │
│ abc-123         │ dept-A          │ dept-B       │ 2           │ 11:05    │
│ abc-123         │ dept-B          │ dept-C       │ 3           │ 11:10    │
└─────────────────┴─────────────────┴──────────────┴─────────────┴──────────┘

✅ Histórico completo mantido
✅ Posições incrementais únicas
✅ Sem erro de constraint
```

## Comparação Visual

### Estrutura de Tabela

```
┌─ ANTES (ERRADO) ─────────────────────┐
│ CREATE TABLE transferencias (        │
│   id BIGINT PRIMARY KEY,             │
│   contact_id UUID NOT NULL,          │
│   position BIGINT,                   │
│   ...                                │
│   UNIQUE(contact_id, position) ❌    │
│ )                                    │
│                                      │
│ Problema: Força position ser único   │
│ por contact, mas ninguém incrementa  │
│ automático, causando collision       │
└──────────────────────────────────────┘

┌─ DEPOIS (CORRETO) ───────────────────┐
│ CREATE TABLE transferencias (        │
│   id BIGINT PRIMARY KEY,             │
│   contact_id UUID NOT NULL,          │
│   position BIGINT DEFAULT 1,         │
│   ...                                │
│   -- SEM CONSTRAINT UNIQUE ✅        │
│ )                                    │
│                                      │
│ + TRIGGER auto_increment que:        │
│   IF position IS NULL THEN           │
│     position = MAX(pos) + 1          │
│   END IF;                            │
│                                      │
│ Resultado: Auto-incremento garante   │
│ cada novo registro tem posição nova  │
└──────────────────────────────────────┘
```

## Código que Muda o Comportamento

### Função no Banco (PostgreSQL Trigger)

```sql
-- TRIGGER FUNCTION (automático, roda antes de INSERT)
CREATE OR REPLACE FUNCTION auto_increment_transfer_position()
RETURNS TRIGGER AS $$
BEGIN
  -- Se position não foi informada (NULL), calcula automático
  IF NEW.position IS NULL THEN
    -- Pega o maior position existente para este contact_id
    -- E soma 1 (vira próximo sequencial)
    SELECT COALESCE(MAX(position), 0) + 1 INTO NEW.position
    FROM public.transferencias
    WHERE contact_id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Registra o trigger para rodar ANTES de cada INSERT
CREATE TRIGGER trg_auto_increment_transfer_position
  BEFORE INSERT ON public.transferencias
  FOR EACH ROW
  EXECUTE FUNCTION auto_increment_transfer_position();
```

### Código Frontend (sem mudanças)

```typescript
// CompanyDashboard.tsx - já funciona corretamente!
const resultadoTransf = await registrarTransferencia({
  api_key: company.api_key,
  contact_id: contactId,
  departamento_origem_id: oldDepartmentId,  // pode ser NULL
  departamento_destino_id: newDepartmentId  // pode ser NULL
});
// RPC insere com position = NULL
// Trigger automático calcula incremento ✅
```

## Validação Prática

### Teste 1: Verificar Constraint Removido

```sql
-- Executar:
SELECT constraint_name FROM information_schema.table_constraints
WHERE table_name = 'transferencias' AND constraint_type = 'UNIQUE';

-- Resultado esperado:
-- (nenhuma linha com position)
```

### Teste 2: Verificar Trigger Criado

```sql
-- Executar:
SELECT trigger_name FROM information_schema.triggers
WHERE trigger_name = 'trg_auto_increment_transfer_position';

-- Resultado esperado:
-- trg_auto_increment_transfer_position | BEFORE INSERT
```

### Teste 3: Verificar Histórico com Posições

```sql
-- Executar:
SELECT contact_id, COUNT(*) as transfers, MIN(position), MAX(position)
FROM public.transferencias
GROUP BY contact_id
ORDER BY transfers DESC;

-- Resultado esperado:
-- contact_id | transfers | min | max
-- 'abc-123'  |    3      |  1  |  3   ✅
-- 'def-456'  |    2      |  1  |  2   ✅
```

## Resumo da Solução

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Constraint** | UNIQUE(contact_id, position) ❌ | Nenhum ✅ |
| **Position** | Hardcoded = 1 sempre | Auto-incremento via trigger |
| **1ª Transferência** | ✅ Funciona | ✅ position=1 |
| **2ª Transferência** | ❌ Erro constraint | ✅ position=2 |
| **3ª Transferência** | ❌ Não executa | ✅ position=3 |
| **Histórico** | Perdido na 2ª | Completo e sequencial |

## Deploy

```bash
# Aplicar a migration
supabase db push

# Verificar
supabase db execute supabase/TEST_POSITION_FIX.sql

# Testar no app
# 1. Abrir CompanyDashboard
# 2. Trocar departamento 3x do mesmo contato
# 3. Nenhum erro = ✅ Sucesso!
```
