# FP-003: Provisionamento de Escolas & Ativação de Administradora via Convite

Esta proposta de funcionalidade especifica a implementação do fluxo de Onboarding Controlado para novas escolas (tenants) no sistema SaaS do **DanceFlow**, utilizando convites seguros enviados por e-mail em vez de uma página de cadastro pública.

---

## 1. Fluxo de Provisionamento (Cenário de Negócio)

1. **Assinatura/Compra**: O cliente realiza o pagamento do plano em uma landing page externa (usando Stripe, Asaas, etc.).
2. **Criação Automática (Webhook)**: O gateway de pagamento envia um webhook de confirmação de pagamento para o backend do DanceFlow.
3. **Provisionamento do Tenant**: A API do DanceFlow cria um registro de `School` (Escola) e gera um token único e temporário de ativação na tabela `ActivationToken`.
4. **Envio de Convite**: Um e-mail automatizado é enviado para a dona da escola contendo um link exclusivo (ex: `https://app.danceflow.com/ativar?token=xyz123abc`).
5. **Configuração de Senha**: Ao clicar no link, a cliente é direcionada para uma página segura no frontend onde preencherá seu nome e definirá sua senha de acesso. A conta de `User` com cargo `ADMIN` é então ativada.

---

## 2. Modelagem do Banco de Dados (Novas Entidades)

### Tabela: `ActivationToken`
Armazena os tokens gerados durante o provisionamento automático para validar os links de convite enviados por e-mail.

```prisma
model ActivationToken {
  id        String   @id @default(uuid())
  email     String   @unique
  schoolId  String
  school    School   @relation(fields: [schoolId], references: [id], onDelete: Cascade)
  token     String   @unique
  isUsed    Boolean  @default(false)
  expiresAt DateTime
  createdAt DateTime @default(now())
}
```

---

## 3. Endpoints da API (Backend)

### POST `/tenants/provision`
Endpoint restrito (chamado por webhook do gateway ou admin global do SaaS) para provisionar uma nova escola.
- **Payload**:
  ```json
  {
    "schoolName": "Escola de Ballet Copacabana",
    "adminEmail": "diretoria@balletcopa.com"
  }
  ```
- **Comportamento**:
  1. Cria o registro `School` no banco de dados.
  2. Gera um token cryptográfico seguro de 32 bytes de uso único.
  3. Salva o token na tabela `ActivationToken` com validade de 48 horas.
  4. Dispara um serviço de envio de e-mail (ex: via SendGrid, Mailgun) com o link de ativação.

### GET `/tenants/activate?token=...`
Valida se o token de ativação é válido, se não expirou e se já não foi utilizado.
- **Resposta**: Retorna os detalhes da escola e e-mail vinculados para preenchimento da tela no frontend.

### POST `/tenants/activate`
Conclui a criação da administradora e ativação da escola.
- **Payload**:
  ```json
  {
    "token": "xyz123abc",
    "adminName": "Mariana Souza",
    "password": "senhaSegura123"
  }
  ```
- **Comportamento**:
  1. Valida o token novamente.
  2. Cria o registro de usuário administrador (`User` com cargo `ADMIN`) vinculado à escola criada.
  3. Marca o token como `isUsed = true`.
  4. Retorna o token JWT para iniciar a sessão da administradora no sistema.

---

## 4. Telas no Frontend (`web`)

### Tela `/ativar` (Página de Ativação)
- Acessada exclusivamente a partir do link enviado por e-mail.
- Exibe o e-mail da usuária e o nome da escola (carregados via chamada `GET /tenants/activate?token=...`).
- Exibe campos de entrada para **Nome Completo** e **Senha**.
- Após o envio bem-sucedido, armazena o token JWT no `localStorage` e direciona a usuária diretamente para o Dashboard inicial da sua escola.
