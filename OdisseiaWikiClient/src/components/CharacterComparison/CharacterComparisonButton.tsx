import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { CompareButton } from './CharacterComparison.style';

interface CharacterComparisonButtonProps {
  onClick: () => void;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  absolute?: boolean;
  className?: string;
}

export const CharacterComparisonButton = ({
  onClick,
  theme,
  neon,
  absolute = false,
  className,
}: CharacterComparisonButtonProps) => (
  <CompareButton
    type="button"
    className={className}
    $absolute={absolute}
    $theme={theme}
    $neon={neon === 'on'}
    title="Comparar personagem"
    aria-label="Comparar personagem"
    onClick={(event) => {
      event.preventDefault();
      event.stopPropagation();
      onClick();
    }}
  >
    <CompareArrowsIcon />
  </CompareButton>
);
