import { FieldHelp } from '../FieldHelp/FieldHelp';
import type { FieldHelpProps } from '../FieldHelp/FieldHelp.types';
import { Heading } from './HelpHeading.style';

export const HelpHeading = ({ label, level = 'h4', ...help }: FieldHelpProps & { level?: 'h3' | 'h4' }) => (
  <Heading as={level}>{label}<FieldHelp label={label} {...help} inline /></Heading>
);
