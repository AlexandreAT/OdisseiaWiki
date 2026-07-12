import styled from 'styled-components';
import {
  wikiBlockquoteStyle,
  wikiCodeStyle,
  wikiHeading1Style,
  wikiHeading2Style,
  wikiHeading3Style,
  wikiLinkStyle,
  wikiListStyle,
  wikiParagraphStyle,
} from '../../../routes/Wiki/shared/WikiTextStyles';

export const RichTextDisplayContainer = styled.div`
  color: var(--whitesmoke);
  line-height: 1.8;

  p {
    ${wikiParagraphStyle}
    margin: 0 0 12px;
  }

  h1 { ${wikiHeading1Style} }
  h2 { ${wikiHeading2Style} }
  h3 { ${wikiHeading3Style} }

  h4,
  h5,
  h6 {
    font-family: 'DO Futuristic', sans-serif !important;
    font-weight: 100;
    letter-spacing: 1px;
    margin: 0.6em 0 0.3em;
    line-height: 1.4;
    color: var(--whitesmoke);
  }

  h4 { font-size: 1.1rem !important; }
  h5 { font-size: 1rem !important; }
  h6 { font-size: 0.9rem !important; }

  ul,
  ol {
    ${wikiListStyle}
    margin: 0.5em 0;
  }

  blockquote { ${wikiBlockquoteStyle} }
  code { ${wikiCodeStyle} }
  a { ${wikiLinkStyle} }

  pre {
    background-color: rgba(0, 0, 0, 0.3);
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    margin: 1em 0;

    code {
      background-color: transparent;
      padding: 0;
    }
  }
`;
