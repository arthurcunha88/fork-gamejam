# FORK — Dev Notes
**NPCboPe  //  Game Jam  //  Butterfly Effect**

---

## Como rodar
Abra `index.html` em um servidor local. Não funciona com `file://` por restrições do browser.

```bash
# Opção 1 — Python
python -m http.server 8080

# Opção 2 — Node
npx serve .

# Opção 3 — VS Code
Instale "Live Server" e clique em "Go Live"
```

---

## Estrutura do projeto

```
fork-game/
├── index.html
└── src/
    ├── config/
    │   ├── GameConfig.js      ← Constantes globais (cores, timers, IDs)
    │   └── PhaserConfig.js    ← Inicialização do Phaser
    ├── systems/
    │   ├── GameState.js       ← Estado central (persiste entre loops) ★
    │   ├── LoopManager.js     ← Timer, reset, callbacks de urgência
    │   ├── PuzzleManager.js   ← Definição e validação de todos os puzzles
    │   ├── DialogManager.js   ← Caixas de texto + banco de narrativa
    │   └── FinalManager.js    ← Verifica e dispara os 5 finais
    ├── objects/
    │   ├── InteractiveObject.js ← Base de todos os objetos do mapa
    │   ├── Terminal.js          ← Terminal com sistema de comandos
    │   └── Player.js            ← Movimento + detecção de interação
    └── scenes/
        ├── BootScene.js       ← Tela de boot simulada
        ├── MenuScene.js       ← Menu principal
        ├── GameScene.js       ← Gameplay principal ★
        ├── ResetScene.js      ← Transição entre loops
        └── EndScene.js        ← Os 5 finais
```

---

## Fluxo do jogo

```
BootScene → MenuScene → GameScene ←→ ResetScene
                                ↓
                            EndScene
```

---

## Sistema de estado (GameState)

O coração do Efeito Borboleta. Tudo que precisa persistir entre loops fica aqui.

```js
// Ler
GameState.get('log07_deleted')       // → false

// Escrever
GameState.set('log07_deleted', true) // persiste no próximo loop

// Puzzle
GameState.solvePuzzle('puzzle_door_code')
GameState.isPuzzleSolved('puzzle_door_code') // → true

// Borboleta
GameState.addButterflyStep('delete_log07')   // conta para Final 5

// Sistema consciente
GameState.increaseSystemAwareness(1)         // 0-5, muda diálogos
```

---

## Puzzles e consequências

| Puzzle | Trigger | Consequência |
|---|---|---|
| Terminal Main | Explorar comandos | Revela lore, deleta LOG_07 |
| Door Code `0731` | `log07_deleted = true` | `door_unlocked = true` |
| Server Sequence `A,C,B,D` | Qualquer hora | `server_rebooted = true` |
| Hidden File `BUTTERFLY` | server+log deletados | `secret_area_found = true` |
| Butterfly Sequence | 4 steps coletados | Desbloqueia Final 5 |

---

## Os 5 finais

| Final | Condição |
|---|---|
| 1 — Escape | `door_unlocked` + 3 puzzles |
| 2 — Reset | `escape_attempted` + `awareness >= 2` |
| 3 — Loop Eterno | `loop_count >= 10` |
| 4 — Controlado | `awareness >= 4` + `identity_known` |
| 5 — Butterfly ★ | 4 butterfly_steps coletados |

---

## Adicionando novos objetos

```js
// Em GameScene._buildObjects():
const novoObjeto = new InteractiveObject(this, x, y, {
  id:    'meu_objeto',
  type:  FORK_CONFIG.OBJECT_TYPES.FILE,
  label: 'ARQUIVO',
  width: 24, height: 24,
  color: FORK_CONFIG.COLORS.ACCENT_DIM,
  onInteract: () => {
    this.dialogManager.show(['Texto aqui'], { title: 'ARQUIVO' });
    GameState.set('minha_flag', true);
  },
});
this._objects.push(novoObjeto);
```

---

## Adicionando comandos ao terminal

```js
// Em PuzzleManager._buildPuzzles() → commands:
'MEU_COMANDO': {
  output: ['> Saída do comando'],
  onExecute: () => {
    GameState.set('algo', true);
  }
}
```

---

## Próximos passos (P2 — Polimento)

- [ ] Spritesheet do player (16x16 ou 32x32)
- [ ] Tileset do laboratório
- [ ] Efeitos de glitch (shader ou canvas filter)
- [ ] Transições entre cenas (fade)
- [ ] Áudio: sons de terminal, alarme, reset
- [ ] Música ambiente (loop + intensidade por timer)
- [ ] Pequenas mudanças visuais entre loops
- [ ] Área secreta desbloqueável (sala adicional)
- [ ] Mais variações de diálogo por awareness

---

## Paleta FORK

| Nome | Hex |
|---|---|
| BG | `#050810` |
| Accent | `#00ffe0` |
| Accent Dim | `#00886a` |
| Danger | `#ff2244` |
| Warning | `#ffaa00` |
| Text | `#88ffdd` |
| Text Dim | `#446655` |
| Terminal BG | `#020c10` |
