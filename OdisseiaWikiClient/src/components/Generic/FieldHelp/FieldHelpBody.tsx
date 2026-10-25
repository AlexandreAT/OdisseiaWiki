import type { FieldHelpContent, FieldHelpParagraph, FieldHelpTone } from './FieldHelp.types';
import { HelpCode, HelpEmphasis, HelpItems, HelpTitle } from './FieldHelp.style';

// Highlight exact phrases as React text nodes. Explanations never execute HTML.
const HelpText = ({ text, highlights = [] }: FieldHelpParagraph) => {
  const phrases = highlights.filter((highlight) => highlight.text.length > 0)
    .slice().sort((left, right) => right.text.length - left.text.length);
  const segments = [];
  let cursor = 0;
  while (cursor < text.length) {
    let start = text.length;
    let selected: typeof phrases[number] | undefined;
    for (const phrase of phrases) {
      const index = text.indexOf(phrase.text, cursor);
      if (index >= 0 && index < start) { start = index; selected = phrase; }
    }
    if (start > cursor) segments.push(text.slice(cursor, start));
    if (!selected) break;
    const Part = selected.style === 'code' ? HelpCode : HelpEmphasis;
    segments.push(<Part key={start} $tone={selected.tone ?? 'accent'}>{selected.text}</Part>);
    cursor = start + selected.text.length;
  }
  return <>{segments}</>;
};

export const FieldHelpBody = ({ content, accent = 'accent', listStyle = 'bullets' }: {
  content: FieldHelpContent; accent?: FieldHelpTone; listStyle?: 'bullets' | 'plain';
}) => <>
  <HelpTitle $tone={accent}>{content.title}</HelpTitle>
  {content.text && <p><HelpText text={content.text} highlights={content.highlights} /></p>}
  {content.items && <HelpItems $plain={listStyle === 'plain'}>{content.items.map((item, index) =>
    <li key={index}><HelpText {...item} /></li>)}</HelpItems>}
  {content.options && <dl>{content.options.map((option) => <div key={option.label}>
    <dt>{option.label}</dt><dd>{option.text}</dd>
  </div>)}</dl>}
  {content.footer && <p data-help-footer><HelpText {...content.footer} /></p>}
</>;
