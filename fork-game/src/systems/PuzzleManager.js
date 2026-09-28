// ============================================================
// FORK — PuzzleManager.js
// Define todos os puzzles e verifica soluções
// ============================================================

class PuzzleManager {

  constructor() {
    this._puzzles = this._buildPuzzles();
  }

  // ── API pública ───────────────────────────────────────────

  /** Retorna dados de um puzzle */
  get(id) {
    return this._puzzles[id] || null;
  }

  /** Verifica se um puzzle está disponível neste loop */
  isAvailable(id) {
    const p = this._puzzles[id];
    if (!p) return false;
    if (GameState.isPuzzleSolved(id)) return false;
    if (p.requires && !this._checkRequires(p.requires)) return false;
    return true;
  }

  /** Verifica resposta de um puzzle */
  checkAnswer(id, answer) {
    const p = this._puzzles[id];
    if (!p) return false;

    const correct = p.validator(answer);
    if (correct) {
      GameState.solvePuzzle(id);
      this._applyConsequences(p.consequences);
      console.log(`[PUZZLE] Solved: ${id}`);
    }
    return correct;
  }

  /** Retorna descrição de consequências para UI */
  getConsequences(id) {
    const p = this._puzzles[id];
    return p ? p.consequenceHint : null;
  }

  // ── Definição dos puzzles ─────────────────────────────────

  _buildPuzzles() {
    return {

      // ── PUZZLE 1: Terminal Principal ──────────────────────
      [FORK_CONFIG.PUZZLES.TERMINAL_MAIN]: {
        id:    FORK_CONFIG.PUZZLES.TERMINAL_MAIN,
        title: 'TERMINAL PRINCIPAL',
        type:  'command',
        // Disponível desde o início
        requires: null,
        // Jogador precisa descobrir que pode listar arquivos
        hint: 'Tente listar os arquivos disponíveis.',
        commands: {
          'HELP': {
            output: [
              '> Available commands:',
              '  LIST     — list files',
              '  READ [n] — read file',
              '  DELETE [n] — delete file',
              '  STATUS   — system status',
              '  CLEAR    — clear terminal',
            ]
          },
          'STATUS': {
            output: [
              '> SYSTEM STATUS',
              '  LOOP: ' + (GameState.get('loop_count') + 1),
              '  INTEGRITY: 94%',
              '  ACTIVE PROCESSES: 7',
              '  ANOMALIES DETECTED: ' + GameState.get('system_awareness'),
            ],
            onExecute: () => {
              GameState.executeCommand('STATUS');
            }
          },
          'LIST': {
            output: () => {
              const files = [
                '> FILES:',
                '  LOG_01.txt',
                '  LOG_04.txt',
                '  SYSTEM_NOTES.txt',
              ];
              if (!GameState.get('log07_deleted')) {
                files.push('  LOG_07.txt');
              } else {
                files.push('  [LOG_07 — NOT FOUND]');
              }
              if (GameState.get('secret_area_found')) {
                files.push('  PROJECT_B.enc  [ENCRYPTED]');
              }
              return files;
            },
          },
          'READ LOG_01': {
            output: [
              '> LOG_01.txt',
              '─────────────────────────',
              'Test subject initialization complete.',
              'Subject shows expected behavioral patterns.',
              'Simulation parameters: nominal.',
              '─────────────────────────',
            ],
            onExecute: () => {
              GameState.executeCommand('READ_LOG_01');
            }
          },
          'READ LOG_04': {
            output: [
              '> LOG_04.txt',
              '─────────────────────────',
              'Loop efficiency: 73%.',
              'Subject does not yet suspect the nature',
              'of the environment.',
              'Recommended: maintain current parameters.',
              '─────────────────────────',
            ],
            onExecute: () => {
              GameState.executeCommand('READ_LOG_04');
              GameState.increaseSystemAwareness(1);
            }
          },
          'READ LOG_07': {
            output: () => {
              if (GameState.get('log07_deleted')) {
                return ['> ERROR: LOG_07 — FILE NOT FOUND'];
              }
              return [
                '> LOG_07.txt',
                '─────────────────────────',
                'ANOMALY REPORT — LOOP 01',
                'Subject attempted unauthorized',
                'access to restricted directory.',
                'ACTION: Flag for monitoring.',
                'Identity confirmed: [REDACTED]',
                '─────────────────────────',
              ];
            },
            onExecute: () => {
              if (!GameState.get('log07_deleted')) {
                GameState.executeCommand('READ_LOG_07');
                GameState.set('player_identity_known', true);
              }
            }
          },
          'DELETE LOG_07': {
            output: () => {
              if (GameState.get('log07_deleted')) {
                return ['> ERROR: LOG_07 — FILE NOT FOUND'];
              }
              return [
                '> Deleting LOG_07.txt...',
                '> Done.',
                '> WARNING: Deletion logged.',
              ];
            },
            onExecute: () => {
              if (!GameState.get('log07_deleted')) {
                GameState.set('log07_deleted', true);
                GameState.executeCommand('DELETE_LOG_07');
                GameState.addButterflyStep('delete_log07');
                GameState.solvePuzzle(FORK_CONFIG.PUZZLES.LOG_FILE);
              }
            }
          },
          'READ SYSTEM_NOTES': {
            output: [
              '> SYSTEM_NOTES.txt',
              '─────────────────────────',
              'Door access code format: XXXX',
              'Hint: The answer is in what remains',
              'after the deletion.',
              '─────────────────────────',
            ],
            onExecute: () => {
              GameState.executeCommand('READ_SYSTEM_NOTES');
            }
          },
        },
        // Esse puzzle não tem solução direta — é exploração
        validator: () => true,
        consequences: [],
        consequenceHint: null,
      },

      // ── PUZZLE 2: Código da Porta ──────────────────────────
      [FORK_CONFIG.PUZZLES.DOOR_CODE]: {
        id:    FORK_CONFIG.PUZZLES.DOOR_CODE,
        title: 'PORTA DE SEGURANÇA',
        type:  'code',
        // Só disponível após deletar LOG_07 (efeito borboleta)
        requires: { log07_deleted: true },
        hint: 'O código mudou após a deleção.',
        // A pista: LOG_07 foi deletado no loop anterior.
        // O número de loops sem LOG_07 = código.
        // Solução: "0731" (referência ao log deletado)
        validator: (answer) => answer === '0731',
        consequences: [
          { key: 'door_unlocked', value: true },
          { butterfly: 'unlock_door' },
        ],
        consequenceHint: 'A porta de segurança foi desbloqueada.',
      },

      // ── PUZZLE 3: Sequência do Servidor ──────────────────
      [FORK_CONFIG.PUZZLES.SERVER_SEQUENCE]: {
        id:    FORK_CONFIG.PUZZLES.SERVER_SEQUENCE,
        title: 'SEQUÊNCIA DO SERVIDOR',
        type:  'sequence',
        requires: null,
        hint: 'Os painéis devem ser ativados na ordem correta.',
        // Sequência correta: A, C, B, D
        validator: (answer) => {
          const correct = ['A', 'C', 'B', 'D'];
          return JSON.stringify(answer) === JSON.stringify(correct);
        },
        consequences: [
          { key: 'server_rebooted', value: true },
          { butterfly: 'reboot_server' },
        ],
        consequenceHint: 'O servidor foi reiniciado. Algo mudou no próximo loop.',
      },

      // ── PUZZLE 4: Arquivo Oculto ──────────────────────────
      [FORK_CONFIG.PUZZLES.HIDDEN_FILE]: {
        id:    FORK_CONFIG.PUZZLES.HIDDEN_FILE,
        title: 'ARQUIVO OCULTO',
        type:  'association',
        // Requer servidor reiniciado E LOG_07 deletado
        requires: {
          server_rebooted:  true,
          log07_deleted:    true,
        },
        hint: 'Combine as informações de múltiplas fontes.',
        validator: (answer) => answer === 'BUTTERFLY',
        consequences: [
          { key: 'secret_area_found', value: true },
          { butterfly: 'find_project' },
          { awareness: 2 },
        ],
        consequenceHint: 'Uma área secreta foi desbloqueada.',
      },

      // ── PUZZLE 5: Sequência Borboleta (Final Secreto) ────
      [FORK_CONFIG.PUZZLES.BUTTERFLY]: {
        id:    FORK_CONFIG.PUZZLES.BUTTERFLY,
        title: 'PROJECT BUTTERFLY',
        type:  'butterfly',
        requires: { secret_area_found: true },
        hint: null, // sem pista — o jogador descobre sozinho
        validator: () => {
          const steps = GameState.get('butterfly_steps');
          const required = ['delete_log07', 'reboot_server', 'find_project', 'unlock_door'];
          return required.every(s => steps.includes(s));
        },
        consequences: [
          { butterfly: 'complete_sequence' },
        ],
        consequenceHint: null,
      },
    };
  }

  // ── Helpers ───────────────────────────────────────────────

  _checkRequires(requires) {
    return Object.entries(requires).every(([key, val]) => {
      return GameState.get(key) === val;
    });
  }

  _applyConsequences(consequences) {
    consequences.forEach(c => {
      if (c.key !== undefined) {
        GameState.set(c.key, c.value);
      }
      if (c.butterfly) {
        GameState.addButterflyStep(c.butterfly);
      }
      if (c.awareness) {
        GameState.increaseSystemAwareness(c.awareness);
      }
    });
  }
}
