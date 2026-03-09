<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GitHub PR Tracker

Visualize e acompanhe seus Pull Requests abertos no GitHub.

## Run Locally

**Pré-requisitos:** Node.js


1. Install dependencies:
   `npm install`
2. Crie um arquivo `.env` com:
   `GITHUB_PERSONAL_ACCESS_TOKEN=seu_token_pessoal`
3. Run the app:
   `npm run dev`

## GitHub token

O backend usa um Personal Access Token (`PAT`) para consultar a API do GitHub em nome da conta dona desse token.

- Variável suportada: `GITHUB_PERSONAL_ACCESS_TOKEN`
- Fallback compatível: `GITHUB_TOKEN`
- Escopos sugeridos para token clássico: `repo`, `read:user`

Se o token não estiver configurado, a interface exibirá uma mensagem pedindo a configuração no servidor.
