import styled from 'styled-components';
import { ManagementContent } from '../Mesas.style';

export const MesaGameActivityLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
  align-items: start;
  gap: 22px;

  > * { min-width: 0; }

  @media (max-width: 980px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const MesaGameActivityMain = styled.div`
  min-width: 0;
`;

export const MesaSceneSection = styled(ManagementContent)`
  position: relative;
  margin-top: 24px;
  padding: 22px;
  > header h2 { position: relative; z-index: 5; margin: 0; color: var(--clearneonBlue); font-family: 'DO Futuristic', sans-serif; font-size: 1.2rem; font-weight: 100; letter-spacing: .045em; }
  > header p { position: relative; z-index: 5; margin: 5px 0 18px; color: var(--lightGrey); font-size: .76rem; }

  /* No celular a moldura desta seção consumia a largura útil duas vezes:
     a da página e a deste painel. Os NPCs usam a mesma grade dos jogadores,
     portanto a seção vira apenas um cabeçalho separador. */
  @media (max-width: 720px) {
    margin-top: 22px;
    padding: 16px 0 0;
    border: 0;
    background: transparent;
    box-shadow: none;
    clip-path: none;

    > [aria-hidden='true'] {
      display: none;
    }
  }
`;

export const MesaSceneHeader = styled.header`
  position: relative;
  z-index: 6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  > button:only-child {
    margin: 0 auto;
  }

  @media (max-width: 720px) {
    padding: 15px 0 0;
    border-top: 1px solid rgba(57, 211, 255, .52);
  }
`;

export const MesaSceneAdd = styled.button`
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  flex: 0 0 42px;
  border: 1px solid var(--clearneonBlue);
  background: rgba(0, 20, 38, .82);
  color: var(--clearneonBlue);
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, color 160ms ease,
    background 160ms ease, box-shadow 160ms ease;

  svg { transition: transform 160ms ease; }

  &:focus-visible {
    border-color: var(--clearneonPink);
    color: var(--clearneonPink);
    outline: none;
    box-shadow: 0 0 9px rgba(255, 0, 238, .32);
  }

  &:active { transform: scale(.94); }

  @media (hover: hover) {
    &:hover {
      transform: translateY(-2px);
      border-color: var(--clearneonPink);
      color: var(--clearneonPink);
      background: rgba(42, 4, 46, .86);
      box-shadow: 0 0 9px rgba(255, 0, 238, .32);

      svg { transform: rotate(90deg); }
    }
  }
`;

export const MesaGameActivitySidebar = styled.aside`
  position: relative;
  display: grid;
  grid-auto-rows: max-content;
  align-content: start;
  gap: 14px;
  height: auto;
  max-height: none;
  min-width: 0;

  @media (max-width: 980px) {
    order: -1;
  }
`;

export const MesaGameActivityPanel = styled(ManagementContent)`
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 0;
  height: min(68svh, 720px);
  min-height: min(360px, 55svh);
  max-height: min(68svh, 720px);
  overflow: hidden;
  padding: 0;

  @media (max-width: 980px) {
    height: min(68svh, 620px);
    min-height: min(340px, 58svh);
    max-height: min(68svh, 620px);
  }

  @media (max-width: 720px) {
    height: min(70svh, 560px);
    min-height: min(320px, 62svh);
    max-height: min(70svh, 560px);
  }
`;

export const FavoriteRollsPanel = styled(ManagementContent)`
  position: relative;
  display: grid;
  gap: 10px;
  padding: 14px 16px 16px;

  h2 {
    position: relative;
    z-index: 5;
    display: flex;
    align-items: center;
    gap: 7px;
    margin: 0;
    color: var(--clearneonBlue);
    font-family: 'DO Futuristic', sans-serif;
    font-size: .98rem;
    font-weight: 100;
    letter-spacing: .045em;
  }

  h2 svg { width: 18px; height: 18px; color: #ffd65a; }
  p { margin: 0; color: var(--lightGrey); font-size: .74rem; line-height: 1.35; }

`;

export const FavoriteRollsContent = styled.div`
  position: relative;
  z-index: 5;
  display: grid;
  gap: 10px;
  max-height: min(28svh, 240px);
  min-width: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 3px;
  scrollbar-width: thin;
  scrollbar-color: var(--clearneonBlue) rgba(0, 23, 43, .72);

  &::-webkit-scrollbar { width: 7px; }
  &::-webkit-scrollbar-track { background: rgba(0, 23, 43, .72); }
  &::-webkit-scrollbar-thumb { border-radius: 10px; background: var(--clearneonBlue); }

  @media (max-width: 980px) {
    max-height: min(42svh, 320px);
  }
`;

export const FavoriteCharacterGroup = styled.section`
  display: grid;
  gap: 7px;
  min-width: 0;

  & + & {
    margin-top: 3px;
    padding-top: 11px;
    border-top: 1px solid rgba(57, 211, 255, .24);
  }
`;

export const FavoriteCharacterName = styled.h3`
  margin: 0;
  color: var(--whitesmoke);
  font-size: .76rem;
  font-weight: 700;
  letter-spacing: .025em;
  overflow-wrap: anywhere;
`;

export const FavoriteRollsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  min-width: 0;
`;

export const FavoriteRollShortcut = styled.button`
  max-width: 100%;
  padding: 7px 10px;
  border: 1px solid rgba(57, 211, 255, .44);
  background: rgba(0, 15, 30, .76);
  color: var(--whitesmoke);
  font-size: .72rem;
  line-height: 1.1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
  transition: border-color 150ms ease, color 150ms ease, background 150ms ease;

  &:hover:not(:disabled), &:focus-visible {
    border-color: var(--clearneonPink);
    background: rgba(255, 0, 168, .09);
    color: var(--clearneonPink);
    outline: none;
  }

  &:disabled { opacity: .52; cursor: wait; }
`;

export const MesaGameActivityHeader = styled.header`
  position: relative;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 18px 14px;
  border-bottom: 1px solid rgba(57, 211, 255, .27);

  h2 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    color: var(--clearneonBlue);
    font-family: 'DO Futuristic', sans-serif;
    font-size: 1.15rem;
    font-weight: 100;
  }

  button {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    width: 36px;
    height: 36px;
    border: 1px solid rgba(57, 211, 255, .62);
    background: rgba(0, 22, 38, .76);
    color: var(--clearneonBlue);
    cursor: pointer;
  }

  button:hover:not(:disabled), button:focus-visible {
    border-color: var(--clearneonBlue);
    background: rgba(0, 184, 255, .12);
  }

  button:disabled { opacity: .5; cursor: wait; }
`;

export const MesaGameActivityList = styled.div`
  position: relative;
  z-index: 5;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 14px 16px 18px;
  scrollbar-width: thin;
  scrollbar-color: var(--clearneonBlue) rgba(0, 23, 43, .72);

  &::-webkit-scrollbar { width: 8px; }
  &::-webkit-scrollbar-track { background: rgba(0, 23, 43, .72); }
  &::-webkit-scrollbar-thumb { border-radius: 10px; background: var(--clearneonBlue); }

  @media (max-width: 720px) {
    padding: 12px 12px 18px;
  }
`;

export const MesaGameActivityItem = styled.article<{ $hidden?: boolean }>`
  display: grid;
  gap: 7px;
  min-width: 0;
  margin-bottom: 10px;
  padding: 12px;
  border: 1px solid ${({ $hidden }) => $hidden
    ? 'rgba(174, 177, 190, .36)'
    : 'rgba(57, 211, 255, .38)'};
  border-left: 2px solid ${({ $hidden }) => $hidden
    ? 'rgba(174, 177, 190, .65)'
    : 'var(--clearneonBlue)'};
  background: rgba(0, 10, 23, .78);

  &:last-child { margin-bottom: 0; }

  header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
  }

  h3 {
    min-width: 0;
    margin: 0;
    color: ${({ $hidden }) => $hidden ? 'var(--lightGrey)' : 'var(--clearneonBlue)'};
    font-size: .92rem;
    overflow-wrap: anywhere;
  }

  time, small {
    flex: 0 0 auto;
    color: var(--lightGrey);
    font-size: .72rem;
  }

  p {
    min-width: 0;
    margin: 0;
    color: var(--white);
    font-size: .82rem;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  strong { color: var(--clearneonBlue); }
`;

export const MesaGameActivityMessage = styled.p<{ $error?: boolean }>`
  margin: 0;
  padding: 12px;
  border-left: 2px solid ${({ $error }) => $error ? 'var(--neonRed)' : 'var(--clearneonBlue)'};
  background: rgba(0, 10, 23, .78);
  color: ${({ $error }) => $error ? 'var(--neonRed)' : 'var(--lightGrey)'};
  font-size: .82rem;
  line-height: 1.45;
`;

export const MesaGameActivityMore = styled.button`
  display: block;
  width: 100%;
  margin-top: 12px;
  padding: 10px 12px;
  border: 1px solid rgba(57, 211, 255, .62);
  background: rgba(0, 22, 38, .76);
  color: var(--clearneonBlue);
  font-size: .8rem;
  font-weight: 700;
  cursor: pointer;

  &:hover:not(:disabled), &:focus-visible { background: rgba(0, 184, 255, .12); }
  &:disabled { opacity: .5; cursor: wait; }
`;
