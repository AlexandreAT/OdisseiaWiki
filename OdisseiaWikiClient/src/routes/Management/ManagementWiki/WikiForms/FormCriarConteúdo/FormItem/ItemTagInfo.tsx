import { BiInfoCircle } from 'react-icons/bi';
import {
  TagInfoDetails,
  TagInfoPopover,
  TagInfoSummary,
} from './FormItem.style';

interface ItemTagInfoProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const ItemTagInfo = ({ theme, neon }: ItemTagInfoProps) => (
  <TagInfoDetails theme={theme} neon={neon}>
    <TagInfoSummary theme={theme} neon={neon} aria-label="Informações sobre tags especiais">
      <BiInfoCircle aria-hidden="true" />
    </TagInfoSummary>
    <TagInfoPopover theme={theme} neon={neon}>
      <strong>Tags especiais</strong>
      <p><b>Único:</b> destaca o item em verde na página pública.</p>
      <p><b>Lendário:</b> destaca o item em amarelo dourado na página pública.</p>
      <p>Com o neon ativo, essas tags recebem uma animação contínua na borda.</p>
    </TagInfoPopover>
  </TagInfoDetails>
);
