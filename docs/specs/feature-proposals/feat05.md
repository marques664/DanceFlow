# FP-005: Limpeza do Sistema & Painel Admin de Convites Manuais

Esta proposta especifica as tarefas de limpeza de código (refatoração de logs e remoção de redundâncias) e a implementação de um fluxo de Convite Manual no painel do administrador para testes e fidelização de clientes.

---

## 1. Limpeza Geral e Estabilização de Logs

Para deixar o sistema pronto para produção e homologação:
- **Refatoração de Logs**: Substituir todos os `console.log` e `console.error` espalhados nos controllers e services do backend pela chamada ao utilitário de logs estruturados `logger` (ex: `logger.info`, `logger.error`), garantindo que o contexto (`requestId`, `schoolId`) seja impresso.
- **Remoção de Arquivos Temporários**: Eliminar scripts de rascunho de banco de dados (`scratch-query.js`) e endpoints de testes não utilizados do ambiente de produção.
- **Tratamento de Exceções**: Garantir que todos os blocos `try/catch` de controllers repassem os erros para o Express via `next(err)` para capturar logs detalhados e retornar mensagens limpas para as usuárias.

---

## 2. Integração com Provedor de E-mail Real

Substituir o mock de e-mails (`email.js`) por um provedor real em ambiente de produção utilizando o SendGrid ou Nodemailer (via SMTP).

### Requisitos:
- **Variáveis de Ambiente**:
  - `SMTP_HOST`: Host do servidor SMTP (ex: `smtp.sendgrid.net`).
  - `SMTP_PORT`: Porta segura do SMTP (ex: `587` ou `465`).
  - `SMTP_USER`: Usuário de autenticação.
  - `SMTP_PASS`: Senha/API Key do provedor.
  - `EMAIL_FROM`: E-mail remetente verificado (ex: `nao-responder@danceflow.com`).
- **Implementação**:
  - Atualizar `backend/src/shared/services/email.js` para usar a biblioteca `nodemailer` caso essas variáveis estejam configuradas, mantendo o fallback de logs em desenvolvimento.

---

## 3. Painel Administrativo de Convites Manuais (Fidelização e Testes)

Para permitir que o dono do SaaS crie contas manualmente para escolas parceiras, envie convites individuais e compartilhe os links diretamente em canais de atendimento (WhatsApp, Instagram, etc.), implementaremos uma interface administrativa de provisionamento.

### Fluxo de Geração de Convites:
1. O administrador do SaaS acessa a rota restrita do sistema (ex: `/admin/escolas`).
2. Preenche um formulário contendo:
   - **Nome da Escola** (ex: *Studio de Dança Ritmo*)
   - **E-mail de Contato da Administradora** (ex: *contato@studioritmo.com*)
3. O sistema chama o endpoint `POST /tenants/provision` para criar a escola e o token de ativação.
4. O backend retorna a URL de ativação gerada no corpo da resposta:
   ```json
   {
     "status": "success",
     "data": {
       "schoolId": "uuid...",
       "slug": "studio-de-danca-ritmo",
       "activationUrl": "https://ritmo.danceflow.com/ativar?token=xyz123"
     }
   }
   ```
5. A interface administrativa exibe um modal de sucesso com:
   - Um botão **"Copiar Link de Ativação"** (copia a URL para o clipboard).
   - Um botão **"Enviar por WhatsApp"** que abre o WhatsApp Web com um modelo de mensagem pré-formatada:
     > *"Olá! Sua conta no DanceFlow está pronta para uso. Clique no link exclusivo abaixo para definir sua senha de acesso e começar a usar o sistema: {activationUrl}"*
   - Uma indicação visual de que o convite também foi enviado por e-mail automaticamente.
