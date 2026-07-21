# 🩰 DanceFlow — Gestão Inteligente para Escolas de Dança

![License](https://img.shields.io/badge/license-MIT-pink)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=nodedotjs)
![Prisma](https://img.shields.io/badge/Prisma-5-darkblue?logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue?logo=postgresql)
![Flutter](https://img.shields.io/badge/Flutter-Dart-cyan?logo=flutter)

**DanceFlow** é um sistema SaaS full-stack e multi-tenant desenvolvido para simplificar e modernizar a gestão operacional, financeira e pedagógica de escolas e estúdios de dança.

---

## 🌟 Principais Funcionalidades

### 🏢 Arquitetura Multi-Tenant & SaaS
- **Isolamento de Dados:** Cada escola possui seus próprios dados protegidos de forma isolada no banco de dados.
- **Painel SuperAdmin:** Área global para provisionamento de novas escolas, gestão de cadastros e auditoria completa do sistema.

### 👩‍🎓 Gestão de Alunas e Responsáveis
- **Ficha Cadastral Unificada:** Controle de dados pessoais, planos de pagamento (Mensal, Semestral, Anual), histórico médico e contatos dos responsáveis.
- **Suporte a Alunas Experimentais:** Cadastro rápido de alunas para aulas experimentais diretamente no diário de classe com conversão simplificada para matriculada regular.
- **Matrículas Flexíveis:** Vínculo de alunas em múltiplas turmas e seleção dinâmica de horários.

### 📅 Turmas, Modalidades e Diário de Classe
- **Gestão de Modalidades:** Suporte a diferentes modalidades de dança (Ballet, Jazz, Sapateado, etc.).
- **Frequência e Chamada:** Marcação de presença de forma rápida e intuitiva na Web e no App Mobile.
- **Histórico e Métricas:** Relatório individual de frequência por aluna com percentuais automáticos de assiduidade.

### 🛡️ Linha do Tempo e Auditoria
- **Auditoria Local Amigável:** Histórico simplificado em linguagem natural para administradores locais da escola.
- **Auditoria Técnica Global:** Registro detalhado de logs JSON e rastreamento para o SuperAdmin do SaaS.

---

## 🛠️ Tecnologias Utilizadas

### Frontend Web
- **React.js & Vite:** Interface moderna, leve e responsiva.
- **Design System Customizado:** Estética dark mode com elementos em glassmorphism e paleta visual ajustada para estúdios de dança.
- **Lucide React:** Ícones modernos e consistentes.

### Backend & API
- **Node.js & Express:** API RESTful rápida e modular.
- **Prisma ORM & PostgreSQL (Neon):** Mapeamento relacional seguro com isolamento multi-tenant e conexão via Neon Serverless.
- **JWT & Zod:** Autenticação segura por tokens e validação rigorosa de payloads.

### Mobile
- **Flutter / Dart:** Aplicativo móvel para suporte operacional a professoras e chamada em sala de aula.

### Cloud & Deploy
- **Vercel:** Hospedagem estática do Frontend Web.
- **Railway:** Hospedagem da API Node.js.
- **Neon:** Banco de dados PostgreSQL na nuvem.

---

## 📁 Estrutura do Repositório

```
DanceFlow/
├── backend/          # API Node.js + Express + Prisma ORM
├── web/              # Aplicação Frontend React (Vite)
├── mobile/           # Aplicativo Mobile Flutter (Dart)
└── docker/           # Configuração de containers PostgreSQL locais
```

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
- Node.js (v18+)
- npm ou yarn
- Docker (opcional, para banco local) ou banco PostgreSQL remoto

### 1. Clonar o repositório
```bash
git clone https://github.com/marques664/DanceFlow.git
cd DanceFlow
```

### 2. Configurar e Iniciar o Backend
```bash
cd backend
npm install
npx prisma db push
node prisma/seed.js
npm run dev
```
O servidor iniciará em `http://localhost:3333`.

### 3. Configurar e Iniciar a Web
```bash
cd ../web
npm install
npm run dev
```
A aplicação abrirá em `http://localhost:5173`.

---

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais e de portfólio sob a licença MIT.
