import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import { FeaturedButton, FeaturedLabel } from './FeaturedToggle.style';

interface FeaturedToggleProps {
  featured: boolean;
  onChange: (featured: boolean) => void;
  label?: string;
}

export const FeaturedToggle = ({
  featured,
  onChange,
  label = 'Em destaque',
}: FeaturedToggleProps) => (
  <FeaturedButton
    type="button"
    $featured={featured}
    onClick={() => onChange(!featured)}
    aria-pressed={featured}
    title={featured ? 'Remover destaque' : 'Adicionar destaque'}
  >
    {featured ? <StarIcon /> : <StarBorderIcon />}
    <FeaturedLabel $featured={featured}>{label}</FeaturedLabel>
  </FeaturedButton>
);
