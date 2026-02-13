# 🎮 Sistema Integrado do Zumbis.io

## ✅ Arquivos Criados

### Modularização e Segurança
- **config.js** - Configurações centralizadas
- **auth.js** - Autenticação com bloqueio de nome "Mingau"
- **validation.js** - Validação anti-hack
- **game-utils.js** - Utilitários de jogo
- **game-constants.js** - Constantes congeladas
- **physics.js** - Física do jogo
- **player-logic.js** - Lógica de jogador
- **discord-config.js** - Configuração Discord (link: discord.gg/jShcFcguUw)

### Sistema de Comandos e UI
- **commands.js** - Sistema de comandos DEV (contains CommandSystem)
- **command-panel.js** - Painel UI de comandos (lado direito)
- **chat-bubble.js** - Chat bubbles acima dos players (tipo mope.io)

## 👤 Conta DEV

**Nome:** Mingau  
**Senha:** dev1245#  
**Status:** Conta existente em users.json, não pode criar duplicada

### Como Usar:
1. Login normal (nome: Mingau, senha: dev1245#)
2. Digitar `/commandlist` para ver lista de comandos
3. Lista aparece no painel do lado direito

## 🎮 Comandos DEV Disponíveis

| Comando | Uso | Descrição |
|---------|-----|-----------|
| `/KILL` | `/kill <player\|everyone>` | Mata jogador(es) |
| `/TP` | `/tp <player>` | Teleporta para jogador |
| `/HEAL` | `/heal [player]` | Cura jogador |
| `/SPEED` | `/speed [player] <valor>` | Altera velocidade |
| `/GEMS` | `/gems <player> <qty>` | Adiciona gemas |
| `/RESTART` | `/restart` | Reinicia rodada |
| `/GIVCMD` | `/givcmd <player> <cmd>` | Dá comando a outro dev |
| `/COMMANDLIST` | `/commandlist` | Mostra lista de comandos |

## 🔤 Unicode Normalization

- **Entrada:** Você digita `/tp exemplo` ou `/tp 𝓮𝔁𝓮𝓶𝓹𝓵𝓸`
- **Display:** Nome acima do player continua `𝓮𝔁𝓮𝓶𝓹𝓵𝓸`
- **Match:** Ambos funcionam (normalização interna)

## 💬 Chat Bubbles

- Aparece acima da cabeça quando jogador digita mensagem
- DesaparE após 5 segundos
- Fundo preto com borda branca
- Tipo mope.io

## 📝 Alterações em Arquivos Existentes

### public/index.html
- ✅ Adicionado `id="discordBtn"` no botão Discord
- ✅ Carrega scripts: discord-config.js, chat-bubble.js, command-panel.js

### game.js
- ✅ Integração com CommandPanel para `/commandlist`
- ✅ Chat bubbles renderizam com ChatBubbleSystem
- ✅ processCommand() suporta novos comandos

### server.js
- ✅ Requer CommandSystem
- ✅ setPlayerName() valida nome "Mingau"
- ✅ socket.on('devCommand') executa comandos DEV
- ✅ sendMessage inclui playerId para chat bubbles

### users.json
- ✅ Conta Mingau: senha "dev1245#", isDev: true, cor vermelha

## 🔒 Proteções

✅ Nome "Mingau" (qualquer case) não pode ser criado em nova conta  
✅ Apenas Mingau pode executar comandos DEV  
✅ Normalização Unicode decodifica caracteres especiais  
✅ Validação de entrada em todos os comandos  
✅ Rate limiting anti-spam  
✅ Mensagens viajam com playerId para chat bubbles  

## 🚀 Testes Recomendados

1. Login como Mingau (dev1245#)
2. Digitar `/commandlist` → Ver painel lateral
3. Digitar `/tp [NomeOutroJogador]`
4. Criar jogador com nome "𝓮𝔁𝓮𝓶𝓹𝓵𝓸"
5. Digitar `/tp exemplo` → Deve teleportar
6. Enviar mensagem → Deve ver bubble acima player
7. Tentar criar conta "Mingau" → Deve ser bloqueado
