# 6. API Overview

## 6.1 Objetivo

Apresentar os principais recursos da API do DanceFlow sem detalhar endpoints, payloads ou contratos neste momento.

## 6.2 Recursos Principais

### /auth

Autenticação, login, validação de sessão e renovação futura de token.

### /users

Gestão de usuários com acesso ao sistema.

### /teachers

Gestão de professoras principais e secundárias.

### /students

Gestão de alunas, status, plano e dados administrativos.

### /guardians

Gestão de responsáveis vinculados às alunas.

### /modalities

Gestão de modalidades, como Ballet, Jazz, Sapateado e Circo.

### /classes

Gestão de turmas, horários, professoras vinculadas e alunas vinculadas.

### /lessons

Gestão de aulas regulares, experimentais e particulares.

### /attendance

Registro, edição e consulta de frequência.

### /reports

Geração e exportação de relatórios.

### /dashboard

Dados agregados para gráficos, métricas e alertas administrativos.

### /audit-logs

Armazenamento interno de logs de auditoria. No MVP, não precisa haver tela de consulta.

## 6.3 Diretrizes

- A API será REST.
- Dados devem ser enviados e recebidos em JSON.
- Todas as rotas protegidas devem exigir JWT.
- Permissões devem ser validadas no backend.
- Detalhes de endpoints serão definidos durante o desenvolvimento.
