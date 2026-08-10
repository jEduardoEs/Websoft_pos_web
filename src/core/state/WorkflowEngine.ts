// Central Workflow Engine for WebSoft POS
// Single access point for validating state transitions across domains.

import { StateDomain } from './StateEnums';
import { DOMAIN_TRANSITION_MAPS } from './TransitionMap';
import { StateMachine } from './StateMachine';

export class WorkflowEngine {
  /**
   * Validates if a transition is allowed for a specified domain.
   * Throws an error if invalid.
   */
  static validateTransition(
    domain: StateDomain,
    fromState: string,
    toState: string
  ): void {
    const transitionMap = DOMAIN_TRANSITION_MAPS[domain];
    if (!transitionMap) {
      throw new Error(`Dominio de estado desconocido: ${domain}`);
    }

    StateMachine.assertValidTransition(fromState, toState, transitionMap, domain);
  }

  /**
   * Returns whether a transition is allowed for a specified domain.
   */
  static canTransition(
    domain: StateDomain,
    fromState: string,
    toState: string
  ): boolean {
    const transitionMap = DOMAIN_TRANSITION_MAPS[domain];
    if (!transitionMap) return false;
    return StateMachine.canTransition(fromState, toState, transitionMap);
  }

  /**
   * Gets allowed next states for a domain's current state.
   */
  static getAllowedNextStates(
    domain: StateDomain,
    currentState: string
  ): string[] {
    const transitionMap = DOMAIN_TRANSITION_MAPS[domain];
    if (!transitionMap) return [];
    return StateMachine.getNextStates(currentState, transitionMap);
  }

  /**
   * Checks if state is terminal for a domain.
   */
  static isTerminalState(
    domain: StateDomain,
    currentState: string
  ): boolean {
    const transitionMap = DOMAIN_TRANSITION_MAPS[domain];
    if (!transitionMap) return false;
    return StateMachine.isTerminal(currentState, transitionMap);
  }
}
