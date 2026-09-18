import { CyberButton } from '../HighlightButton/HighlightButton';
import { MultiStepNavigationContainer } from './MultiStepNavigation.style';

export interface MultiStepNavigationAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  colorType?: 'primary' | 'secondary';
}

interface MultiStepNavigationProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  position: 'top' | 'bottom';
  previous: MultiStepNavigationAction;
  next: MultiStepNavigationAction;
  save?: MultiStepNavigationAction;
}

const ActionButton = ({ action, theme, neon }: {
  action: MultiStepNavigationAction;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}) => (
  <CyberButton
    type="button"
    theme={theme}
    neon={neon}
    colorType={action.colorType}
    text={action.label}
    width="200px"
    onClick={action.onClick}
    disabled={action.disabled}
    loading={action.loading}
  />
);

/** Shared controls for every multi-step form; render it once at each end of the current step. */
export const MultiStepNavigation = ({
  theme,
  neon,
  position,
  previous,
  next,
  save,
}: MultiStepNavigationProps) => (
  <MultiStepNavigationContainer
    $position={position}
    aria-label={`Navegação das etapas do formulário — ${position === 'top' ? 'topo' : 'base'}`}
  >
    <ActionButton action={previous} theme={theme} neon={neon} />
    {save && <ActionButton action={save} theme={theme} neon={neon} />}
    <ActionButton action={next} theme={theme} neon={neon} />
  </MultiStepNavigationContainer>
);
