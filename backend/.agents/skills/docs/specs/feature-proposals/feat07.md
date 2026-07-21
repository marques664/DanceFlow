# Feature Proposal 07: Endpoint /health e Centralização de Configuração de API (Railway)

**Status:** Draft / Proposed  
**Data:** 21/07/2026  
**Autor:** Antigravity AI  

---

## 1. Visão Geral

Com a hospedagem do backend realizada na plataforma **Railway**, precisamos padronizar o monitoramento da aplicação e garantir que a URL pública de produção (assim como o ambiente local) seja gerenciada de maneira centralizada e limpa em todas as camadas da aplicação (Backend, Frontend Web e Mobile Flutter), eliminando URLs hardcoded espalhadas pelo código.

---

## 2. Requisitos Funcionais

### 2.1. Endpoint de Health Check (`GET /health`)
* **Rota Pública:** `/health` (sem necessidade de autenticação JWT).
* **Propósito:** Permitir que serviços de monitoramento do Railway e verificações externas chequem a saúde do servidor e do banco de dados.
* **Payload de Resposta (Status 200 OK):**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-07-21T15:00:00.000Z",
    "uptime": 142.5,
    "environment": "production",
    "database": "connected"
  }
  ```
* **Status 503 Service Unavailable:** Retornado caso a conexão com a base de dados falhe.

### 2.2. Centralização de Configuração de URLs

#### A. Backend (Node.js / Express)
* Criar um módulo centralizador `src/config/api.js` (ou `src/config/env.js`) para ler variáveis do `.env` (ex: `PORT`, `CORS_ORIGIN`, `DATABASE_URL`, `JWT_SECRET`).
* Ajustar a regra de CORS em `src/app.js` para aceitar origens dinâmicas via `process.env.CORS_ORIGIN` ou domínios da Railway (`*.up.railway.app`).

#### B. Frontend Web (React + Vite)
* Garantir que `web/src/services/api.js` utilize `import.meta.env.VITE_API_URL` como única fonte da verdade para a URL base da API.

#### C. Mobile (Flutter)
* Em `mobile/lib/services/api_service.dart`, centralizar a `baseUrl` em uma única variável de configuração ajustável por variáveis de ambiente (`String.fromEnvironment('API_URL')`) com fallback padrão para ambiente local.

---

## 3. Arquitetura Proposta

```
[Railway / External Monitor] ---> GET /health ---> [Express app.js] ---> [HealthController] ---> [Prisma DB Ping]
                                                                  |
[Web Client (Vite)] -------------> VITE_API_URL -------------------|
                                                                  |
[Mobile Client (Flutter)] -------> ApiService.baseUrl ------------|
```

---

## 4. Plano de Verificação

1. **Health Check:** Testar `GET /health` localmente e validar o retorno com o status da aplicação e ping do banco de dados.
2. **CORS:** Testar preflight `OPTIONS` e requisições permitidas.
3. **Flutter & Web:** Confirmar que todas as chamadas HTTP consomem estritamente a configuração centralizada em `ApiService` / `api.js`.
