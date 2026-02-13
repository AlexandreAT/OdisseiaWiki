import styled, { keyframes, css } from 'styled-components';

interface Props {
  theme?: 'dark' | 'light';
  neon?: 'on' | 'off';
  focus?: boolean;
  active?: boolean;
  error?: boolean;
  required?: boolean;
  typeStyle?: 'primary' | 'secondary';
  width?: string;
  height?: string;
  minHeight?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

const glitchBorder = keyframes`
  0% { border-color: var(--clearneonRed); }
  30% { border-color: var(--clearneonBlue); }
  60% { border-color: var(--clearneonPink); }
  100% { border-color: var(--clearneonRed); }
`;

const getBlue = (typeStyle?: 'primary' | 'secondary') =>
  typeStyle === 'secondary' ? 'var(--clearneonPink)' : 'var(--clearneonBlue)';
const getPink = (typeStyle?: 'primary' | 'secondary') =>
  typeStyle === 'secondary' ? 'var(--clearneonBlue)' : 'var(--clearneonPink)';

export const ContentController = styled.div<Props>`
  position: relative;
  border: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  border-radius: 7px;
  align-items: flex-start;
  width: ${({ width }) => width || `100%`};
  ${({ height }) => height && `height: ${height};`}

  ${({ fullWidth }) =>
    fullWidth &&
    `grid-column: span 2;`
  }
`;

export const EditorContainer = styled.div<Props>`
  display: block;
  position: relative;
  width: 100%;
  height: 100%;
`;

export const EditorWrapper = styled.div<Props>`
  width: 100%;
  min-height: ${({ minHeight }) => minHeight || '150px'};
  ${({ height }) => height && `height: ${height};`}
  background-color: rgba(0, 0, 0, 0.7);
  border: 2px solid var(--black-blue);
  border-radius: 7px;
  outline: none;
  padding: 25px 10px 10px;
  transition: background-color 0.2s, border 0.2s;
  box-shadow: 0 0 1px 1px rgba(50, 50, 50, 0.8);
  ${({ height }) => height ? 'overflow-y: auto;' : 'overflow-y: visible;'}
  resize: vertical;

  ${({ focus, theme, neon, typeStyle }) =>
    focus && css`
      background-color: var(--black-blue);
      border-color: ${theme === 'dark'
        ? neon === 'on'
          ? `#fff`
          : getBlue(typeStyle)
        : neon === 'on'
        ? `#fff`
        : getPink(typeStyle)};
      ${theme === 'dark'
        ? neon === 'on' &&
          `box-shadow: 0 0 10px 1px ${getBlue(typeStyle)}, inset 0 0 10px 1px ${getBlue(typeStyle)}`
        : neon === 'on' &&
          `box-shadow: 0 0 10px 1px ${getPink(typeStyle)}, inset 0 0 10px 1px ${getPink(typeStyle)}`};
    `}

  ${({ error, theme }) =>
    error &&
    css`
      border: 2px solid var(--clearneonRed);
      animation: ${glitchBorder} 0.7s linear;
      animation-fill-mode: forwards;
      ${theme === 'dark'
        ? 'box-shadow: 0 0 10px 2px var(--neonRed), 0 0 20px 1px var(--neonBlue);'
        : 'box-shadow: 0 0 10px 2px var(--neonRed), 0 0 20px 1px var(--clearneonPink);'}
    `}

  /* Estilos do editor TipTap */
  .ProseMirror {
    min-height: 80px;
    outline: none;
    color: var(--deepgrey);
    font-size: 0.9em;
    font-weight: 600;

    > * + * {
      margin-top: 0.75em;
    }

    &:focus {
      outline: none;
    }

    /* Placeholder */
    p.is-editor-empty:first-child::before {
      color: rgba(255, 255, 255, 0.3);
      content: attr(data-placeholder);
      float: left;
      height: 0;
      pointer-events: none;
    }

    /* Headings */
    h1 {
      font-size: 2em;
      font-weight: bold;
      margin-bottom: 0.5em;
      color: var(--whitesmoke);
    }

    h2 {
      font-size: 1.5em;
      font-weight: bold;
      margin-bottom: 0.5em;
      color: var(--whitesmoke);
    }

    h3 {
      font-size: 1.25em;
      font-weight: bold;
      margin-bottom: 0.5em;
      color: var(--whitesmoke);
    }

    h4 {
      font-size: 1.1em;
      font-weight: bold;
      margin-bottom: 0.5em;
      color: var(--whitesmoke);
    }

    /* Listas */
    ul, ol {
      padding-left: 1.5em;
      margin: 0.5em 0;
    }

    ul {
      list-style-type: disc;
    }

    ol {
      list-style-type: decimal;
    }

    li {
      margin: 0.25em 0;

      > p {
        margin: 0;
      }
    }

    /* Links */
    a {
      color: var(--clearneonBlue);
      text-decoration: underline;
      cursor: pointer;

      &:hover {
        color: var(--clearneonPink);
      }
    }

    /* Code */
    code {
      background-color: rgba(255, 255, 255, 0.1);
      padding: 0.2em 0.4em;
      border-radius: 3px;
      font-family: monospace;
      font-size: 0.9em;
    }

    /* Blockquote */
    blockquote {
      border-left: 3px solid var(--clearneonBlue);
      padding-left: 1em;
      margin-left: 0;
      font-style: italic;
      color: rgba(255, 255, 255, 0.8);
    }
  }
`;

export const EditorLabel = styled.label<Props>`
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  width: 100%;
`;

export const EditorLabelSpan = styled.span<Props>`
  font-family: 'DO Futuristic', sans-serif;
  font-weight: 100;
  letter-spacing: 3px;
  position: absolute;
  font-size: 0.8em;
  color: var(--whitesmoke) !important;
  margin: 20px;
  left: 0;
  top: 0;
  pointer-events: none;
  cursor: text;
  transition: all 250ms ease;

  ${({ active }) =>
    active &&
    ` color: #fff !important;`}
`;

export const SpanError = styled.span`
  background: linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0));
  border-radius: 4px;
  text-shadow: 1px 1px 2px var(--black);
  font-size: 12px;
  font-weight: bold;
  z-index: 1;
  color: var(--neonRed) !important;
`;

/* Toolbar Styles */
export const ToolbarContainer = styled.div<Props>`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 5px;
  margin-top: 10px;
  margin-bottom: 8px;
  border: 1px solid ${({ theme, neon, typeStyle }) =>
    theme === 'dark'
      ? neon === 'on'
        ? getBlue(typeStyle)
        : 'var(--black-blue)'
      : neon === 'on'
      ? getPink(typeStyle)
      : 'var(--black-blue)'};
`;

export const ToolbarGroup = styled.div`
  display: flex;
  gap: 2px;
`;

export const ToolbarButton = styled.button<Props & { active?: boolean }>`
  background-color: ${({ active, theme }) =>
    active 
      ? theme === 'dark' 
        ? 'var(--clearneonBlue)' 
        : 'var(--clearneonPink)'
      : 'rgba(255, 255, 255, 0.1)'};
  color: ${({ active }) => active ? 'var(--black)' : 'var(--whitesmoke)'};
  border: 1px solid ${({ active, theme }) =>
    active 
      ? theme === 'dark' 
        ? 'var(--clearneonBlue)' 
        : 'var(--clearneonPink)'
      : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 3px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 0.85em;
  font-weight: 600;
  transition: all 0.2s;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    background-color: ${({ theme, neon, typeStyle }) =>
      theme === 'dark'
        ? neon === 'on'
          ? getBlue(typeStyle)
          : 'rgba(255, 255, 255, 0.2)'
        : neon === 'on'
        ? getPink(typeStyle)
        : 'rgba(255, 255, 255, 0.2)'};
    border-color: ${({ theme, neon, typeStyle }) =>
      theme === 'dark'
        ? neon === 'on'
          ? getBlue(typeStyle)
          : 'rgba(255, 255, 255, 0.3)'
        : neon === 'on'
        ? getPink(typeStyle)
        : 'rgba(255, 255, 255, 0.3)'};
    ${({ theme, neon, typeStyle }) =>
      neon === 'on' &&
      (theme === 'dark'
        ? `box-shadow: 0 0 5px ${getBlue(typeStyle)};`
        : `box-shadow: 0 0 5px ${getPink(typeStyle)};`)}
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  strong, em, u, s {
    font-style: normal;
    text-decoration: none;
  }

  em {
    font-style: italic;
  }

  u {
    text-decoration: underline;
  }

  s {
    text-decoration: line-through;
  }
`;

export const ToolbarDivider = styled.div<Props>`
  width: 1px;
  background-color: rgba(255, 255, 255, 0.2);
  margin: 0 4px;
`;
