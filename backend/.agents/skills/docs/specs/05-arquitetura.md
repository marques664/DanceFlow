# 5. Arquitetura

## 5.1 Visão Geral

O DanceFlow será composto por três aplicações principais:

- Backend centralizado.
- Painel Administrativo Web.
- Aplicativo Mobile para professoras.

Todas as aplicações usarão uma API REST e um banco PostgreSQL centralizado.

## 5.2 Backend

Tecnologias:

- Node.js.
- Express.
- PostgreSQL.
- JWT.

Responsabilidades:

- Expor API REST.
- Aplicar regras de negócio.
- Gerenciar autenticação e autorização.
- Persistir dados.
- Registrar logs de auditoria.
- Gerar dados para dashboards e relatórios.

Arquitetura sugerida:

- API modular por domínio.
- Separação entre rotas, controllers, services e repositórios.
- Validação de entrada antes da camada de serviço.
- Regras de negócio concentradas em services.

## 5.3 Frontend Web

Tecnologia:

- React.

Responsabilidades:

- Interface administrativa.
- Gestão de cadastros.
- Visualização de métricas.
- Alertas de baixa frequência.
- Exportação de relatórios.

## 5.4 Aplicativo Mobile

Tecnologia:

- Flutter.

Responsabilidades:

- Login da professora.
- Visualização de aulas próprias.
- Registro de frequência.
- Registro de observações.
- Visualização de alunas experimentais.
- Edição de frequência após a aula.

## 5.5 Banco de Dados

Tecnologia:

- PostgreSQL.

Diretrizes:

- Banco centralizado.
- Modelagem relacional.
- Exclusão lógica para registros com histórico.
- Preparação conceitual para multi-escola.

## 5.6 Autenticação

- Autenticação via JWT.
- Login com e-mail e senha.
- Controle de acesso por papel.
- Papéis iniciais: administrador e professora.

## 5.7 Comunicação

- Frontend Web consome a API REST.
- Aplicativo Mobile consome a API REST.
- Backend acessa o PostgreSQL.
- Não haverá comunicação direta entre Web, Mobile e banco.

## 5.8 Decisões Arquiteturais

- Monólito modular no backend para o MVP.
- REST API em vez de GraphQL.
- PostgreSQL como banco principal.
- JWT para autenticação.
- Estrutura preparada para futura evolução SaaS, sem implementar complexidade desnecessária agora.
