// ============================================================
// FORK — GameConfig.js
// Constantes globais do jogo
// ============================================================

const FORK_CONFIG = {
  // Dimensões
  WIDTH: 960,
  HEIGHT: 640,

  // Loop
  LOOP_DURATION: 451,       // relógio inicial: 07:31
  LOOP_WARNING_TIME: 120,   // alerta de tempo, sem reiniciar o loop
  LOOP_CRITICAL_TIME: 60,   // alerta crítico, sem reiniciar o loop
  MAX_LOOPS: 5,             // segurança para loop eterno

  // Cores (paleta FORK — green hacker)
  COLORS: {
    BG:           0x070b10,  // preto azulado
    BG_ALT:       0x0c1219,
    GRID:         0x16202a,
    ACCENT:       0x59d8ff,  // ciano
    ACCENT_DIM:   0x2e718b,
    ACCENT_BRIGHT:0x9be8ff,  // ciano claro
    MAGENTA:      0xff4fd8,
    PURPLE:       0x9b7bff,
    GREEN:        0x55e6a5,
    ORANGE:       0xff9d4d,
    DANGER:       0xff6678,
    WARNING:      0xffaa00,
    TEXT:         0x7ed6ff,
    TEXT_DIM:     0x40515f,
    TEXT_MID:     0x76a7ba,
    TEXT_SYSTEM:  0x72d2ee,
    TERMINAL_BG:  0x071018,
    HIGHLIGHT:    0x0d1720,
    WHITE:        0xffffff,
    BLACK:        0x000000,
  },

  // Fonte padrão do jogo
  FONT: {
    // Share Tech Mono — texto de terminal, HUD, diálogos, labels do mapa
    FAMILY:       "'Share Tech Mono', 'Courier New', monospace",
    // VT323 — títulos grandes, FORK logo, tela de reset, finais
    FAMILY_TITLE: "'VT323', 'Share Tech Mono', monospace",

    COLOR_PRIMARY:  '#59d8ff',
    COLOR_DIM:      '#40515f',
    COLOR_MID:      '#76a7ba',
    COLOR_SYSTEM:   '#72d2ee',
    COLOR_BRIGHT:   '#9be8ff',
    COLOR_MAGENTA:  '#ff4fd8',
    COLOR_PURPLE:   '#9b7bff',
    COLOR_GREEN:    '#55e6a5',
    COLOR_ORANGE:   '#ff9d4d',
    COLOR_DANGER:   '#ff2244',
    COLOR_WARNING:  '#ffaa00',
    COLOR_WHITE:    '#ffffff'
  },

  // Velocidade do player
  PLAYER_SPEED: 90,

  // Interação
  INTERACT_RANGE: 80,       // pixels de distância para interagir

  // Progressão em cinco fases dentro do mesmo mapa.
  PHASES: {
    AWAKENING: 1,
    ANOMALY: 2,
    INFILTRATION: 3,
    OBSERVER: 4,
    FORK: 5,
  },

  // Puzzle IDs
  PUZZLES: {
    TERMINAL_MAIN:    'puzzle_terminal_main',
    BOOT_CODE:        'puzzle_boot_code',
    LOG_FILE:         'puzzle_log_file',
    DOOR_CODE:        'puzzle_door_code',
    EXIT_CODE:        'puzzle_exit_code',
    DOOR_SEQUENCE:    'puzzle_door_sequence',
    SERVER_SEQUENCE:  'puzzle_server_sequence',
    HIDDEN_FILE:      'puzzle_hidden_file',
    BUTTERFLY:        'puzzle_butterfly_sequence',
    MEMORY_CODE:      'puzzle_memory_code',
    OBSERVER_SEQUENCE: 'puzzle_observer_sequence',
    IDENTITY_WORD:    'puzzle_identity_word',
  },

  // Variáveis de estado persistentes entre loops
  STATE_VARS: {
    LOOP_COUNT:           'loop_count',
    LOG07_DELETED:        'log07_deleted',
    SERVER_REBOOTED:      'server_rebooted',
    DOOR_UNLOCKED:        'door_unlocked',
    SECRET_AREA_FOUND:    'secret_area_found',
    ENTITY_TRUST:         'entity_trust',       // 0-3
    SYSTEM_AWARENESS:     'system_awareness',   // 0-5
    BUTTERFLY_STEPS:      'butterfly_steps',    // array de passos
    PLAYER_IDENTITY_KNOWN:'player_identity_known',
    ESCAPE_ATTEMPTED:     'escape_attempted',
    PHASE:                'phase',
    MEMORY_CODE_FOUND:    'memory_code_found',
    OBSERVER_UNLOCKED:    'observer_unlocked',
    IDENTITY_FRAGMENT_FOUND: 'identity_fragment_found',
    FORK_SEQUENCE_COMPLETE: 'fork_sequence_complete',
    COMMANDS_EXECUTED:    'commands_executed',  // array
  },

  // Puzzles cuja falha provoca LOOP COLLAPSE.
  CRITICAL_PUZZLES: [
    'puzzle_boot_code',
    'puzzle_door_code',
    'puzzle_server_sequence',
  ],

  // Tipos de finais
  ENDINGS: {
    ESCAPE:        'ending_escape',
    RESET:         'ending_reset',
    ETERNAL_LOOP:  'ending_eternal_loop',
    CONTROLLED:    'ending_controlled',
    BUTTERFLY:     'ending_butterfly',
  },

  // Tipos de objeto interativo
  OBJECT_TYPES: {
    TERMINAL:   'terminal',
    FILE:       'file',
    DOOR:       'door',
    SERVER:     'server',
    PANEL:      'panel',
    CAMERA:     'camera',
    OBJECT:     'object',
  },

  // Camadas do tilemap
  LAYERS: {
    FLOOR:   'floor',
    WALLS:   'walls',
    OBJECTS: 'objects',
    ABOVE:   'above',
  },
};
