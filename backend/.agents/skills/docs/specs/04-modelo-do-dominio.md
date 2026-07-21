# 4. Modelo do Domínio

## 4.1 Entidades

### Escola

Representa a escola ou studio que utiliza o sistema. No MVP haverá uma escola piloto, mas a entidade deve existir conceitualmente para permitir SaaS no futuro.

### Usuário

Representa uma pessoa com acesso ao sistema. Pode assumir papéis como administrador ou professora.

### Administrador

Usuário responsável pela gestão geral da escola, cadastros, turmas, aulas, relatórios e métricas.

### Professora

Usuária responsável por visualizar suas aulas e registrar frequência. Pode atuar como professora principal ou secundária em uma turma.

### Aluna

Pessoa matriculada ou registrada na escola. Pode participar de uma ou mais turmas e possui histórico de frequência.

### Responsável

Pessoa vinculada a uma aluna. No MVP, seus dados são usados apenas para referência administrativa.

### Modalidade

Categoria de dança ou atividade, como Ballet, Jazz, Sapateado ou Circo.

### Turma

Grupo de alunas vinculado a uma modalidade, com dia, horário e professoras associadas.

### Aula

Ocorrência de uma turma em uma data e horário específicos. Pode ser regular, experimental ou particular.

### Frequência

Registro de presença ou falta de uma aluna em uma aula.

### Plano

Representa o tipo de vínculo da aluna com a escola, como mensal, semestral ou anual.

### Relatório

Representa exportações e visões administrativas, inicialmente em PDF.

### Log de Auditoria

Registro interno de ações críticas realizadas no sistema.

## 4.2 Relacionamentos

- Uma escola possui muitos usuários.
- Uma escola possui muitas modalidades.
- Uma modalidade possui muitas turmas.
- Uma turma possui muitas alunas.
- Uma aluna pode participar de muitas turmas.
- Uma turma possui uma professora principal.
- Uma turma pode possuir professoras secundárias.
- Uma turma gera muitas aulas.
- Uma aula pertence a uma turma.
- Uma aula possui muitos registros de frequência.
- Uma frequência pertence a uma aluna e a uma aula.
- Uma aluna pode possuir um ou mais responsáveis.
- Um responsável pode estar vinculado a uma ou mais alunas.
- Uma aluna possui um plano.
- Logs de auditoria registram ações realizadas por usuários.
