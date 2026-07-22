export const wikiHeading1Style = `
  font-family: 'DO Futuristic', sans-serif !important;
  font-size: 2.1rem !important;
  font-weight: 100;
  letter-spacing: 3px;
  line-height: 1.4;
  text-shadow: 1px 1px 8px var(--neonBlue);
  color: var(--whitesmoke);

  @media (max-width: 768px) {
    font-size: 1.72rem !important;
  }
`;

export const wikiHeading2Style = `
  font-family: 'DO Futuristic', sans-serif !important;
  font-size: 1.52rem !important;
  font-weight: 100;
  letter-spacing: 2px;
  line-height: 1.4;
  text-shadow: 1px 1px 8px var(--clearneonPink);
  color: var(--whitesmoke);

  @media (max-width: 768px) {
    font-size: 1.34rem !important;
  }
`;

export const wikiHeading3Style = `
  font-family: 'DO Futuristic', sans-serif !important;
  font-size: 1.2rem !important;
  font-weight: 100;
  letter-spacing: 1.5px;
  line-height: 1.4;
  text-shadow: 0px 0px 6px var(--clearneonPink);
  color: var(--whitesmoke);

  @media (max-width: 768px) {
    font-size: 1.15rem !important;
  }
`;

export const wikiParagraphStyle = `
  font-size: 14px;
  color: var(--whitesmoke);
  text-shadow: 1px 1px 10px rgba(0, 0, 0, 1) !important;
`;

export const wikiListStyle = `
  padding-left: 2em;

  li {
    line-height: 1.8;
    font-size: 14px;
    color: var(--whitesmoke);
  }
`;

export const wikiBlockquoteStyle = `
  padding: 12px 16px;
  border-left: 4px solid var(--clearneonBlue);
  background-color: rgba(0, 212, 255, 0.05);
  font-style: italic;
  color: rgba(255, 255, 255, 0.8);
`;

export const wikiCodeStyle = `
  background-color: rgba(0, 0, 0, 0.2);
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
`;

export const wikiLinkStyle = `
  color: var(--clearneonBlue);
  text-decoration: underline;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;
