# Correções de Autorização e Segurança

## Problema Identificado

O erro "non-2xx status code" (403 Forbidden) acontecia porque:

1. A Edge Function `create-company` verifica se o usuário está cadastrado na tabela `super_admins`
2. Apenas o usuário `nexla@nexla.com.br` estava cadastrado
3. Outros usuários não conseguiam criar empresas

## Solução Aplicada

### 1. Validação no Frontend
Adicionado check preventivo no `SuperAdminDashboard.tsx`:
- Verifica se o usuário está na tabela `super_admins` ANTES de chamar a Edge Function
- Exibe mensagem clara: "Você não está cadastrado como super admin"
- Evita chamadas desnecessárias à Edge Function

### 2. Super Admins Cadastrados
Adicionados 4 usuários como super admins:
- ✅ `teste@gmail.com` (ID: 3e6b8a6c-6df0-44fd-8bb7-acd6919b4c76)
- ✅ `robloxcanal40@gmail.com` (ID: 4d107360-124f-4e37-a6a8-72dac0d46192)
- ✅ `akira.vha@gmail.com` (ID: c4ceb895-a3c5-4a24-bcb2-1c456a236926)
- ✅ `nexla@nexla.com.br` (ID: 832c651b-bcf1-452d-b3b9-68e50b2af491)

### 3. Script de Gerenciamento
Criado arquivo `ADD_SUPER_ADMIN.sql` para facilitar:
- Adicionar novos super admins
- Remover super admins existentes
- Listar todos os super admins

## Como Adicionar Novos Super Admins

### Opção 1: Via SQL (Recomendado)

```sql
-- 1. Ver todos os usuários
SELECT id, email, created_at
FROM auth.users
ORDER BY created_at DESC;

-- 2. Adicionar como super admin (substitua o ID)
INSERT INTO super_admins (user_id)
VALUES ('ID_DO_USUARIO_AQUI')
ON CONFLICT (user_id) DO NOTHING;

-- 3. Verificar
SELECT sa.user_id, au.email
FROM super_admins sa
JOIN auth.users au ON sa.user_id = au.id;
```

### Opção 2: Via Edge Function

Use a Edge Function `create-super-admin` (se disponível):

```javascript
const response = await supabase.functions.invoke("create-super-admin", {
  body: {
    email: "novo-admin@example.com",
    password: "senhaSegura123"
  }
});
```

## Fluxo de Autorização

```
Usuario faz login
    ↓
AuthContext verifica super_admins
    ↓
isSuperAdmin = true → Acessa SuperAdminDashboard
    ↓
Tenta criar empresa
    ↓
Frontend verifica super_admins (validação extra)
    ↓
Edge Function verifica super_admins (segurança)
    ↓
Empresa criada com sucesso
```

## Segurança

### RLS (Row Level Security)
A tabela `super_admins` tem RLS habilitado:
- Super admins podem ler todos os registros
- Super admins podem inserir novos super admins
- Super admins podem deletar super admins

### Edge Functions
Todas as Edge Functions de gerenciamento verificam:
1. Token JWT válido
2. Usuário autenticado existe
3. Usuário está na tabela `super_admins`

## Troubleshooting

### Erro: "Access denied"
**Causa:** Usuário não está cadastrado como super admin

**Solução:**
1. Verifique se está logado com o usuário correto
2. Execute o SQL para adicionar o usuário à tabela `super_admins`
3. Faça logout e login novamente

### Erro: "Missing authorization header"
**Causa:** Token não está sendo enviado

**Solução:**
1. Faça logout
2. Limpe o cache do navegador
3. Faça login novamente

### Erro: "Invalid token"
**Causa:** Token expirou ou é inválido

**Solução:**
1. Faça logout
2. Faça login novamente

## Verificações Implementadas

- ✅ Super admin verificado pela tabela `super_admins` (não pelo campo `is_super_admin`)
- ✅ Validação no frontend antes de chamar Edge Function
- ✅ Validação na Edge Function para segurança
- ✅ Mensagens de erro claras
- ✅ Logs detalhados para debug
- ✅ Script SQL para gerenciamento fácil
