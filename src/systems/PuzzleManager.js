// ============================================================
// FORK — PuzzleManager.js  [v2 — Butterfly Effect Logic]
// Cada puzzle tem causa e efeito explícitos e rastreáveis
// ============================================================

class PuzzleManager {

  constructor() {
    this._puzzles = this._buildPuzzles();
  }

  get(id)            { return this._puzzles[id] || null; }
  isAvailable(id)    {
    const p = this._puzzles[id];
    if (!p) return false;
    if (GameState.isPuzzleSolved(id)) return false;
    if (p.requires && !this._checkRequires(p.requires)) return false;
    return true;
  }
  checkAnswer(id, answer) {
    const p = this._puzzles[id];
    if (!p) return false;

    // A UI não deve ser a única barreira: um puzzle só pode ser
    // validado depois que seus pré-requisitos narrativos forem cumpridos.
    if (p.requires && !this._checkRequires(p.requires)) return false;

    const correct = p.validator(answer);
    if (correct) {
      GameState.solvePuzzle(id);
      this._applyConsequences(p.consequences);
      return true;
    }
    if (FORK_CONFIG.CRITICAL_PUZZLES.includes(id) && window.LoopManagerInstance) {
      GameState.registerLoopError(id, 'Resposta incorreta em protocolo crítico.');
      window.LoopManagerInstance.collapse('PUZZLE_ERROR:' + id);
    }
    return false;
  }

  // ── Definição dos puzzles ─────────────────────────────────

  _buildPuzzles() {
    return {

      // ── PUZZLE 1: Terminal Principal ──────────────────────
      // Exploração livre — jogador descobre os logs
      // CADEIA: ler LOG_04 → suspeitar → buscar LOG_07 → deletar
      [FORK_CONFIG.PUZZLES.TERMINAL_MAIN]: {
        id:       FORK_CONFIG.PUZZLES.TERMINAL_MAIN,
        type:     'terminal',
        requires: null,
        commands: {

          'HELP': {
            output: [
              '> Available commands:',
              '  LIST        — list available files',
              '  READ [name] — read a file',
              '  DELETE [name] — delete a file',
              '  STATUS      — system status',
              '  SCAN        — scan environment',
              '  CLEAR       — clear terminal',
              '  DELETE ALL  — wipe the local simulation filesystem',
            ],
          },

          'STATUS': {
            output: () => {
              const loop      = GameState.get('loop_count');
              const awareness = GameState.get('system_awareness');
              const deleted   = GameState.get('log07_deleted');
              return [
                '> SYSTEM STATUS',
                `  LOOP:              ${loop}`,
                `  INTEGRITY:         ${deleted ? '91%' : '94%'}`,
                `  ACTIVE PROCESSES:  7`,
                `  ANOMALIES:         ${awareness}`,
                `  LOG ERRORS:        ${deleted ? '1 (LOG_07 missing)' : '0'}`,
                `  CORRUPTION:        ${GameState.get('corruption_level')}/5`,
              ];
            },
            onExecute: () => GameState.executeCommand('STATUS'),
          },

          'SCAN': {
            output: () => {
              const lines = [
                '> ENVIRONMENT SCAN',
                '  [TERMINAL]   — main_lab:180,220     — ACTIVE',
                '  [SERVER_A]   — control_room:750,130 — ' + (GameState.get('server_rebooted') ? 'REBOOTED' : 'STANDBY'),
                '  [DOOR]       — main_lab:878,300     — ' + (GameState.get('door_unlocked') ? 'UNLOCKED' : 'LOCKED'),
                '  [CAM-01]     — main_lab:855,70      — RECORDING',
                '  [ENTITY ???] — storage:160,510      — UNKNOWN',
              ];
              if (GameState.get('server_rebooted') && GameState.get('log07_deleted')) {
                lines.push('  [PROJECT_B]  — storage:700,490    — DECRYPTION REQUIRED');
              }
              return lines;
            },
            onExecute: () => GameState.executeCommand('SCAN'),
          },

          'LIST': {
            output: () => {
              const files = [
                '> FILES IN CURRENT DIRECTORY:',
                '  LOG_01.txt',
                '  LOG_04.txt',
                '  SYSTEM_NOTES.txt',
              ];
              if (!GameState.get('log07_deleted')) {
                files.push('  LOG_07.txt');
              } else {
                // Efeito borboleta visível: arquivo sumiu, mas deixou rastro
                files.push('  [LOG_07.txt — REMOVED]  // timestamp: 07:31');
              }
              if (GameState.get('server_rebooted')) {
                files.push('  /restricted/PROJECT_B.fragment  [READ ONLY]');
              }
              return files;
            },
          },

          'READ LOG_01': {
            output: [
              '> LOG_01.txt',
              '──────────────────────────────',
              'INITIALIZATION REPORT — CYCLE 01',
              'Subject successfully placed in simulation.',
              'Behavioral baseline: established.',
              'Memory suppression: active.',
              'Note: subject unaware of loop structure.',
              '──────────────────────────────',
            ],
            onExecute: () => GameState.executeCommand('READ_LOG_01'),
          },

          // Gatilho da Cadeia 3 — jogador percebe que é "subject"
          'READ LOG_04': {
            output: [
              '> LOG_04.txt',
              '──────────────────────────────',
              'BEHAVIORAL REPORT — CYCLE 04',
              'Subject does not yet suspect the nature',
              'of the environment.',
              'Curiosity index: within expected parameters.',
              'Recommended: maintain current loop parameters.',
              'Identity monitoring: active.',
              '──────────────────────────────',
              '// NOTE: who is "subject"?',
            ],
            onExecute: () => {
              GameState.executeCommand('READ_LOG_04');
              // Ler LOG_04 aumenta curiosidade — jogador vai procurar mais
              GameState.increaseSystemAwareness(1);
            },
          },

          // Gatilho principal da Cadeia 1
          'READ LOG_07': {
            output: () => {
              if (GameState.get('log07_deleted')) {
                return [
                  '> ERROR: LOG_07.txt — FILE NOT FOUND',
                  '  Last known entry: LOOP ' + (GameState.get('loop_count') - 1),
                  '  Deletion timestamp: 07:31',
                  '  // The file is gone. But the timestamp remains.',
                ];
              }
              return [
                '> LOG_07.txt',
                '──────────────────────────────',
                'ANOMALY REPORT',
                'Subject attempted access to restricted directory.',
                'Behavioral deviation: +12% above baseline.',
                'ACTION TAKEN: flag for enhanced monitoring.',
                '',
                'Identity confirmed: [REDACTED]',
                'Cross-reference: PROJECT BUTTERFLY — var. #7',
                '──────────────────────────────',
                '// They know who you are.',
                '// Do you want them to keep this file?',
              ];
            },
            onExecute: () => {
              if (!GameState.get('log07_deleted')) {
                GameState.executeCommand('READ_LOG_07');
                GameState.set('player_identity_known', true);
                GameState.increaseSystemAwareness(1);
              }
            },
          },

          // Ação central da Cadeia 1
          'DELETE LOG_07': {
            output: () => {
              if (GameState.get('log07_deleted')) {
                return [
                  '> ERROR: LOG_07.txt — already removed.',
                  '  Deletion timestamp on record: 07:31',
                ];
              }
              return [
                '> Deleting LOG_07.txt...',
                '> File removed.',
                '> WARNING: Deletion event logged by system.',
                '  Timestamp: 07:31',
                '// The file is gone.',
                '// But the system saw what you did.',
                '// And it remembers the time.',
              ];
            },
            onExecute: () => {
              if (!GameState.get('log07_deleted')) {
                GameState.set('log07_deleted', true);
                GameState.executeCommand('DELETE_LOG_07');
                GameState.addButterflyStep('delete_log07');
                GameState.solvePuzzle(FORK_CONFIG.PUZZLES.LOG_FILE);
                // Efeito borboleta: a hora do delete (07:31) vira a senha
                // O jogador vai encontrar essa pista no próximo loop
              }
            },
          },

          // Fragmento do PROJECT_B — só aparece se servidor reiniciado
          'READ /RESTRICTED/PROJECT_B.FRAGMENT': {
            output: () => {
              if (!GameState.get('server_rebooted')) {
                return ['> ERROR: /restricted/ — ACCESS DENIED'];
              }
              return [
                '> /restricted/PROJECT_B.fragment',
                '──────────────────────────────',
                'PROJECT BUTTERFLY — EXCERPT',
                'Simulation variable codename: BUTTERFLY',
                'Primary objective: observe subject response',
                'to cascading consequence chains.',
                '',
                'Each action. Each loop.',
                'We are watching the pattern.',
                '──────────────────────────────',
                '// This file is a fragment.',
                '// The full document is encrypted elsewhere.',
                '// Key: the name of this project.',
              ];
            },
            onExecute: () => {
              if (GameState.get('server_rebooted')) {
                GameState.executeCommand('READ_PROJECT_B_FRAGMENT');
              }
            },
          },

          'READ SYSTEM_NOTES': {
            output: () => {
              const deleted = GameState.get('log07_deleted');
              const wiped = GameState.get('filesystem_wiped');

              if (wiped && !GameState.get('system_notes_read')) {
                return [
                  '> ERROR: SYSTEM_NOTES.txt — FILESYSTEM UNAVAILABLE',
                  '  Recovery data was not cached.',
                  '// Some information only exists if you noticed it before the wipe.',
                ];
              }

              const lines = [
                '> SYSTEM_NOTES.txt',
                '──────────────────────────────',
                'SECURITY DOOR — ACCESS PROTOCOL',
                'Format: 4-digit numeric code.',
                '──────────────────────────────',
              ];

              if (deleted) {
                lines.push('ANOMALY DETECTED: LOG_07 removed.');
                lines.push('Deletion event timestamp: 07:31');
                lines.push('// The system recorded when you acted.');
                lines.push('// What time did it happen?');
              } else {
                lines.push('Access code: classified.');
                lines.push('// Find what the system is hiding.');
              }

              lines.push('');
              lines.push('RECOVERY CHANNEL // INTEGRITY < 60%');
              lines.push('KEY: 7 — 3 — 1 — 9');
              lines.push('// Keep this outside the terminal.');
              lines.push('// It cannot be reconstructed after a wipe.');

              GameState.set('system_notes_read', true);
              return lines;
            },
            onExecute: () => {
              GameState.executeCommand('READ_SYSTEM_NOTES');
              if (!GameState.get('filesystem_wiped') || GameState.get('system_notes_read')) {
                GameState.set('system_notes_read', true);
              }
            },
          },

          'RESTORE 7319': {
            output: () => {
              if (!GameState.get('system_notes_read')) {
                return [
                  '> RECOVERY DENIED.',
                  '  Recovery key not present in memory.',
                ];
              }
              if (GameState.get('corruption_level') < 3) {
                return [
                  '> RECOVERY LOCKED.',
                  '  Integrity threshold not reached.',
                  '  Nothing needs to be restored.',
                ];
              }
              return [
                '> RECOVERY KEY ACCEPTED.',
                '> RESTORING SIMULATION STATE...',
                '> Rebuilding deleted environment nodes.',
                '> Reconnecting physical layer.',
                '> SYSTEM RESTORE QUEUED.',
              ];
            },
            onExecute: () => {
              if (GameState.get('system_notes_read') &&
                  GameState.get('corruption_level') >= 3) {
                GameState.restoreSystem();
              }
            },
          },

          'CLEAR': {
            output: () => {
              const next = GameState.get('clear_count') + 1;
              const lines = [
                '> LIMPANDO MEMÓRIA DO TERMINAL...',
                '> BUFFER LOCAL APAGADO.',
                '',
              ];

              if (next === 1) {
                lines.push(
                  'AVISO: pequena oscilação detectada no ambiente.',
                  '// Um monitor secundário deixou de responder.'
                );
              } else if (next === 2) {
                lines.push(
                  'AVISO: a limpeza está afetando a simulação.',
                  '// Alguns elementos decorativos desapareceram.',
                  '// Isto não deveria acontecer.'
                );
              } else if (next === 3) {
                lines.push(
                  'ERRO: LIMPEZA EXCESSIVA.',
                  'A simulação está perdendo objetos persistentes.',
                  '// Você está apagando mais do que o terminal.'
                );
              } else if (next === 4) {
                lines.push(
                  'ALERTA CRÍTICO: ESTRUTURA DA SIMULAÇÃO INSTÁVEL.',
                  'Partes do ambiente não puderam ser restauradas.',
                  '// O sistema está reagindo à sua ação.'
                );
              } else {
                lines.push(
                  'FALHA CRÍTICA: CASCATA DE CORRUPÇÃO.',
                  'A limpeza atingiu estruturas do experimento.',
                  '// PARE. O sistema não consegue desfazer isso.'
                );
              }

              return lines;
            },
            onExecute: () => GameState.registerClear(),
          },

          'DELETE ALL': {
            output: [
              '> WARNING: MASS FILE DELETION REQUESTED.',
              '> All local simulation files will be removed.',
              '> This action cannot be predicted.',
              '> CONSEQUENCE CHAIN: UNKNOWN',
            ],
            onExecute: () => GameState.wipeFilesystem(),
          },
        },
        validator: () => true,
        consequences: [],
      },

      // ── PUZZLE 0: Chave de inicialização ──────────────────
      [FORK_CONFIG.PUZZLES.BOOT_CODE]: {
        id: FORK_CONFIG.PUZZLES.BOOT_CODE,
        type: 'code',
        requires: null,
        validator: answer => answer === '0731',
        consequences: [
          { key: 'boot_code_found', value: true },
          { key: 'phase', value: FORK_CONFIG.PHASES.ANOMALY },
          { butterfly: 'boot_0731' },
        ],
      },

      // ── PUZZLE 1B: Código físico da porta do servidor ───────
      [FORK_CONFIG.PUZZLES.DOOR_CODE]: {
        id: FORK_CONFIG.PUZZLES.DOOR_CODE,
        type: 'code',
        requires: { boot_code_found: true, log07_deleted: true },
        validator: answer => answer.trim() === '0731',
        consequences: [
          { key: 'door_unlocked', value: true },
          { key: 'phase', value: FORK_CONFIG.PHASES.INFILTRATION },
          { butterfly: 'unlock_door' },
        ],
      },


      // ── PUZZLE 1C: Senha da saída ─────────────────────────
      // A senha é a hora local do computador no momento da tentativa.
      // O jogador deve digitar HHMM; o horário nunca é exibido pelo puzzle.
      [FORK_CONFIG.PUZZLES.EXIT_CODE]: {
        id:    FORK_CONFIG.PUZZLES.EXIT_CODE,
        type:  'code',
        requires: { door_unlocked: true, system_notes_read: true },
        validator: answer => {
          const now = new Date();
          const currentHHMM =
            String(now.getHours()).padStart(2, '0') +
            String(now.getMinutes()).padStart(2, '0');
          return answer.trim() === currentHHMM;
        },
        consequences: [],
      },

      // ── PUZZLE 2: Handshake da Porta ───────────────────────
      // CADEIA: LOG_07 removido → protocolo de acesso é exposto →
      // jogador precisa reproduzir o handshake do Control Server.
      [FORK_CONFIG.PUZZLES.DOOR_SEQUENCE]: {
        id:    FORK_CONFIG.PUZZLES.DOOR_SEQUENCE,
        type:  'sequence',
        requires: { log07_deleted: true },
        validator: (answer) => JSON.stringify(answer) === JSON.stringify([
          'TRACE', 'AUTH', 'SYNC', 'OPEN'
        ]),
        consequences: [
          { key: 'door_unlocked', value: true },
          { butterfly: 'unlock_door' },
        ],
      },

      // ── PUZZLE 3: Sequência do Servidor ──────────────────
      // CADEIA: LOG_07 deletado → servidor fica acessível → ordem A B C D
      // Pista: interagir com o servidor mostra 1, 2, 3 e 4 pulsos
      [FORK_CONFIG.PUZZLES.SERVER_SEQUENCE]: {
        id:    FORK_CONFIG.PUZZLES.SERVER_SEQUENCE,
        type:  'sequence',
        requires: { log07_deleted: true },
        // A pista visual indica intensidade; a interface não revela a sequência.
        validator: (answer) => JSON.stringify(answer) === JSON.stringify(['D', 'C', 'B', 'A']),
        consequences: [
          { key: 'server_rebooted', value: true },
          { butterfly: 'reboot_server' },
        ],
      },

      // ── PUZZLE 4: Arquivo Oculto ──────────────────────────
      // CADEIA: servidor reiniciado → pasta /restricted acessível →
      //         fragmento diz "key: name of this project" → BUTTERFLY
      [FORK_CONFIG.PUZZLES.HIDDEN_FILE]: {
        id:    FORK_CONFIG.PUZZLES.HIDDEN_FILE,
        type:  'word',
        requires: { server_rebooted: true, log07_deleted: true },
        validator: (answer) => answer.trim().toUpperCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '') === 'BRASILIA',
        consequences: [
          { key: 'secret_area_found', value: true },
          { butterfly: 'find_project' },
          { awareness: 2 },
        ],
      },

      // ── FASE 4: CÂMARA DO OBSERVADOR ─────────────────────
      [FORK_CONFIG.PUZZLES.MEMORY_CODE]: {
        id: FORK_CONFIG.PUZZLES.MEMORY_CODE,
        type: 'code',
        requires: { secret_area_found: true },
        validator: answer => answer === '4217',
        consequences: [
          { key: 'memory_code_found', value: true },
          { key: 'observer_unlocked', value: true },
          { key: 'phase', value: FORK_CONFIG.PHASES.OBSERVER },
          { awareness: 1 },
        ],
      },

      [FORK_CONFIG.PUZZLES.OBSERVER_SEQUENCE]: {
        id: FORK_CONFIG.PUZZLES.OBSERVER_SEQUENCE,
        type: 'sequence',
        requires: { observer_unlocked: true },
        validator: answer => JSON.stringify(answer) === JSON.stringify(['WATCH', 'PAUSE', 'RELEASE']),
        consequences: [
          { butterfly: 'observer_truth' },
          { awareness: 1 },
        ],
      },

      [FORK_CONFIG.PUZZLES.IDENTITY_WORD]: {
        id: FORK_CONFIG.PUZZLES.IDENTITY_WORD,
        type: 'word',
        requires: { observer_unlocked: true },
        validator: answer => answer.trim().toUpperCase() === 'ORIGIN',
        consequences: [
          { key: 'identity_fragment_found', value: true },
          { key: 'player_identity_known', value: true },
          { awareness: 1 },
        ],
      },

      // ── PUZZLE 5: Sequência Borboleta ─────────────────────
      [FORK_CONFIG.PUZZLES.BUTTERFLY]: {
        id:    FORK_CONFIG.PUZZLES.BUTTERFLY,
        type:  'butterfly',
        requires: { secret_area_found: true },
        validator: () => {
          const steps    = GameState.get('butterfly_steps');
          const required = ['delete_log07', 'reboot_server', 'find_project', 'unlock_door'];
          return required.every(s => steps.includes(s));
        },
        consequences: [
          { butterfly: 'complete_sequence' },
          { key: 'fork_sequence_complete', value: true },
        ],
      },

      // Alias interno para LOG_FILE
      [FORK_CONFIG.PUZZLES.LOG_FILE]: {
        id: FORK_CONFIG.PUZZLES.LOG_FILE,
        type: 'internal',
        requires: null,
        validator: () => true,
        consequences: [],
      },
    };
  }

  _checkRequires(requires) {
    return Object.entries(requires).every(([k, v]) => GameState.get(k) === v);
  }

  _applyConsequences(consequences) {
    consequences.forEach(c => {
      if (c.key !== undefined)  GameState.set(c.key, c.value);
      if (c.butterfly)          GameState.addButterflyStep(c.butterfly);
      if (c.awareness)          GameState.increaseSystemAwareness(c.awareness);
    });
  }
}
