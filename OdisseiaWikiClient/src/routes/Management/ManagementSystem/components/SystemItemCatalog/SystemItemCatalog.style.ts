import styled from 'styled-components';

interface ThemeProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

const accent = ({ theme, neon }: ThemeProps) => (
  neon === 'on'
    ? theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'
    : 'var(--grey)'
);

export const CatalogPanel = styled.section<ThemeProps>`
  min-width: 0;
  margin: 18px 16px 16px;
  border: 1px solid ${({ theme, neon }) => accent({ theme, neon })};
  border-radius: 8px;
  background: rgba(0, 5, 15, 0.48);
  overflow: hidden;

  @media (max-width: 768px) {
    margin-inline: 8px;
  }
`;

export const CatalogHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
  padding: 16px;
  border-bottom: 1px solid var(--grey);

  > div:first-child {
    min-width: 0;
  }

  h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--clearneonBlue) !important;
    font-family: 'Cyberpunk Is Not Dead', sans-serif;
    font-size: 19px;
    font-weight: 400;
    letter-spacing: 1.2px;
  }

  h3 svg {
    flex: 0 0 auto;
  }

  p {
    max-width: 820px;
    margin: 7px 0 0;
    color: var(--lightGrey) !important;
    font-size: 12px;
    line-height: 1.5;
  }

  .catalog-header-actions {
    display: flex;
    flex: 0 0 auto;
    flex-wrap: wrap;
    gap: 7px;
  }

  @media (max-width: 720px) {
    flex-direction: column;
    padding: 13px 11px;

    h3 { font-size: 17px; }
    .catalog-header-actions { width: 100%; }
  }
`;

export const CatalogBody = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;

  @media (max-width: 768px) {
    padding: 10px 7px;
  }
`;

export const CatalogNotice = styled.div<{ $error?: boolean; $warning?: boolean }>`
  min-height: 54px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  padding: 12px;
  border: 1px dashed ${({ $error, $warning }) => (
    $error ? 'var(--clearneonRed)' : $warning ? 'var(--clearneonYellow)' : 'var(--grey)'
  )};
  border-radius: 6px;
  color: ${({ $error, $warning }) => (
    $error ? 'var(--clearneonRed)' : $warning ? 'var(--clearneonYellow)' : 'var(--lightGrey)'
  )} !important;
  font-size: 11px;
  line-height: 1.45;
  text-align: center;
`;

export const CatalogTree = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const ScopeCard = styled.details<ThemeProps & { $depth: number }>`
  min-width: 0;
  margin-left: ${({ $depth }) => Math.min($depth, 2) * 13}px;
  border: 1px solid ${({ theme, neon }) => accent({ theme, neon })};
  border-radius: 7px;
  background: ${({ $depth }) => `rgba(0, ${7 + ($depth * 3)}, ${17 + ($depth * 4)}, 0.56)`};
  overflow: hidden;

  &[open] > summary {
    border-bottom-color: var(--grey);
  }

  @media (max-width: 680px) {
    margin-left: ${({ $depth }) => Math.min($depth, 2) * 5}px;
  }
`;

export const ScopeSummary = styled.summary`
  min-width: 0;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 9px;
  padding: 11px 12px;
  border-bottom: 1px solid transparent;
  color: var(--whitesmoke) !important;
  cursor: pointer;
  list-style: none;

  &::-webkit-details-marker { display: none; }

  .scope-name {
    min-width: 0;
    overflow: hidden;
    font-family: 'DO Futuristic', sans-serif;
    font-size: 11px;
    letter-spacing: 0.65px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  code {
    max-width: 270px;
    overflow: hidden;
    color: var(--grey) !important;
    font-size: 9px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    color: var(--grey) !important;
    font-size: 9px;
    white-space: nowrap;
  }

  @media (max-width: 620px) {
    grid-template-columns: auto minmax(0, 1fr) auto;
    padding-inline: 9px;
    code { display: none; }
    small { font-size: 8px; }
  }
`;

export const ScopeBadge = styled.span<{ $inactive?: boolean }>`
  padding: 3px 6px;
  border: 1px solid ${({ $inactive }) => $inactive ? 'var(--grey)' : 'var(--clearneonBlue)'};
  border-radius: 999px;
  color: ${({ $inactive }) => $inactive ? 'var(--grey)' : 'var(--clearneonBlue)'} !important;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
`;

export const ScopeBody = styled.fieldset`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 13px;
  border: 0;

  &:disabled { opacity: 0.82; }

  @media (max-width: 680px) {
    padding: 9px 6px;
  }
`;

export const ScopeMetaGrid = styled.div`
  min-width: 0;
  display: grid;
  grid-template-columns: minmax(150px, 0.85fr) minmax(190px, 1.3fr) minmax(90px, 0.45fr) minmax(105px, 0.5fr);
  gap: 11px;
  align-items: start;

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 520px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ToggleField = styled.label`
  min-height: 49px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--grey);
  border-radius: 5px;
  color: var(--lightGrey) !important;
  font-size: 11px;
  box-sizing: border-box;

  input {
    width: 18px;
    height: 18px;
    accent-color: var(--clearneonBlue);
  }
`;

export const ScopeTools = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 7px;
`;

export const ScopeTables = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

export const ChildrenGroup = styled.div`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 9px;
  padding-top: 3px;

  > h5 {
    margin: 0;
    color: var(--clearneonBlue) !important;
    font-family: 'DO Futuristic', sans-serif;
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.8px;
  }
`;

export const CatalogFooter = styled.footer`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding-top: 3px;

  > span {
    color: var(--lightGrey) !important;
    font-size: 10px;
  }

  .catalog-save-actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 7px;
  }

  @media (max-width: 620px) {
    align-items: stretch;
    flex-direction: column;
    .catalog-save-actions { justify-content: stretch; }
  }
`;
