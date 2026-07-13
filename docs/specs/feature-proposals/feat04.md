# FP-004: Refatoração de URLs & Subdomínios por Escola (Tenant Subdomains)

Esta proposta de funcionalidade especifica a refatoração das URLs do sistema **DanceFlow** para torná-las amigáveis, semânticas e profissionais, preparando a plataforma para o modelo SaaS com subdomínios exclusivos por escola (ex: `escola.danceflow.com`).

---

## 1. Estrutura de Subdomínios por Tenant

Em vez de usar uma URL única global (como `app.danceflow.com`) onde a usuária precisa selecionar ou ter o ID da escola embutido, utilizaremos subdomínios dinâmicos. Cada escola contratante terá seu próprio endereço de acesso.

### Exemplos de URLs:
- **Escola A (Ballet Copacabana)**: `https://copacabana.danceflow.com/`
- **Escola B (Jazz Central)**: `https://jazzcentral.danceflow.com/`
- **Portal de Vendas/Landing Page**: `https://danceflow.com/`
- **Painel de Ativação Geral**: `https://setup.danceflow.com/`

---

## 2. Implementação no Frontend (`web`)

O frontend em React detectará o subdomínio da escola acessada diretamente pelo objeto global `window.location`.

### Mecanismo de Identificação:
```javascript
// Exemplo de helper para extrair o subdomínio (slug do tenant)
export function getTenantSlug() {
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // Se estiver em localhost (ex: copacabana.localhost) ou produção
  if (parts.length > 1 && parts[0] !== 'www' && parts[0] !== 'app') {
    return parts[0]; // Retorna 'copacabana'
  }
  return null; // Acesso ao domínio principal
}
```

### Comportamento do Frontend:
1. Ao carregar qualquer página, o React extrai o `slug` do tenant.
2. Faz uma requisição inicial leve para a API: `GET /tenants/info?slug=copacabana` para obter informações visuais da escola (Nome, Logo, Cores personalizadas).
3. Se o subdomínio não existir, redireciona para uma página de erro 404 personalizada ("Escola não encontrada").
4. A tela de login exibirá a marca da escola solicitada, oferecendo uma experiência sob medida (*white-label*).

---

## 3. Implementação no Backend (`backend`)

O backend Express interceptará as requisições e identificará qual escola está realizando a chamada a partir do subdomínio de origem.

### Middleware de Identificação de Tenant (`tenantSelector`):
Em vez de enviar o `schoolId` no corpo de todas as requisições ou confiar apenas no JWT (o que impede telas de login personalizadas por escola antes da autenticação), o backend usará o cabeçalho `X-Tenant-Slug` ou inspecionará o header `Origin`.

```javascript
// Middleware no backend
async function tenantSelector(req, res, next) {
  const tenantSlug = req.headers['x-tenant-slug'] || req.subdomains[0];
  
  if (!tenantSlug) {
    return next(); // Prossegue sem tenant (rotas públicas/globais)
  }

  const school = await prisma.school.findFirst({
    where: { slug: tenantSlug, isActive: true }
  });

  if (!school) {
    return res.status(404).json({ status: "error", message: "School not found." });
  }

  req.schoolId = school.id;
  req.school = school;
  next();
}
```

---

## 4. Refatoração de Rotas Semânticas (URLs Amigáveis)

Para deixar as rotas do painel mais limpas, profissionais e escritas em português (já que o público final de operação no Brasil prefere termos familiares), refatoraremos as URLs internas do sistema no roteador do frontend.

### Tabela de De/Para das URLs do Painel:

| Função | Rota Atual (Técnica) | Nova Rota Amigável |
| :--- | :--- | :--- |
| Login | `/login` | `/entrar` |
| Painel Inicial | `/` | `/painel` ou `/inicio` |
| Gestão de Alunas | `/students` | `/alunas` |
| Gestão de Turmas | `/classes` | `/turmas` |
| Gestão de Modalidades | `/modalities` | `/modalidades` |
| Diário de Chamadas | `/attendance` | `/chamadas` ou `/presenca` |
| Relatórios | `/reports` | `/relatorios` |
| Cadastro de Professoras | `/teachers` | `/professoras` |
| Ativação de Nova Conta | `/setup-admin` | `/ativar-conta` |

### Exemplo de URL de Recurso Interno:
- **Antes**: `https://app.danceflow.com/classes/d5392b8b2486`
- **Depois (SaaS Amigável)**: `https://copacabana.danceflow.com/turmas/d5392b8b2486`
