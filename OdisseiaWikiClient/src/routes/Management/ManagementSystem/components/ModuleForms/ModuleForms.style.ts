import styled from 'styled-components';

interface ThemeProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const ModuleFieldset = styled.fieldset`
  min-width: 0;
  margin: 0;
  padding: 0;
  border: 0;
  display: flex;
  flex-direction: column;
  gap: 18px;

  &:disabled {
    opacity: 0.88;
  }
`;

export const ModuleIntro = styled.div<ThemeProps>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 18px;
  border-left: 3px solid ${({ theme, neon }) => (
    neon === 'on'
      ? theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'
      : 'var(--neonBlue)'
  )};
  border-radius: 0 8px 8px 0;
  background: linear-gradient(90deg, rgba(0, 174, 255, 0.08), transparent 82%);

  h3 {
    margin: 0;
    color: ${({ theme, neon }) => neon === 'on'
      ? theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'
      : 'var(--whitesmoke)'} !important;
    font-family: 'Cyberpunk Is Not Dead', sans-serif;
    font-size: 20px;
    font-weight: 400;
    letter-spacing: 1.4px;
  }

  p {
    max-width: 820px;
    margin: 7px 0 0;
    color: var(--lightGrey) !important;
    font-size: 13px;
    line-height: 1.55;
  }

  @media (max-width: 768px) {
    padding: 13px 12px;

    h3 { font-size: 17px; }
    p { font-size: 12px; }
  }
`;

export const SectionCard = styled.section<ThemeProps>`
  min-width: 0;
  padding: 16px;
  border: 1px solid ${({ theme, neon }) => (
    neon === 'on'
      ? theme === 'dark' ? 'rgba(0, 210, 255, 0.58)' : 'rgba(145, 0, 255, 0.55)'
      : 'var(--grey)'
  )};
  border-radius: 8px;
  background: ${({ theme }) => theme === 'dark'
    ? 'rgba(0, 5, 15, 0.58)'
    : 'rgba(255, 255, 255, 0.66)'};
  box-sizing: border-box;

  h4 {
    margin: 0 0 6px;
    color: ${({ theme, neon }) => neon === 'on'
      ? theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'
      : 'var(--whitesmoke)'} !important;
    font-family: 'DO Futuristic', sans-serif;
    font-size: 14px;
    font-weight: 400;
    letter-spacing: 1.4px;
  }

  > p {
    margin: 0 0 14px;
    color: var(--lightGrey) !important;
    font-size: 12px;
    line-height: 1.5;
  }

  @media (max-width: 768px) {
    padding: 12px;
  }
`;

export const FieldGrid = styled.div<{ $columns?: number }>`
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(${({ $columns }) => $columns ?? 3}, minmax(150px, 1fr));
  gap: 14px;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(140px, 1fr));
  }

  @media (max-width: 620px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const InlineChecks = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 14px 24px;
  padding: 5px 2px;
`;

export const ModuleWarning = styled.div`
  padding: 10px 12px;
  border: 1px solid var(--neonYellow);
  border-radius: 6px;
  background: rgba(255, 204, 0, 0.06);
  color: var(--lightGrey) !important;
  font-size: 12px;
  line-height: 1.5;
`;

export const RangeTools = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(86px, 1fr)) auto;
  gap: 7px;
  align-items: center;

  input {
    width: 100%;
    min-height: 32px;
    padding: 6px 8px;
    border: 1px solid var(--grey);
    border-radius: 5px;
    outline: none;
    background: rgba(0, 0, 0, 0.45);
    color: var(--whitesmoke);
    font-size: 11px;
    box-sizing: border-box;
  }

  button {
    min-height: 32px;
    border: 1px solid var(--clearneonBlue);
    border-radius: 5px;
    background: transparent;
    color: var(--clearneonBlue) !important;
    cursor: pointer;
  }

  @media (max-width: 768px) {
    width: 100%;
    grid-template-columns: repeat(2, minmax(92px, 1fr));

    button { grid-column: 1 / -1; }
  }
`;

export const CurvePreview = styled.div<ThemeProps>`
  display: flex;
  align-items: flex-end;
  gap: 3px;
  height: 92px;
  padding: 10px 8px 2px;
  border-bottom: 1px solid var(--grey);
  overflow-x: auto;

  span {
    flex: 1 0 7px;
    max-width: 24px;
    min-height: 2px;
    border-radius: 2px 2px 0 0;
    background: ${({ theme, neon }) => neon === 'on'
      ? theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'
      : 'var(--neonBlue)'};
    opacity: 0.78;
  }
`;
