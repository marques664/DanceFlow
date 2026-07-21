# 9. Development Guidelines

## 9.1 Estrutura de Pastas

Estrutura sugerida do repositório:

```text
docs/
  specs/
backend/
  src/
    modules/
    shared/
    config/
    database/
    middlewares/
    server.ts
web/
  src/
    components/
    pages/
    services/
    hooks/
    styles/
mobile/
  lib/
    features/
    shared/
```

## 9.2 Padrão de Nomenclatura

- Pastas em `kebab-case` ou `camelCase`, conforme padrão da tecnologia.
- Classes em `PascalCase`.
- Funções e variáveis em `camelCase`.
- Constantes em `UPPER_SNAKE_CASE` quando forem globais.
- Arquivos React em `PascalCase` quando exportarem componente.
- Recursos da API em inglês e no plural.

## 9.3 Convenções de Código

- Código simples e legível.
- Separar responsabilidades por camada.
- Evitar lógica de negócio em controllers.
- Validar entradas antes de executar regras de negócio.
- Centralizar regras de negócio em services.
- Usar nomes explícitos.
- Evitar abstrações prematuras.

## 9.4 Arquitetura Utilizada

Backend:

- Monólito modular.
- Express.
- REST API.
- Controllers para HTTP.
- Services para regras de negócio.
- Repositories para acesso a dados.

Frontend Web:

- React.
- Organização por páginas e componentes reutilizáveis.
- Services para comunicação com API.

Mobile:

- Flutter.
- Organização por features.
- Services para comunicação com API.

## 9.5 Estratégia de Git

- Branch principal: `main`.
- Branches de desenvolvimento por funcionalidade.
- Nome de branch sugerido:
  - `feature/login`
  - `feature/students`
  - `fix/attendance-save`
  - `docs/product-vision`

## 9.6 Convenção de Commits

Usar Conventional Commits:

- `feat:` nova funcionalidade.
- `fix:` correção.
- `docs:` documentação.
- `refactor:` refatoração sem mudança funcional.
- `test:` testes.
- `chore:` tarefas de manutenção.

Exemplos:

```text
feat: add student registration
fix: prevent duplicate attendance records
docs: update product vision
```

## 9.7 Boas Práticas

- Implementar primeiro o fluxo principal do MVP.
- Preferir soluções simples.
- Manter documentação atualizada quando decisões mudarem.
- Não criar funcionalidades fora do backlog sem revisar a documentação.
- Proteger dados pessoais.
- Registrar logs para ações críticas.
- Tratar exclusões com histórico como inativação lógica.
- Validar permissões no backend, não apenas na interface.

## 9.8 Como Implementar Novas Funcionalidades

1. Verificar se a funcionalidade está no backlog.
2. Confirmar qual objetivo do produto ela atende.
3. Identificar entidades e regras de negócio impactadas.
4. Implementar primeiro no backend.
5. Criar ou ajustar interface web/mobile.
6. Validar permissões.
7. Testar o fluxo principal.
8. Atualizar documentação se houver mudança de regra ou escopo.

## 9.9 Diretriz Para Uso de IA

Toda IA que atuar no projeto deve:

- Ler os documentos em `docs/specs/` antes de propor mudanças.
- Priorizar simplicidade e facilidade de uso.
- Não adicionar escopo novo sem registrar no backlog.
- Não implementar regras de negócio que contradigam a documentação.
- Destacar suposições quando uma decisão não estiver documentada.
