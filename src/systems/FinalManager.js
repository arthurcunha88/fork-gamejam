// ============================================================
// FORK — FinalManager.js
// Verifica condições e dispara os 5 finais
// ============================================================

class FinalManager {

  constructor(scene) {
    this.scene = scene;
    this._triggered = false;
  }

  /** Chamado a cada update — verifica se algum final foi atingido */
  check() {
    if (this._triggered) return;

    const ending = GameState.checkEndingConditions();
    if (ending) {
      this.trigger(ending);
    }
  }

  /** Força um final específico */
  trigger(endingId) {
    if (this._triggered) return;
    this._triggered = true;

    console.log(`[FINAL] Triggering ending: ${endingId}`);
    GameState.set('ending_flags', { id: endingId, loop: GameState.get('loop_count') });

    // Pequeno delay para dramatizar
    this.scene.time.delayedCall(800, () => {
      this.scene.scene.start('EndScene', { endingId });
    });
  }

  reset() {
    this._triggered = false;
  }
}
