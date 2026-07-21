# 1. Product Vision

## 1.1 Problema

O **DanceFlow** resolve a falta de centralização e praticidade na gestão operacional de escolas de ballet.

Hoje, a escola piloto utiliza principalmente papel, WhatsApp e planilhas simples para controlar frequência, turmas e informações administrativas. Esse processo gera retrabalho, risco de erro, perda de histórico e dificuldade para entender métricas importantes, como faltas por aluna e frequência por turma.

Durante as aulas, professoras ficam sobrecarregadas e precisam registrar presença de forma rápida, sem interromper o andamento da aula.

## 1.2 Público-Alvo

Usuários iniciais:

- Administrador.
- Professora.
- Professora secundária.

Usuários futuros:

- Responsáveis.
- Alunas.

O produto será validado inicialmente em uma escola piloto de ballet, mas a arquitetura deverá permitir expansão para outras modalidades de dança e, futuramente, para um modelo SaaS.

## 1.3 Objetivos Gerais

- Centralizar informações da escola em uma única plataforma.
- Eliminar listas de presença em papel.
- Reduzir uso de planilhas.
- Reduzir dependência de WhatsApp para comunicação interna.
- Tornar o registro de presença extremamente rápido.
- Facilitar o gerenciamento de alunas, professoras, turmas e aulas.
- Permitir acompanhamento da frequência das alunas.
- Criar uma base simples, robusta e evolutiva para futuras versões.

## 1.4 Escopo Inicial

O MVP será composto por:

- Painel Administrativo Web.
- Aplicativo Mobile para professoras.
- Backend centralizado.
- Banco de dados PostgreSQL.
- Autenticação com JWT.
- API REST.

Funcionalidades principais do MVP:

- Login.
- Cadastro e gestão de professoras.
- Cadastro e gestão de alunas.
- Cadastro e gestão de responsáveis sem CPF.
- Cadastro e gestão de turmas.
- Cadastro e gestão de modalidades.
- Criação de aulas a partir de dia e horário definidos.
- Registro de frequência.
- Edição de frequência pela professora após a aula.
- Aulas experimentais vinculadas a turmas.
- Aulas particulares recorrentes quando houver plano fechado.
- Visualização de métricas e gráficos administrativos.
- Alertas visuais de baixa frequência no painel administrativo.
- Exportação inicial em PDF com relação de aulas, alunas e professoras.
- Logs de auditoria armazenados internamente.

## 1.5 Diferenciais

- Produto focado no contexto real de escolas de ballet e dança.
- Experiência mobile otimizada para professoras durante a aula.
- Registro de presença simples e rápido.
- Centralização de informações que hoje ficam espalhadas.
- Preparação para expansão futura para SaaS.
- Documentação orientada por Spec-Driven Development, servindo como contexto para IA e desenvolvimento incremental.

## 1.6 Limitações do MVP

Ficam fora do MVP:

- Controle financeiro.
- Pagamentos.
- Mensalidades.
- App ou acesso para responsáveis.
- App ou acesso para alunas.
- Comunicação com responsáveis.
- Integração com WhatsApp.
- Modo offline.
- Fotos ou imagens de alunas.
- CPF de responsáveis.
- Personalização visual individual por escola.

Personalização por escola é uma evolução futura desejável, inicialmente limitada a identidade visual básica como logo e cores.

## 1.7 Suposições

- Exclusões de registros com histórico serão tratadas como inativação lógica.
- O MVP será online.
- Professoras visualizarão apenas suas próprias aulas.
- Professoras secundárias terão as mesmas permissões operacionais da professora principal.
