# TokensMonitor ⚡

Dashboard web moderno e simplificado para gerenciar de forma rápida a disponibilidade de tokens e tempos de recarga em suas diversas contas do **Antigravity** e **Claude Code**.

Feito com HTML, CSS e Vanilla JS, o projeto roda inteiramente no navegador e é hospedado no GitHub Pages. Não requer backend ativo: seus dados são salvos de maneira segura e privada em um **GitHub Gist**.

## Arquitetura e Dados

- A persistência é feita via **GitHub Gist API**.
- Você precisará criar um GitHub Personal Access Token (`ghp_...`) com permissão `gist`. Esse token ficará salvo no `localStorage` do seu navegador.
- O app criará automaticamente um Gist privado chamado `tokensmonitor-data.json`.
- Ao acessar em outros dispositivos, basta colar o mesmo token nas Configurações para sincronizar seu uso.

## Como Usar

O monitor funciona colando o texto diretamente das plataformas, sem a necessidade de APIs diretas:

1. Vá para o Antigravity ou Claude Code e selecione/copie o bloco de texto onde mostra sua quota (ex: "X resets in Y" ou "Sessão Atual X%").
2. Abra o TokensMonitor e clique em "📋 Colar Atualização".
3. Cole o texto copiado — a plataforma será detectada automaticamente.
4. Confirme (no caso do Antigravity, selecione um nível de tokens atual).

## Hospedagem / Deployment

Como o sistema lida com dados privados apenas via tokens de cliente, a hospedagem pode ser feita inteiramente no **GitHub Pages**.
Apenas ative o Pages para branch `master` base `/`.
