# 3. Regras de Negócio

## 3.1 Usuários e Permissões

- Apenas administradores podem cadastrar, editar, excluir ou inativar professoras.
- Apenas administradores podem cadastrar, editar, excluir ou inativar alunas.
- Apenas administradores podem cadastrar, editar, excluir ou inativar turmas.
- Professoras acessam somente as aulas vinculadas a elas.
- Professoras secundárias possuem as mesmas permissões operacionais da professora principal dentro da aula.
- Responsáveis e alunas não possuem acesso ao sistema no MVP.

## 3.2 Alunas

- Uma aluna pode participar de mais de uma turma.
- Uma aluna possui status ativo ou inativo.
- Ao excluir uma aluna com histórico, ela deve ser inativada e continuar aparecendo em históricos anteriores.
- O cadastro de aluna deve conter nome, data de nascimento, telefone, observações, status e plano.
- A idade da aluna deve ser calculada a partir da data de nascimento.

## 3.3 Responsáveis

- Uma aluna pode ter responsável cadastrado.
- O cadastro de responsável deve conter nome, telefone, e-mail e parentesco.
- CPF do responsável não faz parte do MVP.

## 3.4 Professoras e Turmas

- Uma professora pode ministrar várias turmas.
- Uma turma pode ter uma professora principal e professoras secundárias.
- Uma turma pertence a uma modalidade.
- Uma turma possui dia e horário definidos.
- Uma turma pode ocorrer mais de uma vez por semana.

## 3.5 Aulas

- Frequência só pode ser registrada para aulas existentes.
- Aulas regulares são criadas de acordo com dia e horário estabelecidos para a turma.
- Aulas podem ser canceladas ou remarcadas.
- O sistema deve permitir substituição de professora.
- Aula experimental deve estar vinculada a uma turma.
- Aula experimental deve ser tratada como tipo separado de aula.
- Aula particular pode ser recorrente quando estiver vinculada a plano fechado.

## 3.6 Frequência

- Professoras podem registrar presença e falta das alunas.
- Professoras podem marcar todas as alunas como presentes.
- Professoras podem salvar rascunho da chamada.
- Professoras podem alterar a frequência após a aula.
- Administradores podem visualizar frequência, mas não alterá-la no MVP.
- O sistema deve classificar frequência acima de 80% como boa.
- O sistema deve classificar frequência entre 50% e 80% como atenção.
- O sistema deve classificar frequência abaixo de 50% como crítica.
- Alertas de baixa frequência aparecem apenas no painel administrativo.

## 3.7 Auditoria

- O sistema deve armazenar logs de ações críticas.
- Logs não terão tela de consulta no MVP.
- Devem gerar log: alteração de frequência, exclusão/inativação de aluna, alteração de turma e alteração de dados pessoais.
