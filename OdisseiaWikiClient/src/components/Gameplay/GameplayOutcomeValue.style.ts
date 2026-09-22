import styled from 'styled-components';
import type { GameplayOutcomeTone } from '../../utils/gameplayOutcome';

export const GameplayOutcomeValue = styled.strong<{ $tone: GameplayOutcomeTone }>`
  && {
    color: ${({ $tone }) => $tone === 'success'
      ? 'var(--clearneonGreen)'
      : $tone === 'failure'
        ? 'var(--clearneonRed)'
        : 'var(--clearneonBlue)'};
  }
`;
