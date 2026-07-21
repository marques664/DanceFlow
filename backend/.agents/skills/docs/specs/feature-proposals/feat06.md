# FP-006: Edição de Alunas & Gerenciamento de Vínculo de Turmas

Esta proposta especifica a implementação da funcionalidade de edição de dados cadastrais das alunas no painel do administrador, incluindo a habilidade de vinculá-las a novas turmas ou removê-las de turmas existentes.

---

## 1. Visão Geral

Atualmente, o sistema permite o cadastro completo de alunas (com planos, responsáveis e vínculo a turmas/horários específicos) e a inativação de matrículas. No entanto, não há suporte para a edição de informações cadastrais ou para a movimentação de turmas (por exemplo, remover uma aluna de uma turma específica sem inativar seu cadastro completo).

Esta funcionalidade adicionará um modal de edição na listagem de alunas, permitindo alterar seus dados e ajustar de forma flexível as turmas contratadas.

---

## 2. Requisitos de Backend

### 2.1. Novo Endpoint: `PUT /students/:id`
* **Permissões:** Restrito a usuários administradores (`ADMIN`).
* **Isolamento de Tenant:** O backend deve garantir que a aluna pertence à escola (`schoolId`) do usuário autenticado antes de processar a atualização.
* **Corpo da Requisição (Payload):**
  ```json
  {
    "name": "Mariana Souza Editado",
    "birthDate": "2015-05-20T00:00:00.000Z",
    "phone": "(21) 98888-7777",
    "notes": "Observações sobre a aluna",
    "plan": "Mensal",
    "isActive": true,
    "guardians": [
      {
        "name": "Ana Souza",
        "phone": "(21) 97777-6666",
        "email": "ana@email.com",
        "kinship": "Mãe"
      }
    ],
    "classes": [
      {
        "classId": "turma-uuid-1",
        "scheduleIds": ["horario-uuid-1", "horario-uuid-2"]
      }
    ]
  }
  ```

### 2.2. Lógica do Serviço de Atualização (`StudentService.update`)
* **Dados Básicos:** Atualizar as colunas `name`, `birthDate`, `phone`, `notes` e `plan` do modelo `Student`.
* **Gerenciamento de Responsáveis:**
  - Buscar os responsáveis vinculados atuais.
  - Para cada responsável no payload, criar ou atualizar o registro na tabela `Guardian` e `StudentGuardian`.
  - Remover associações antigas caso tenham sido retiradas.
* **Gerenciamento de Turmas (`ClassStudent`):**
  - Obter as turmas às quais a aluna está atualmente associada.
  - Se uma turma atual não constar no novo array `classes`, **deletar** o registro `ClassStudent` correspondente (removendo a aluna daquela turma).
  - Para turmas mantidas ou novas, atualizar a lista de horários (`ClassSchedule` many-to-many mapping) vinculados.
* **Log de Auditoria:**
  - Registrar no banco a ação de auditoria `UPDATE_STUDENT` contendo o ID e o nome atualizado da aluna.

---

## 3. Requisitos de Frontend

### 3.1. Interface de Edição em `Students.jsx`
* Adicionar um ícone de edição (lápis) ao lado de cada aluna na listagem.
* Ao clicar, abrir um modal de formulário preenchido com os dados atuais da aluna (incluindo dados do responsável e suas turmas atuais).

### 3.2. Gerenciamento Visual de Turmas no Modal
* Exibir a lista de turmas que a aluna frequenta.
* Ao lado de cada turma, incluir um botão de **"Desvincular"** ou **"Remover da Turma"**.
* Exibir a opção para associar a aluna a novas turmas da escola com caixas de seleção dinâmica para os horários de aula específicos.

---

## 4. Plano de Verificação

### Testes de Integração (API)
* Validar que chamadas `PUT /students/:id` com turmas reduzidas apagam os registros em `ClassStudent` e removem a aluna da frequência das aulas futuras.
* Validar o bloqueio de edição para alunas que pertencem a outra escola (cross-tenant check).
