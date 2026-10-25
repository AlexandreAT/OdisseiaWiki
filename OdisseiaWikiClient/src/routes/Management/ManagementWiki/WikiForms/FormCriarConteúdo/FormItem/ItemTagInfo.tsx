import { FieldHelp } from '../../../../../../components/Generic/FieldHelp/FieldHelp';
import type { FieldHelpContent } from '../../../../../../components/Generic/FieldHelp/FieldHelp.types';
import wikiHelp from '../../../../../../content/wikiHelp.pt-BR.json';

interface ItemTagInfoProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const ItemTagInfo = ({ theme, neon }: ItemTagInfoProps) => (
  <FieldHelp label="Tags especiais" theme={theme} neon={neon} help={wikiHelp.itemTags as FieldHelpContent} inline />
);
