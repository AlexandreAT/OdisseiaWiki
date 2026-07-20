import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { VisibilityButton, VisibilityLabel } from './VisibilityToggle.style';

interface VisibilityToggleProps {
  visible: boolean;
  onChange: (visible: boolean) => void;
  label?: string;
}

export const VisibilityToggle = ({
  visible,
  onChange,
  label = 'Conteúdo visível',
}: VisibilityToggleProps) => (
  <VisibilityButton
    type="button"
    $visible={visible}
    onClick={() => onChange(!visible)}
    aria-pressed={visible}
    title={visible ? 'Ocultar conteúdo' : 'Tornar conteúdo visível'}
  >
    {visible ? <VisibilityOutlinedIcon /> : <VisibilityOffOutlinedIcon />}
    <VisibilityLabel $visible={visible}>{label}</VisibilityLabel>
  </VisibilityButton>
);
