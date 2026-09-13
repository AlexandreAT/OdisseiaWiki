import styled from 'styled-components';

export const ModifierSection = styled.section<{ $theme: 'dark' | 'light'; $neon: 'on' | 'off' }>`
  display: flex;
  flex-direction: column;
  gap: 13px;
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 12px 14px 14px;
  border-left: 2px solid ${({ $theme, $neon }) => $theme === 'dark'
    ? $neon === 'on' ? 'var(--clearneonBlue)' : 'var(--lightBlack)'
    : $neon === 'on' ? 'var(--neonViolet)' : 'var(--lightGrey)'};
  border-top: 1px solid ${({ $theme }) => $theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.08)'};
  border-radius: 3px;
  background: ${({ $theme }) => $theme === 'dark'
    ? 'linear-gradient(90deg, rgba(0, 229, 255, 0.035), transparent 68%)'
    : 'linear-gradient(90deg, rgba(112, 53, 166, 0.045), transparent 68%)'};
  h4, p { margin: 0; }
  h4 {
    color: ${({ $theme, $neon }) => $theme === 'dark'
      ? $neon === 'on' ? 'var(--clearneonBlue)' : 'var(--clearWhite)'
      : $neon === 'on' ? 'var(--neonViolet)' : 'var(--deepgrey)'};
    font-family: 'DO Futuristic', sans-serif;
    font-size: 0.78rem;
    font-weight: 100;
    letter-spacing: 2.5px;
  }
  p { font-size: 0.9rem; line-height: 1.5; }
  @media (max-width: 640px) { gap: 10px; padding: 10px 10px 12px; }
`;

export const ModifierGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  @media (max-width: 640px) { grid-template-columns: minmax(0, 1fr); }
`;

export const ModifierList = styled.ul`
  margin: 0;
  padding-left: 20px;
  line-height: 1.6;
  overflow-wrap: anywhere;
`;

export const ModifierEntry = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  > :first-child { flex: 1; min-width: 0; }
  @media (max-width: 640px) { flex-wrap: wrap; }
`;
