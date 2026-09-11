// Reusable State Machine for WebSoft POS
// Handles transition validation and state checks without emojis or UI code.

export class StateMachine {
  /**
   * Checks if a transition from fromState to toState is allowed according to transitionMap.
   */
  static canTransition(
    fromState: string,
    toState: string,
    transitionMap: Record<string, string[]>
  ): boolean {
    if (fromState === toState) {
      return true; // No state change is always valid
    }

    const allowedTargets = transitionMap[fromState];
    if (!allowedTargets) {
      return false;
    }

    return allowedTargets.includes(toState);
  }

  /**
   * Returns list of allowed next states for a given current state.
   */
  static getNextStates(
    currentState: string,
    transitionMap: Record<string, string[]>
  ): string[] {
    return transitionMap[currentState] || [];
  }

  /**
   * Checks if the state is terminal (no further transitions allowed).
   */
  static isTerminal(
    currentState: string,
    transitionMap: Record<string, string[]>
  ): boolean {
    const nextStates = transitionMap[currentState];
    return Array.isArray(nextStates) && nextStates.length === 0;
  }

  /**
   * Validates a transition and throws an error if illegal.
   */
  static assertValidTransition(
    fromState: string,
    toState: string,
    transitionMap: Record<string, string[]>,
    domainName: string
  ): void {
    if (!this.canTransition(fromState, toState, transitionMap)) {
      throw new Error(
        `Transición de estado no permitida en ${domainName}: de '${fromState}' a '${toState}'.`
      );
    }
  }
}
