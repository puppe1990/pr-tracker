<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GitHub PR Tracker

Aplicação web para acompanhar Pull Requests abertos da sua conta no GitHub em uma única tela.

## O que o app faz

- Lista PRs abertos criados pelo usuário autenticado via token
- Exibe título, repositório, data de criação e labels
- Permite filtrar por texto, repositório e label
- Consome a API do GitHub no backend usando Personal Access Token (`PAT`)

## Stack

- React 19
- Vite
- Express
- TypeScript
- GitHub REST API

## Requisitos

- Node.js 20+
- npm
- Um token pessoal do GitHub com permissões adequadas

## Configuração

Crie um arquivo `.env` na raiz do projeto:

```env
GITHUB_PERSONAL_ACCESS_TOKEN=seu_token_aqui
PORT=3000
```

Variáveis suportadas:

- `GITHUB_PERSONAL_ACCESS_TOKEN`: token principal usado pelo backend
- `GITHUB_TOKEN`: fallback compatível caso a variável principal não exista
- `PORT`: porta do servidor Express; padrão `3000`

## Permissões do token

Para token clássico, os escopos recomendados são:

- `repo`
- `read:user`

Se você usar fine-grained PAT, ele precisa conseguir ler os repositórios e Pull Requests que deseja listar.

## Executando localmente

1. Instale as dependências:
   `npm install`
2. Configure o `.env`
3. Inicie o servidor:
   `npm run dev`

Se a porta `3000` estiver ocupada:

```bash
PORT=3005 npm run dev
```

## Scripts

- `npm run dev`: inicia o servidor Express com Vite em modo de desenvolvimento
- `npm run build`: gera o build de produção do frontend
- `npm run preview`: abre o preview do build do Vite
- `npm run lint`: executa checagem de tipos com TypeScript

## Como funciona

O frontend busca dados em duas rotas do backend:

- `GET /api/user`: retorna os dados da conta dona do token
- `GET /api/prs`: retorna os PRs abertos criados por essa conta

O backend usa o token configurado no ambiente para autenticar as chamadas na API do GitHub. O token não é inserido pelo navegador e não passa pela interface.

## Filtros disponíveis

Na listagem de PRs você pode:

- Buscar por título ou nome do repositório
- Filtrar por repositório
- Filtrar por label

## Comportamento sem token

Se `GITHUB_PERSONAL_ACCESS_TOKEN` não estiver configurado, a interface mostra uma tela de instrução informando que o token precisa ser definido no servidor.
