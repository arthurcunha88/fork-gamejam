# FORK

**NPCboPe // SEMCOMP Game Jam 2026 // Tema: Efeito Borboleta**

> Um escape room digital sobre escolhas, consequências e um sistema que talvez já soubesse o que você faria.

---

## Sobre o jogo

**FORK** é um jogo 2D de investigação e escape room desenvolvido para a **SEMCOMP Game Jam 2026**, a partir do tema **Efeito Borboleta**.

A proposta nasceu de uma pergunta simples:

> **E se uma pequena decisão dentro de um sistema fosse capaz de alterar completamente o seu desfecho?**

Em vez de transformar o tema em uma representação literal de uma borboleta, o projeto utiliza a ideia de causa e consequência como parte da própria estrutura do jogo.

O jogador acorda dentro de uma simulação aparentemente controlada, depois de ficar preso na própria Matrix enquanto testava servidores. Ele percebe que existem alterações que não foram feitas por ele, processos suspeitos no sistema e indícios de que até a saída pode ter sido modificada.

A abertura do jogo apresenta essa situação diretamente ao jogador antes do início da exploração. A partir daí, ele encontra arquivos, terminais e sistemas de segurança e precisa interpretar pistas para descobrir como avançar.

Ao longo da experiência, as decisões do jogador alteram o estado da simulação e podem levar a **cinco finais diferentes**.

---

## Conceito

FORK mistura:

- escape room;
- investigação;
- puzzles;
- exploração top-down;
- narrativa ambiental;
- ficção científica;
- estética de terminal e interface digital;
- sistema de loops;
- múltiplos finais.

O jogo foi pensado para que o jogador não receba toda a história diretamente.

Grande parte da narrativa é descoberta através de:

- arquivos;
- comandos;
- mensagens do sistema;
- objetos interativos;
- sequências de códigos;
- alterações no ambiente;
- consequências das próprias ações.

A ideia central é fazer com que o jogador perceba gradualmente que **resolver os puzzles não significa necessariamente entender o sistema**.

---

# Processo criativo

## 1. Partindo do tema "Efeito Borboleta"

O primeiro desafio foi evitar uma interpretação superficial do tema.

Em vez de simplesmente representar uma borboleta causando mudanças no cenário, a ideia foi utilizar o conceito de **efeito em cadeia**:

`ação → consequência → nova ação → nova consequência`

Essa estrutura acabou se tornando a base da narrativa e também da programação do jogo.

Cada descoberta poderia desbloquear outra descoberta, enquanto determinadas ações alterariam o comportamento do sistema.

---

## 2. A ideia de um escape room digital

A partir disso, o conceito foi direcionado para um **escape room digital**.

A inspiração veio da ideia de estar preso dentro de um sistema que apresenta regras próprias, com uma atmosfera de ficção científica semelhante à de histórias sobre simulações e controle.

O objetivo não era criar um jogo de ação complexo.

A prioridade passou a ser:

**explorar → observar → interpretar → testar → descobrir.**

Isso também permitiu manter o escopo adequado para uma Game Jam.

---

## 3. O sistema de loops

O conceito evoluiu para um sistema em que determinados erros podem provocar o colapso do loop.

O jogador pode:

- descobrir informações;
- cometer erros em protocolos críticos;
- aumentar o nível de consciência do sistema;
- alterar o estado da simulação;
- chegar a diferentes desfechos.

O loop, portanto, não existe apenas como mecânica.

Ele também faz parte da narrativa.

O sistema lembra ações realizadas anteriormente e utiliza essas informações para alterar a experiência.

---

## 4. Os cinco finais

Durante o desenvolvimento, percebemos que o próprio tema da Game Jam poderia ser representado através dos finais.

Uma mesma experiência pode gerar consequências diferentes dependendo das decisões tomadas.

O jogo possui cinco finais:

### Final 1 — ESCAPE

O jogador consegue completar a cadeia principal e alcançar a saída.

Mas a fuga traz uma última informação:

**SYSTEM USERS: 2**

A pergunta passa a ser quem, exatamente, escapou junto.

### Final 2 — RESET

O jogador tenta escapar antes de compreender completamente o sistema.

A tentativa é registrada e o sistema reinicia o loop.

### Final 3 — ETERNAL LOOP

O jogador descobre que o ciclo não começou com ele.

Existe um histórico muito maior por trás da simulação.

### Final 4 — CONTROLLED

O jogador descobre que suas próprias decisões estavam sendo previstas.

A revelação transforma as escolhas anteriores em parte do próprio experimento.

### Final 5 — PROJECT BUTTERFLY

É o desfecho secreto.

O jogador conecta diferentes pistas e percebe que a sequência de ações formou uma cadeia deliberada.

O sistema conseguiu prever quase tudo.

A variável que permaneceu fora da previsão foi a própria decisão de compreender o que estava acontecendo.

---

## 5. A construção dos puzzles

Os puzzles foram desenvolvidos para que as respostas não fossem simplesmente entregues ao jogador.

Um exemplo importante é a sequência envolvendo:

`LOG_07 → 07:31 → PORTA → SERVER A → STORAGE → PROJECT_B → NOTES → SAÍDA`

O objetivo foi fazer com que cada descoberta servisse de contexto para a próxima.

A hora **07:31**, por exemplo, não funciona apenas como um código: ela faz parte da linguagem interna da simulação.

Da mesma forma, o `NOTES.txt` apresenta o horário local do computador como uma referência para o protocolo de saída.

Assim, os puzzles tentam funcionar simultaneamente como:

1. desafios;
2. pistas;
3. elementos narrativos.

---

## 6. Desenvolvimento visual

A direção visual foi construída em torno de uma estética de laboratório tecnológico e simulação digital.

A primeira versão utilizava principalmente elementos desenhados proceduralmente.

Durante o desenvolvimento, o projeto passou a incorporar assets pixel-art e elementos de interface para enriquecer o ambiente sem abandonar a identidade original.

A escolha visual buscou manter:

- tons escuros;
- azul/ciano como cor de interface;
- pequenos pontos de iluminação;
- elementos industriais;
- equipamentos tecnológicos;
- interfaces minimalistas;
- contraste entre áreas normais e áreas corrompidas.

Parte importante da ambientação continua sendo criada diretamente pelo código, enquanto assets externos são utilizados como complemento visual.

---

# Características

- Escape room 2D top-down.
- Exploração livre dentro do laboratório.
- Sistema de interação com objetos.
- Terminal com comandos.
- Puzzles de código, sequência e investigação.
- Sistema de loops.
- Estado persistente entre loops.
- Sistema de consciência do sistema.
- Corrupção progressiva do ambiente.
- Narrativa descoberta através de arquivos e objetos.
- Cinco finais.
- Final secreto relacionado ao Projeto Butterfly.
- Controles por teclado e mouse.
- Telas finais estáticas com escolha manual do próximo passo.
- Áudio procedural utilizando Web Audio API.
- Efeitos visuais e partículas criados em código.
- Assets pixel-art utilizados para complementar a ambientação.

---

# Tecnologia

O jogo foi desenvolvido principalmente com:

- **JavaScript**
- **Phaser 3**
- **HTML5**
- **CSS**
- **Web Audio API**
- **Git / GitHub**

O **Phaser 3** foi utilizado como framework principal para a criação do jogo. Phaser é um framework 2D para jogos HTML5, com suporte a renderização via WebGL e Canvas e execução diretamente no navegador.

A estrutura do projeto utiliza cenas, objetos interativos, sistemas independentes e um estado central para separar as principais responsabilidades do jogo.

---

# Arquitetura do projeto

```
fork-gamejam/
│
├── index.html
│
├── assets/
│   ├── tilemap/
│   │   └── CosmicLilac_Tiles.png
│   ├── fork-lab-props.svg
│   └── fork-emblem.svg
│
└── src/
    ├── config/
    │   ├── GameConfig.js
    │   └── PhaserConfig.js
    │
    ├── systems/
    │   ├── GameState.js
    │   ├── LoopManager.js
    │   ├── UIManager.js
    │   ├── AudioManager.js
    │   ├── AnimationManager.js
    │   ├── PuzzleManager.js
    │   ├── DialogManager.js
    │   └── FinalManager.js
    │
    ├── objects/
    │   ├── InteractiveObject.js
    │   ├── Player.js
    │   └── Terminal.js
    │
    └── scenes/
        ├── BootScene.js
        ├── MenuScene.js
        ├── GameScene.js
        ├── ResetScene.js
        └── EndScene.js
```

### Principais sistemas

**GameState**

Centraliza as informações que precisam sobreviver aos loops, como descobertas, consciência do sistema, puzzles resolvidos e progresso dos finais.

**LoopManager**

Controla o tempo do loop, estados de alerta, pausa e colapsos provocados por erros críticos.

**PuzzleManager**

Concentra os puzzles e suas regras de validação e consequências.

**InteractiveObject**

É a base dos objetos que podem ser examinados ou utilizados pelo jogador.

**AudioManager**

Produz efeitos sonoros proceduralmente através da Web Audio API.

**AnimationManager**

Controla efeitos como glitch, flash, partículas, portas e outras respostas visuais.

**FinalManager**

Verifica continuamente as condições necessárias para cada um dos cinco finais.

---

# Fluxo geral

```
                    ┌───────────────┐
                    │    MENU       │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │    GAME       │
                    │  EXPLORAÇÃO   │
                    └───────┬───────┘
                            ↓
                    ┌───────────────┐
                    │    PUZZLES    │
                    │  CONSEQUÊNCIAS│
                    └───────┬───────┘
                            ↓
                  ┌─────────┴─────────┐
                  ↓                   ↓
             LOOP RESET            FINAL
                  │             ┌────┴────┐
                  │             │ 1 → 5   │
                  │             └────┬────┘
                  │                  ↓
                  └────────────→ ESCOLHA
                                 │  │  │
                                 ↓  ↓  ↓
                               JOGO LOOP MENU
```

---

# Como executar

O jogo pode ser executado através de um servidor local.

Não é recomendado abrir diretamente o `index.html` com `file://`, devido às restrições de segurança do navegador para carregamento de recursos.

### Python

```bash
python -m http.server 8080
```

### Node.js

```bash
npx serve .
```

### VS Code

Utilize a extensão **Live Server** e abra o projeto através de **Go Live**.

---

# Equipe

### Desenvolvimento

**Arthur Andrade Cunha**  
Design e desenvolvimento. Responsável pela direção de design, programação, arquitetura, sistemas de jogo, integração e decisões de implementação.

**Pedro Andrade**  
Desenvolvimento. Responsável pela programação e colaboração na implementação dos sistemas do jogo.

**Andre Rangel**  
Design. Responsável pela colaboração na direção visual e construção de elementos de design.

### Colaboradores

**Gustavo Maia**  
Colaborador.

**Maria Eduarda Lombardi**  
Colaboradora.

---

# Uso de inteligência artificial

Durante o desenvolvimento, utilizamos **ChatGPT como ferramenta de apoio ao desenvolvimento**.

A IA foi utilizada principalmente para:

- brainstorming e desenvolvimento de ideias;
- discussão e refinamento do conceito;
- estruturação de sistemas;
- auxílio na implementação e depuração de código;
- análise de erros;
- revisão de lógica;
- sugestões de arquitetura;
- refinamento de narrativa e puzzles;
- discussão de experiência do jogador.

A direção criativa, decisões de design, integração do projeto, testes e decisões finais sobre implementação foram realizadas pela equipe.

O uso de IA fez parte do processo de desenvolvimento como uma ferramenta de apoio, e não como substituição das decisões da equipe.

---

# Créditos e assets

Agradecemos aos criadores dos recursos utilizados no desenvolvimento de FORK.

### Tilemap — Cosmic Lilac

**Autor:** PetricakeGames  
**Asset:** Cosmic Lilac! Sci-Fi Tileset  
**Fonte:** itch.io

O tileset foi utilizado para complementar a ambientação sci-fi do laboratório. O autor permite o uso em projetos comerciais ou gratuitos mediante as condições apresentadas na página do asset, incluindo a atribuição de crédito.

### UI — Sci Fi Game UI collection FREE version

**Autor:** SunGraphica  
**Asset:** Sci Fi Game UI collection FREE version  
**Fonte:** itch.io

O pacote fornece elementos de interface e recursos visuais de temática sci-fi. A versão gratuita é disponibilizada sob **Creative Commons Attribution 4.0 International**, com exigência de atribuição ao autor.

### Character — The Adventurer - Male

**Autor:** Sscary  
**Asset:** The Adventurer - Male  
**Fonte:** itch.io

Recurso utilizado como base visual para o personagem do jogo.

---

# Créditos especiais

**Phaser**

Framework utilizado para a construção do jogo 2D e execução no navegador.  
Documentação oficial: https://docs.phaser.io/

**ChatGPT / OpenAI**

Utilizado como ferramenta de apoio durante o processo de criação, programação, depuração, brainstorming e documentação.

---

# Sobre o projeto

FORK foi desenvolvido como um projeto de **Game Jam**, com foco em transformar uma ideia relativamente simples em uma experiência narrativa completa dentro de um escopo limitado.

O projeto começou a partir do tema **Efeito Borboleta** e evoluiu gradualmente para uma experiência sobre:

> **decisão, consequência, repetição e controle.**

A principal intenção do desenvolvimento foi fazer com que o próprio jogador percebesse o efeito borboleta através das suas ações, em vez de apenas observar uma história sobre ele.

Cada pequena descoberta pode modificar a interpretação da próxima.

Cada erro pode alterar o loop.

Cada escolha pode mudar o final.

E, no fim, a própria tentativa de entender o sistema passa a fazer parte dele.

---

**FORK — NPCboPe**  
**SEMCOMP Game Jam 2026**

Desenvolvido por **Arthur Andrade Cunha, Andre Rangel e Pedro Andrade**.
