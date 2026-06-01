import styled from 'styled-components';
import {
  wikiHeading1Style,
  wikiHeading2Style,
  wikiHeading3Style,
  wikiParagraphStyle,
  wikiListStyle,
  wikiBlockquoteStyle,
  wikiCodeStyle,
  wikiLinkStyle,
} from '../../../shared/WikiTextStyles';

export const DivController = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`

export const RichTextBlockContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
  line-height: 1.8;
  width: 65%;
  min-width: 900px;

  .ProseMirror {
    outline: none;
    padding: 0;
    background-color: transparent;

    p {
      ${wikiParagraphStyle}
    }

    h1 {
      ${wikiHeading1Style}
    }

    h2 {
      ${wikiHeading2Style}
    }

    h3 {
      ${wikiHeading3Style}
    }

    h4,
    h5,
    h6 {
      font-family: 'DO Futuristic', sans-serif !important;
      font-weight: 100;
      letter-spacing: 1px;
      margin: 0.6em 0 0.3em 0;
      line-height: 1.4;
      color: var(--whitesmoke);
    }

    h4 { font-size: 1.1rem !important; }
    h5 { font-size: 1rem !important; }
    h6 { font-size: 0.9rem !important; }

    ul,
    ol {
      ${wikiListStyle}
    }

    blockquote {
      ${wikiBlockquoteStyle}
    }

    code {
      ${wikiCodeStyle}
    }

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

    strong {
      font-weight: 600;
    }

    em {
      font-style: italic;
    }

    u {
      text-decoration: underline;
    }

    s,
    del {
      text-decoration: line-through;
    }

    hr {
      margin: 1.5em 0;
      border: none;
      border-top: 2px solid #333;
    }

    table {
      border-collapse: collapse;
      margin: 1em 0;
      width: 100%;

      th,
      td {
        border: 1px solid #333;
        padding: 8px 12px;
        text-align: left;
      }

      th {
        background-color: rgba(0, 212, 255, 0.05);
        font-weight: 600;
      }

      tr:nth-child(even) {
        background-color: rgba(0, 0, 0, 0.1);
      }
    }

    a {
      ${wikiLinkStyle}
    }

    img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
      margin: 1em 0;
    }

    .mention {
      background-color: rgba(0, 212, 255, 0.1);
      color: #00d4ff;
      padding: 2px 4px;
      border-radius: 2px;
    }
  }
`;

export const ErrorMessage = styled.div`
  padding: 12px;
  background-color: rgba(220, 53, 69, 0.1);
  border-left: 4px solid #dc3545;
  border-radius: 4px;
  color: #dc3545;
  font-size: 12px;

  p {
    margin: 0;
  }
`;
