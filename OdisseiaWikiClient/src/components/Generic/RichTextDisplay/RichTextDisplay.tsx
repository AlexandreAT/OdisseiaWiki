import React from 'react';
import { JSONContent } from '../../../models/Characters';
import { isJSONContent, normalizeToJSONContent } from '../../../utils/richTextHelpers';

interface RichTextDisplayProps {
  content: JSONContent | string | undefined;
  className?: string;
  style?: React.CSSProperties;
}

// Minimal renderer: supports paragraphs, headings, bullet/ordered lists, list items, hardBreak and basic text marks (bold/italic/underline)
const renderNode = (node: JSONContent, key?: React.Key): React.ReactNode => {
  if (!node) return null;

  if (node.type === 'text' || node.text) {
    let el: React.ReactNode = node.text || '';
    if (node.marks && Array.isArray(node.marks)) {
      node.marks.forEach(mark => {
        switch (mark.type) {
          case 'bold':
          case 'strong':
            el = <strong key={String(key)}>{el}</strong>;
            break;
          case 'italic':
          case 'em':
            el = <em key={String(key)}>{el}</em>;
            break;
          case 'underline':
            el = <u key={String(key)}>{el}</u>;
            break;
          case 'link':
            el = <a key={String(key)} href={mark.attrs?.href || '#'} target="_blank" rel="noreferrer">{el}</a>;
            break;
          default:
            break;
        }
      });
    }
    return el;
  }

  const children = (node.content || []).map((c, i) => renderNode(c, `${String(key || '')}-${i}`));

  switch (node.type) {
    case 'doc':
      return <>{children}</>;
    case 'paragraph': {
      const attrs = (node.attrs || {}) as any;
      const align = attrs.align || attrs.textAlign || 'left';
      return <p key={key} style={{ margin: '0 0 12px', textAlign: align }}>{children}</p>;
    }
    case 'heading':
      // level in attrs.level
      const level = (node.attrs && node.attrs.level) || 2;
      const H = `h${Math.min(6, Math.max(1, Number(level)))}` as keyof JSX.IntrinsicElements;
      return React.createElement(H, { key, style: { margin: '8px 0' } }, children);
    case 'bulletList':
      return <ul key={key} style={{ margin: '0 0 12px 20px' }}>{children}</ul>;
    case 'orderedList':
      return <ol key={key} style={{ margin: '0 0 12px 20px' }}>{children}</ol>;
    case 'listItem':
      return <li key={key}>{children}</li>;
    case 'hardBreak':
      return <br key={key} />;
    case 'blockquote':
      return <blockquote key={key} style={{ margin: '0 0 12px', paddingLeft: 12, borderLeft: '3px solid rgba(0,0,0,0.1)' }}>{children}</blockquote>;
    case 'codeBlock':
      return <pre key={key} style={{ background: 'rgba(0,0,0,0.04)', padding: 12, borderRadius: 6, overflow: 'auto' }}>{children}</pre>;
    default:
      return <div key={key}>{children}</div>;
  }
};

export const RichTextDisplay: React.FC<RichTextDisplayProps> = ({ content, className = '', style = {} }) => {
  if (!content) return null;

  // Normalize to JSONContent
  let normalized: JSONContent;
  if (typeof content === 'string') {
    const trimmed = content.trim();
    const looksLikeJson = (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']')) || (trimmed.startsWith('"') && trimmed.endsWith('"'));
    if (looksLikeJson) {
      try {
        const parsed = JSON.parse(trimmed);
        normalized = isJSONContent(parsed) ? (parsed as JSONContent) : normalizeToJSONContent(parsed);
      } catch {
        normalized = normalizeToJSONContent(content as any);
      }
    } else {
      normalized = normalizeToJSONContent(content as any);
    }
  } else {
    normalized = (!isJSONContent(content)) ? normalizeToJSONContent(content as any) : (content as JSONContent);
  }

  return (
    <div className={className} style={{ ...style }}>
      {renderNode(normalized)}
    </div>
  );
};
