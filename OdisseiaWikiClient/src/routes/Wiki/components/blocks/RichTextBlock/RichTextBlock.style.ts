import styled from 'styled-components';

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
  width: 100%;
  line-height: 1.8;
  width: 65%;
  min-width: 900px;

  /* TipTap Editor Styles */
  .ProseMirror {
    outline: none;
    padding: 0;
    background-color: transparent;

    p {
      margin: 0.5em 0;
      line-height: 1.6;
    }

    h1,
    h2,
    h3,
    h4,
    h5,
    h6 {
      margin: 1em 0 0.5em 0;
      font-weight: 600;
      line-height: 1.4;
      letter-spacing: -0.5px;
    }

    h1 {
      font-size: 28px;
    }

    h2 {
      font-size: 24px;
    }

    h3 {
      font-size: 20px;
    }

    h4 {
      font-size: 16px;
    }

    h5 {
      font-size: 14px;
    }

    h6 {
      font-size: 12px;
    }

    ul,
    ol {
      margin: 1em 0;
      padding-left: 2em;

      li {
        margin: 0.5em 0;
      }
    }

    blockquote {
      margin: 1em 0;
      padding: 12px 16px;
      border-left: 4px solid #00d4ff;
      background-color: rgba(0, 212, 255, 0.05);
      font-style: italic;
      color: rgba(255, 255, 255, 0.8);
    }

    code {
      background-color: rgba(0, 0, 0, 0.2);
      padding: 2px 6px;
      border-radius: 3px;
      font-family: 'Courier New', monospace;
      font-size: 0.9em;
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
      color: #00d4ff;
      text-decoration: underline;
      cursor: pointer;
      transition: opacity 0.2s ease;

      &:hover {
        opacity: 0.8;
      }
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
