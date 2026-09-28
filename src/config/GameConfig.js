// ============================================================
// FORK — GameConfig.js
// Constantes globais do jogo
// ============================================================

const FORK_CONFIG = {
  // Dimensões
  WIDTH: 960,
  HEIGHT: 640,

  // Loop
  LOOP_DURATION: 300,       // segundos por loop (5 min)
  LOOP_WARNING_TIME: 60,    // segundos antes do reset para alertar
  LOOP_CRITICAL_TIME: 30,   // segundos críticos (música acelera, glitch)
  MAX_LOOPS: 10,            // segurança para loop eterno

  // Cores (paleta FORK — green hacker)
  COLORS: {
    BG:           0x030a03,  // preto esverdeado
    BG_ALT:       0x050f05,
    GRID:         0x0a1a0a,
    ACCENT:       0x00ff41,  // verde matrix
    ACCENT_DIM:   0x00802a,
    ACCENT_BRIGHT:0x39ff14,  // verde neon vivo
    DANGER:       0xff2244,
    WARNING:      0xffaa00,
    TEXT:         0x00ff41,
    TEXT_DIM:     0x1a4d1a,
    TEXT_MID:     0x33aa33,
    TEXT_SYSTEM:  0x00cc33,
    TERMINAL_BG:  0x020802,
    HIGHLIGHT:    0x001a00,
    WHITE:        0xffffff,
    BLACK:        0x000000,
  },

  // Fonte padrão do jogo
  FONT: {
    FAMILY: '"Courier New", Courier, monospace',
    COLOR_PRIMARY:  '#00ff41',
    COLOR_DIM:      '#1a4d1a',
    COLOR_MID:      '#33aa33',
    COLOR_SYSTEM:   '#00cc33',
    COLOR_BRIGHT:   '#39ff14',
    COLOR_DANGER:   '#ff2244',
    COLOR_WARNING:  '#ffaa00',
    COLOR_WHITE:    '#ffffff',
  },

  // Velocidade do player
  PLAYER_SPEED: 160,

  // Interação
  INTERACT_RANGE: 80,       // pixels de distância para interagir

  // Puzzle IDs
  PUZZLES: {
    TERMINAL_MAIN:    'puzzle_terminal_main',
    LOG_FILE:         'puzzle_log_file',
    DOOR_CODE:        'puzzle_door_code',
    SERVER_SEQUENCE:  'puzzle_server_sequence',
    HIDDEN_FILE:      'puzzle_hidden_file',
    BUTTERFLY:        'puzzle_butterfly_sequence',
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
    COMMANDS_EXECUTED:    'commands_executed',  // array
  },

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
