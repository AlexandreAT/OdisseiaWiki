import React from 'react';
import { StepDot, StepDotsAnchor, StepDotsContainer } from './CharacterStepDots.style';
import { CharacterStepDotsProps } from './CharacterStepDots.type';

export const CharacterStepDots: React.FC<CharacterStepDotsProps> = ({
  theme,
  neon,
  activeStep,
  onStepClick,
}) => {
  return (
    <StepDotsAnchor>
      <StepDotsContainer>
        <StepDot
          type="button"
          theme={theme}
          neon={neon}
          active={activeStep === 1}
          onClick={() => onStepClick(1)}
          title="Ir para página 1"
        />
        <StepDot
          type="button"
          theme={theme}
          neon={neon}
          active={activeStep === 2}
          onClick={() => onStepClick(2)}
          title="Ir para página 2"
        />
      </StepDotsContainer>
    </StepDotsAnchor>
  );
};
