export interface CharacterStepDotsProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  activeStep: 1 | 2;
  onStepClick: (step: 1 | 2) => void;
}
