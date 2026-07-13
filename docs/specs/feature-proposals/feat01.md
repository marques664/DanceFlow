# FP-001 — Matrículas com Horários Flexíveis

**Status:** Proposta

**Prioridade:** Alta

**Origem:** Relatos da escola piloto

**Data:** XX/XX/2026

---

# 1. Contexto

Durante a utilização do DanceFlow pela escola piloto, foi identificado que o modelo atual de turmas não representa corretamente a realidade da escola.

Hoje o sistema assume que toda aluna matriculada em uma turma participa automaticamente de todos os horários daquela turma.

Na prática, isso nem sempre acontece.

---

# 2. Problema Identificado

Foram observados dois cenários reais.

## Cenário 1

Existem alunas que frequentam apenas um dos encontros semanais da turma.

Exemplo:

Turma Baby Ballet

* Quinta-feira 19:00
* Sábado 09:00

Algumas alunas participam apenas da aula de quinta.

Outras participam apenas da aula de sábado.

Outras frequentam ambos os horários.

Atualmente o sistema não consegue representar essa situação.

---

## Cenário 2

Uma turma não necessariamente possui dois encontros no mesmo horário.

Exemplo:

Turma Intermediário

Quinta-feira — 19:00

Sábado — 09:00

O modelo atual pressupõe horários iguais, o que não corresponde à realidade.

---

# 3. Objetivo da Feature

Permitir que cada matrícula defina exatamente quais encontros da turma a aluna frequenta.

A frequência deverá ser registrada apenas para os encontros em que a aluna estiver matriculada.

---

# 4. Regras de Negócio

RN-001

Uma turma poderá possuir um ou mais encontros semanais.

RN-002

Cada encontro possuirá seu próprio:

* dia da semana;
* horário de início;
* horário de término.

RN-003

Durante a matrícula, a administração poderá selecionar em quais encontros daquela turma a aluna participará.

RN-004

Uma aluna poderá participar de:

* apenas um encontro;
* vários encontros;
* todos os encontros da turma.

RN-005

A chamada exibirá apenas as alunas matriculadas naquele encontro específico.

---

# 5. Impacto Esperado

Módulos afetados:

* Cadastro de Turmas
* Matrículas
* Frequência
* Aplicativo Mobile
* Relatórios

---

# 6. Possível Alteração no Modelo de Domínio

Hoje

Turma

↓

Aluna

Proposto

Turma

↓

Encontro da Turma

↓

Matrícula

↓

Aluna

Essa estrutura representa melhor a realidade da escola.

---

# 7. Benefícios

* Representa corretamente o funcionamento da escola.
* Elimina erros de frequência.
* Permite expansão para turmas com qualquer quantidade de encontros.
* Aumenta a flexibilidade do sistema.

---

# 8. Critérios de Aceitação

* Deve ser possível cadastrar múltiplos encontros para uma mesma turma.
* Cada encontro deve possuir dia e horário próprios.
* A matrícula deve permitir selecionar os encontros desejados.
* A chamada deve listar apenas as alunas daquele encontro.
* Os relatórios de frequência devem considerar apenas os encontros vinculados à matrícula.

---

# 9. Observações

Esta necessidade surgiu durante a validação da escola piloto e substitui a premissa inicial de que todas as alunas frequentam todos os encontros de uma turma.
