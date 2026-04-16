# TokensMonitor — Design Spec
**Data:** 2026-04-16
**Repositório:** https://github.com/Ackerss/tokensmonitor
**URL do app:** https://ackerss.github.io/tokensmonitor

---

## Problema

O usuário gerencia múltiplas contas nas plataformas Antigravity e Claude Code.
Para saber quais modelos têm tokens disponíveis, precisa entrar em cada conta
individualmente nas plataformas — processo lento e repetitivo.

**Pergunta central que o app responde:**
> "Qual conta eu devo usar AGORA? E qual está perto de renovar, para eu aproveitar os tokens restantes antes de zerar?"

---

## Solução

App web estático hospedado no GitHub Pages. Dados persistidos em GitHub Gist
privado (JSON). Atualização via colagem de texto copiado diretamente das plataformas.
Acesso de qualquer computador via login com GitHub Personal Access Token.

---

## Stack

- **Frontend:** HTML + CSS + JavaScript puro (sem framework, sem build step)
- **Hospedagem:** GitHub Pages (gratuito, repo público)
- **Banco de dados:** GitHub Gist privado via GitHub REST API
- **Notificações:** Web Notifications API (funciona com aba aberta)
- **Auth:** GitHub Personal Access Token (salvo em localStorage)

---

## Contas Monitoradas

### Antigravity (5 contas)
| Conta | ID interno |
|---|---|
| jacsonsax | jacsonsax |
| JacsonADuarte | jacsonduarte |
| Natubrava | natubrava |
| fenixbrj | fenixbrj |
| ANA | ana |

**Modelos monitorados por conta:**
- Gemini 3.1 Pro (High)
- Gemini 3 Flash
- Claude Sonnet 4.6 (Thinking)
- Claude Opus 4.6 (Thinking)

### Claude Code (1 conta)
- **Sessão atual:** % usado na sessão aberta (reseta a cada ~5h)
- **Limite semanal:** % usado + dia/hora de reinício (semana inteira se zerar)

---

## Modelo de Dados (JSON no Gist)

```json
{
  "lastUpdated": "2026-04-16T10:00:00-03:00",
  "accounts": {
    "natubrava": {
      "platform": "antigravity",
      "displayName": "Natubrava",
      "models": {
        "gemini_pro_high": {
          "name": "Gemini 3.1 Pro (High)",
          "usageLevel": "low",
          "refreshesAt": "2026-04-16T15:02:00-03:00",
          "notifyEnabled": false,
          "updatedAt": "2026-04-16T10:00:00-03:00"
        },
        "gemini_flash": { ... },
        "claude_sonnet": { ... },
        "claude_opus": { ... }
      }
    },
    "claude_code": {
      "platform": "claudecode",
      "displayName": "Claude Code",
      "session": {
        "usagePercent": 0,
        "updatedAt": "2026-04-16T10:00:00-03:00"
      },
      "weekly": {
        "usagePercent": 73,
        "refreshesAt": "2026-04-18T22:00:00-03:00",
        "notifyEnabled": false,
        "updatedAt": "2026-04-16T10:00:00-03:00"
      }
    }
  }
}
```

**usageLevel values:** `"full"` | `"medium"` | `"low"` | `"empty"`

---

## Interface — Dashboard

### Layout Geral
- Tema escuro (fundo #0d0f14, similar ao Antigravity)
- Header fixo com título + botão "📋 Colar Atualização" + botão ⚙️ Configurações
- Grid responsivo de cards (2 colunas no desktop, 1 no mobile)
- Atualização automática dos contadores a cada 60 segundos

### Card de Conta — Antigravity
```
┌─────────────────────────────────────────────────────┐
│ 🟢 Natubrava                    Atualizado: 10:02   │
├─────────────────────────────────────────────────────┤
│ Gemini 3.1 Pro (High)                               │
│ [⚫——————————————————————————🟢] Cheio              │
│ Renova: hoje às 15:02 (em 5h02)                     │
│                                          🔔          │
├─────────────────────────────────────────────────────┤
│ Gemini 3 Flash                                      │
│ [⚫————————————🟡————————————] Médio               │
│ Renova: hoje às 17:30 (em 7h30)                     │
│                                          🔔          │
└─────────────────────────────────────────────────────┘
```

**Barra de tokens** — preenchimento da ESQUERDA (vazio) para DIREITA (cheio):
- `⚫ Zerado` / `🔴 Quase vazio` / `🟡 Médio` / `🟢 Cheio`

**Ícone do card** (canto superior esquerdo):
- 🟢 se a maioria dos modelos tem tokens
- 🟡 se misturado
- 🔴 se a maioria está vazia

### Card de Conta — Claude Code
```
┌─────────────────────────────────────────────────────┐
│ 🟡 Claude Code                  Atualizado: 10:05   │
├─────────────────────────────────────────────────────┤
│ ⚡ Sessão atual                                      │
│ [——————————————————————————————] 0% usado           │
│                                                     │
│ 🚨 Limite Semanal                                   │
│ [████████████████████————————] 73% usado            │
│ Reinicia: sex., 18/04 às 22:00 (em 3 dias, 11h)    │
│                                          🔔          │
└─────────────────────────────────────────────────────┘
```

Limite semanal fica em destaque maior pois é o crítico (semana inteira de espera).

### Ordenação do Dashboard
Cards ordenados por "urgência de ação":
1. Contas com tokens disponíveis (🟢) — *use agora*
2. Contas com tokens médios com renovação próxima — *aproveite o restante*
3. Contas zeradas renovando em breve — *aguarde pouco*
4. Contas zeradas com longa espera — *planejamento*

---

## Fluxo de Colagem de Texto

### Formato Antigravity (detectado automaticamente)
```
Gemini 3.1 Pro (High)
Refreshes in 1 day, 7 hours
Gemini 3 Flash
Refreshes in 3 hours, 13 minutes
Claude Sonnet 4.6 (Thinking)
Refreshes in 1 day, 5 hours
Claude Opus 4.6 (Thinking)
Refreshes in 1 day, 5 hours
```

Parsing: regex `(.+)\nRefreshes in (.+)` → calcula `Date.now() + duração` para `refreshesAt`.

### Formato Claude Code (detectado automaticamente)
```
Limites de uso do plano
Pro
Sessão atual
Inicia quando uma mensagem é enviada
0% usado
Limites semanais
Saiba mais sobre limites de uso
Todos os modelos
Reinicia sex., 22:00
73% usado
Última atualização: agora mesmo
```

Parsing: extrai `X% usado` para cada seção + `Reinicia [weekday], HH:MM` → calcula próxima ocorrência daquele dia da semana.

### Steps do modal de colagem (Antigravity):
1. Usuário cola o texto
2. App detecta formato → mostra "🔍 Detectado: Antigravity"
3. Usuário seleciona a conta (dropdown)
4. **Passo rápido:** "Como estavam as barras de uso?"
   ```
   [⚫ Zerado] [🔴 Quase vazio] [🟡 Médio] [🟢 Cheio]
   ```
   (um clique por conta, aplica o mesmo nível para todos os modelos da conta)
5. Preview dos dados extraídos
6. Confirmar → salva no Gist

### Steps do modal de colagem (Claude Code):
1. Usuário cola o texto
2. App detecta formato → mostra "🔍 Detectado: Claude Code"
3. Preview: "Sessão: 0% | Semanal: 73% | Renova: sex. 22:00"
4. Confirmar → salva no Gist

---

## Notificações

- **Tecnologia:** Web Notifications API (requer aba aberta)
- **Configuração:** Toggle individual por modelo/conta (ícone 🔔 em cada item)
- **Triggers:**
  - Modelo Antigravity: ao chegar no horário de `refreshesAt` → "✅ Gemini Pro da conta Natubrava renovado!"
  - Claude Code semanal: ao atingir 80% → aviso; ao atingir 100% → alerta crítico
  - Claude Code semanal: ao chegar no horário de renovação → "✅ Claude Code semanal renovado!"
- **Verificação:** Timer a cada 60 segundos compara timestamps

---

## Tela de Configuração

Acessível pelo botão ⚙️. Configurações salvas em `localStorage`:

```
GitHub Personal Access Token: [__________________]  [Salvar]
GitHub Gist ID: [auto-preenchido na primeira vez]
[Testar conexão]  [Criar novo Gist]

Aviso antecipado de notificações: [OFF / 15 min / 30 min]
Tema: [🌙 Escuro] [☀️ Claro]
```

**Primeiro acesso:**
1. Usuário insere o token GitHub (com permissão `gist`)
2. App cria automaticamente o Gist privado
3. Salva o Gist ID no localStorage
4. Redireciona para o dashboard

---

## Arquivo Structure no Repositório

```
tokensmonitor/
├── index.html          # App completo (single-page)
├── css/
│   └── style.css       # Todos os estilos
├── js/
│   ├── app.js          # Inicialização, roteamento de views
│   ├── gist.js         # GitHub Gist API (ler/gravar dados)
│   ├── parser.js       # Parsing dos textos colados
│   ├── dashboard.js    # Renderização dos cards
│   ├── notifications.js# Web Notifications API + timers
│   └── settings.js     # Tela de configurações
├── docs/
│   └── superpowers/
│       ├── specs/
│       └── plans/
└── README.md
```

---

## Limitações Conhecidas

1. **Token % no Antigravity:** A barra de uso não está disponível no texto copiado — o usuário insere manualmente (1 clique) ao colar
2. **Notificações offline:** Web Notifications só funcionam com a aba aberta
3. **Rate limits GitHub API:** 5.000 req/hora com token autenticado — mais que suficiente
4. **Sincronização:** Não é tempo-real entre dispositivos; cada dispositivo carrega do Gist ao abrir o app e ao salvar atualizações
