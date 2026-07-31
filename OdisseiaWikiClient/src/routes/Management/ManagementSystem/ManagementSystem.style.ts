import styled, { css } from 'styled-components';

export interface SystemThemeProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

const accent = ({ theme, neon }: SystemThemeProps) => (
  neon === 'on'
    ? theme === 'dark' ? 'var(--clearneonBlue)' : 'var(--clearneonViolet)'
    : theme === 'dark' ? 'var(--neonBlue)' : 'var(--neonViolet)'
);

export const SystemManagementContainer = styled.div`
  width: 100%;
  max-width: 1760px;
  min-width: 0;
  min-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px 0 32px;
  box-sizing: border-box;
`;

export const PageHeader = styled.header<SystemThemeProps>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px 22px;
  border: 1px solid ${({ theme, neon }) => accent({ theme, neon })};
  border-radius: 9px;
  background: ${({ theme }) => theme === 'dark'
    ? 'linear-gradient(120deg, rgba(0, 9, 22, 0.9), rgba(0, 0, 0, 0.55))'
    : 'linear-gradient(120deg, rgba(255, 255, 255, 0.9), rgba(225, 225, 235, 0.65))'};
  box-shadow: ${({ theme, neon }) => neon === 'on'
    ? `0 0 13px ${theme === 'dark' ? 'rgba(0, 174, 255, 0.28)' : 'rgba(145, 0, 255, 0.24)'}`
    : 'none'};

  .title-block {
    min-width: 0;

    p {
      max-width: 780px;
      margin: 8px 0 0;
      color: var(--lightGrey) !important;
      font-size: 13px;
      line-height: 1.55;
    }
  }

  @media (max-width: 768px) {
    align-items: stretch;
    flex-direction: column;
    padding: 16px 13px;
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-start;
  }
`;

export const ActionButton = styled.button<SystemThemeProps & { $danger?: boolean; $compact?: boolean; $active?: boolean }>`
  min-height: ${({ $compact }) => $compact ? '34px' : '40px'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: ${({ $compact }) => $compact ? '6px 9px' : '8px 14px'};
  border: 1px solid ${({ $danger, theme, neon }) => $danger ? 'var(--neonRed)' : accent({ theme, neon })};
  border-radius: 6px;
  background: ${({ $active, theme, neon }) => $active
    ? accent({ theme, neon })
    : 'rgba(0, 0, 0, 0.28)'};
  color: ${({ $danger, $active }) => $danger
    ? 'var(--clearneonRed)'
    : $active ? 'var(--black)' : 'var(--whitesmoke)'} !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: ${({ $compact }) => $compact ? '10px' : '11px'};
  font-weight: 500;
  letter-spacing: 0.65px;
  cursor: pointer;
  transition: border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;

  svg {
    width: 17px;
    height: 17px;
  }

  &:hover:not(:disabled) {
    color: ${({ $danger, theme, neon }) => $danger ? 'var(--clearneonRed)' : accent({ theme, neon })} !important;
    box-shadow: ${({ $danger, theme, neon }) => `0 0 8px ${$danger ? 'var(--neonRed)' : accent({ theme, neon })}`};
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.42;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    flex: 1 1 auto;
    min-width: 0;
    padding-inline: 8px;
    font-size: 9px;
  }
`;

export const CatalogControls = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1fr) minmax(150px, 210px) minmax(170px, 230px);
  gap: 12px;
  align-items: center;

  @media (max-width: 620px) {
    grid-template-columns: 1fr;
  }
`;

export const SystemsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(260px, 1fr));
  gap: 14px;

  @media (min-width: 1600px) {
    grid-template-columns: repeat(4, minmax(260px, 1fr));
  }

  @media (max-width: 1100px) {
    grid-template-columns: repeat(2, minmax(240px, 1fr));
  }

  @media (max-width: 650px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const SystemCard = styled.article<SystemThemeProps & { $inactive?: boolean }>`
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border: 1px solid ${({ theme, neon }) => accent({ theme, neon })};
  border-radius: 8px;
  background: ${({ theme }) => theme === 'dark'
    ? 'rgba(0, 5, 15, 0.78)'
    : 'rgba(255, 255, 255, 0.8)'};
  opacity: ${({ $inactive }) => $inactive ? 0.72 : 1};
  box-shadow: ${({ neon, theme }) => neon === 'on'
    ? `0 0 10px ${theme === 'dark' ? 'rgba(0, 174, 255, 0.18)' : 'rgba(145, 0, 255, 0.16)'}`
    : '0 5px 15px rgba(0, 0, 0, 0.16)'};

  > p {
    min-height: 42px;
    margin: 0;
    display: -webkit-box;
    overflow: hidden;
    color: var(--lightGrey) !important;
    font-size: 12px;
    line-height: 1.5;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
`;

export const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;

  h3 {
    margin: 0;
    overflow: hidden;
    color: var(--whitesmoke) !important;
    font-family: 'Cyberpunk Is Not Dead', sans-serif;
    font-size: 17px;
    font-weight: 400;
    letter-spacing: 0.8px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  small {
    display: block;
    margin-top: 4px;
    color: var(--clearneonBlue) !important;
    font-size: 10px;
    letter-spacing: 1.2px;
  }
`;

export const StatusPill = styled.span<{ $status: 'active' | 'inactive' | 'draft' | 'published' | 'archived' }>`
  flex: 0 0 auto;
  align-self: flex-start;
  padding: 4px 7px;
  border: 1px solid ${({ $status }) => {
    if ($status === 'active' || $status === 'published') return 'var(--clearneonGreen)';
    if ($status === 'draft') return 'var(--clearneonYellow)';
    if ($status === 'archived') return 'var(--grey)';
    return 'var(--clearneonRed)';
  }};
  border-radius: 999px;
  color: ${({ $status }) => {
    if ($status === 'active' || $status === 'published') return 'var(--clearneonGreen)';
    if ($status === 'draft') return 'var(--clearneonYellow)';
    if ($status === 'archived') return 'var(--lightGrey)';
    return 'var(--clearneonRed)';
  }} !important;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.55px;
  text-transform: uppercase;
`;

export const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
`;

export const Metric = styled.div`
  min-width: 0;
  padding: 8px;
  border: 1px solid rgba(120, 130, 145, 0.35);
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.22);

  span,
  strong {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  span {
    color: var(--grey) !important;
    font-size: 9px;
    text-transform: uppercase;
  }

  strong {
    margin-top: 3px;
    color: var(--whitesmoke) !important;
    font-size: 12px;
  }
`;

export const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: auto;
`;

export const StatePanel = styled.div<SystemThemeProps & { $error?: boolean }>`
  width: 100%;
  min-height: 180px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  border: 1px dashed ${({ $error, theme, neon }) => $error ? 'var(--clearneonRed)' : accent({ theme, neon })};
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.32);
  color: ${({ $error }) => $error ? 'var(--clearneonRed)' : 'var(--lightGrey)'} !important;
  font-size: 13px;
  text-align: center;
  box-sizing: border-box;

  svg {
    width: 34px;
    height: 34px;
  }
`;

export const WorkspaceHeader = styled.header<SystemThemeProps>`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 18px 20px;
  border: 1px solid ${({ theme, neon }) => accent({ theme, neon })};
  border-radius: 8px;
  background: rgba(0, 5, 15, 0.76);

  @media (max-width: 768px) {
    flex-direction: column;
    padding: 14px 12px;
  }
`;

export const BackButton = styled.button<SystemThemeProps>`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 8px;
  padding: 0;
  border: 0;
  background: transparent;
  color: ${({ theme, neon }) => accent({ theme, neon })} !important;
  font-size: 11px;
  cursor: pointer;
`;

export const SystemTitle = styled.div`
  min-width: 0;

  h2 {
    margin: 0;
    color: var(--whitesmoke) !important;
    font-family: 'Cyberpunk Is Not Dead', sans-serif;
    font-size: clamp(20px, 2.2vw, 31px);
    font-weight: 400;
    letter-spacing: 1.4px;
    overflow-wrap: anywhere;
  }

  p {
    max-width: 780px;
    margin: 8px 0 0;
    color: var(--lightGrey) !important;
    font-size: 12px;
    line-height: 1.5;
  }
`;

export const SystemMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
  margin-top: 8px;

  code {
    padding: 3px 6px;
    border: 1px solid var(--grey);
    border-radius: 4px;
    color: var(--clearneonBlue) !important;
    font-size: 10px;
  }
`;

export const WorkspaceLayout = styled.div`
  width: 100%;
  min-width: 0;
  display: grid;
  grid-template-columns: 245px minmax(0, 1fr);
  gap: 14px;
  align-items: start;

  @media (max-width: 1100px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const VersionRail = styled.aside<SystemThemeProps>`
  min-width: 0;
  max-height: calc(100vh - 150px);
  position: sticky;
  top: 96px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid ${({ theme, neon }) => accent({ theme, neon })};
  border-radius: 8px;
  background: rgba(0, 5, 15, 0.78);

  @media (max-width: 1100px) {
    max-height: none;
    position: static;
  }
`;

export const VersionRailHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px;
  border-bottom: 1px solid var(--grey);

  h3 {
    margin: 0;
    color: var(--whitesmoke) !important;
    font-family: 'DO Futuristic', sans-serif;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 1px;
  }
`;

export const VersionList = styled.div`
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 8px;
  overflow-y: auto;

  @media (max-width: 1100px) {
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
  }
`;

export const VersionButton = styled.button<SystemThemeProps & { $selected: boolean }>`
  width: 100%;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px;
  border: 1px solid ${({ $selected, theme, neon }) => $selected ? accent({ theme, neon }) : 'transparent'};
  border-radius: 6px;
  background: ${({ $selected }) => $selected ? 'rgba(0, 174, 255, 0.09)' : 'rgba(0, 0, 0, 0.16)'};
  color: var(--whitesmoke) !important;
  text-align: left;
  cursor: pointer;

  &:hover {
    border-color: ${({ theme, neon }) => accent({ theme, neon })};
  }

  strong,
  small {
    display: block;
  }

  strong { font-size: 12px; }
  small { margin-top: 3px; color: var(--grey) !important; font-size: 9px; }

  @media (max-width: 1100px) {
    flex: 0 0 210px;
  }
`;

export const EditorPanel = styled.main<SystemThemeProps>`
  min-width: 0;
  overflow: hidden;
  border: 1px solid ${({ theme, neon }) => accent({ theme, neon })};
  border-radius: 8px;
  background: ${({ theme }) => theme === 'dark' ? 'rgba(0, 3, 10, 0.72)' : 'rgba(255, 255, 255, 0.72)'};
`;

export const VersionHeader = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--grey);

  h3 {
    margin: 0;
    color: var(--whitesmoke) !important;
    font-family: 'Cyberpunk Is Not Dead', sans-serif;
    font-size: 20px;
    font-weight: 400;
  }

  p {
    max-width: 760px;
    margin: 6px 0 0;
    color: var(--lightGrey) !important;
    font-size: 11px;
    line-height: 1.5;
    white-space: pre-wrap;
  }

  @media (max-width: 840px) {
    flex-direction: column;
  }
`;

export const VersionActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 6px;

  @media (max-width: 840px) {
    width: 100%;
    justify-content: flex-start;
  }
`;

export const ReadOnlyBanner = styled.div`
  margin: 12px 14px 0;
  padding: 10px 12px;
  border: 1px solid var(--clearneonYellow);
  border-radius: 6px;
  background: rgba(255, 205, 0, 0.06);
  color: var(--lightGrey) !important;
  font-size: 11px;
  line-height: 1.5;
`;

export const ModuleNav = styled.nav<SystemThemeProps>`
  display: flex;
  align-items: stretch;
  gap: 2px;
  padding: 8px 10px 0;
  overflow-x: auto;
  border-bottom: 1px solid var(--grey);
  scrollbar-width: thin;
`;

export const ModuleNavButton = styled.button<SystemThemeProps & { $selected: boolean; $hasError?: boolean }>`
  flex: 0 0 auto;
  min-height: 40px;
  padding: 8px 11px;
  border: 0;
  border-bottom: 2px solid ${({ $selected, $hasError, theme, neon }) => {
    if ($hasError) return 'var(--clearneonRed)';
    return $selected ? accent({ theme, neon }) : 'transparent';
  }};
  background: ${({ $selected }) => $selected ? 'rgba(0, 174, 255, 0.07)' : 'transparent'};
  color: ${({ $selected, theme, neon }) => $selected ? accent({ theme, neon }) : 'var(--lightGrey)'} !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: 10px;
  letter-spacing: 0.6px;
  cursor: pointer;
  white-space: nowrap;

  &:hover { color: ${({ theme, neon }) => accent({ theme, neon })} !important; }
`;

export const ModuleContent = styled.div`
  min-width: 0;
  padding: 16px;

  @media (max-width: 768px) {
    padding: 12px 8px;
  }
`;

export const SaveBar = styled.div<SystemThemeProps>`
  position: sticky;
  right: 0;
  bottom: 10px;
  z-index: 12;
  width: fit-content;
  max-width: calc(100% - 20px);
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 10px 10px 12px auto;
  padding: 8px;
  border: 1px solid ${({ theme, neon }) => accent({ theme, neon })};
  border-radius: 8px;
  background: rgba(0, 5, 15, 0.94);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.45);

  span {
    color: var(--lightGrey) !important;
    font-size: 10px;
  }

  @media (max-width: 620px) {
    width: calc(100% - 16px);
    max-width: none;
    margin-inline: 8px;
    justify-content: space-between;
  }
`;

export const DirtyIndicator = styled.span<{ $dirty: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 5px;

  &::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${({ $dirty }) => $dirty ? 'var(--clearneonYellow)' : 'var(--clearneonGreen)'};
    box-shadow: ${({ $dirty }) => $dirty ? '0 0 6px var(--neonYellow)' : 'none'};
  }
`;

export const DialogForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
`;

export const DialogFooter = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
`;

export const ConfirmText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;

  p {
    margin: 0;
    color: var(--lightGrey) !important;
    font-size: 13px;
    line-height: 1.55;
  }

  strong { color: var(--whitesmoke) !important; }
`;

export const ValidationSummary = styled.div`
  padding: 10px 12px;
  border-left: 3px solid var(--clearneonRed);
  border-radius: 0 5px 5px 0;
  background: rgba(255, 0, 60, 0.08);
  color: var(--clearneonRed) !important;
  font-size: 11px;
  line-height: 1.45;
`;

export const VisuallyHidden = styled.span`
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
`;

export const SpinIcon = styled.span`
  display: inline-flex;
  animation: system-spin 0.8s linear infinite;

  @keyframes system-spin {
    to { transform: rotate(360deg); }
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export const Divider = styled.div`
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--grey), transparent);
`;

export const SmallPrint = styled.small`
  color: var(--grey) !important;
  font-size: 9px;
  line-height: 1.4;
`;

export const DangerNote = styled.div`
  padding: 9px 10px;
  border: 1px solid var(--neonRed);
  border-radius: 5px;
  background: rgba(255, 0, 45, 0.05);
  color: var(--lightGrey) !important;
  font-size: 11px;
`;

export const CardDate = styled.time`
  color: var(--grey) !important;
  font-size: 9px;
`;

export const Changelog = styled.details`
  margin-top: 8px;

  summary {
    color: var(--clearneonBlue) !important;
    font-size: 10px;
    cursor: pointer;
  }

  p {
    margin: 7px 0 0;
    white-space: pre-wrap;
  }
`;

export const TableToolButton = styled.button<SystemThemeProps>`
  min-height: 32px;
  padding: 6px 9px;
  border: 1px solid ${({ theme, neon }) => accent({ theme, neon })};
  border-radius: 5px;
  background: transparent;
  color: ${({ theme, neon }) => accent({ theme, neon })} !important;
  font-size: 10px;
  cursor: pointer;
`;

export const CurrentModuleError = styled.div`
  margin: 0 14px 12px;
  padding: 8px 10px;
  border: 1px solid var(--clearneonRed);
  border-radius: 5px;
  color: var(--clearneonRed) !important;
  font-size: 11px;
`;

export const FocusRing = css`
  &:focus-visible {
    outline: 2px solid var(--clearneonBlue);
    outline-offset: 2px;
  }
`;
