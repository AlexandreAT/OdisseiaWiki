import React from 'react';
import { JSONContent } from '../../../models/Characters';
import { jsonContentToString } from '../../../utils/richTextHelpers';

interface RichTextDisplayProps {
  content: JSONContent | string | undefined;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Componente simples para exibir JSONContent como texto
 * Para funcionalidade completa com formatação, use um editor TipTap em modo readonly
 */
export const RichTextDisplay: React.FC<RichTextDisplayProps> = ({ 
  content, 
  className = '', 
  style = {} 
}) => {
  if (!content) {
    return null;
  }

  const textContent = jsonContentToString(content);

  return (
    <div className={className} style={{ whiteSpace: 'pre-wrap', ...style }}>
      {textContent}
    </div>
  );
};
