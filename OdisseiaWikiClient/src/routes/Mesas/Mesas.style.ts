import styled, { css, keyframes } from 'styled-components';
import HudCorner from '../../assets/svg/HudCorner.svg';

const fadeUp = keyframes`
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
`;

const hudLineHorizontal = keyframes`
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
`;

const hudLineVertical = keyframes`
  from { transform: scaleY(0); }
  to { transform: scaleY(1); }
`;

const mesaHudFrame = css<{ $neon?: boolean }>`
  position: relative;
  isolation: isolate;
  border: ${({ $neon }) => $neon ? '2px solid transparent' : '1px solid rgba(57, 211, 255, .64)'};
  background: ${({ $neon }) => $neon
    ? 'linear-gradient(145deg, rgba(4, 22, 42, .97), rgba(2, 7, 18, .94))'
    : 'linear-gradient(145deg, rgba(4, 18, 34, .94), rgba(2, 7, 18, .90))'};
  box-shadow: ${({ $neon }) => $neon
    ? 'inset 0 0 20px rgba(0, 178, 255, .19), 0 0 9px rgba(0, 204, 255, .30)'
    : 'inset 0 0 28px rgba(0, 179, 255, .035)'};
  clip-path: ${({ $neon }) => $neon
    ? 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)'
    : 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'};
  transition: clip-path 180ms ease, border-color 260ms ease, box-shadow 320ms ease, background-color 260ms ease;
`;

const mesaFuturisticTitle = css<{ $neon?: boolean }>`
  color: var(--clearneonBlue);
  font-family: 'DO Futuristic', sans-serif;
  font-weight: 100;
  letter-spacing: 1.4px;
  text-transform: uppercase;
  text-shadow: ${({ $neon }) => $neon
    ? '0 0 6px var(--clearneonBlue), 0 0 13px rgba(0, 204, 255, .5)'
    : 'none'};
`;

export const MesaPage = styled.main<{ $neon?: boolean }>`
  position: relative;
  z-index: 1;
  width: min(1520px, calc(100% - 48px));
  min-height: calc(100vh - 130px);
  margin: 0 auto;
  padding: 36px 0 64px;
  animation: ${fadeUp} 420ms ease both;

  @media (max-width: 720px) {
    width: min(100% - 20px, 1520px);
    padding: 22px 0 40px;
  }

  .mesa-hub-header {
    position: relative;
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 22px;
    margin-bottom: 28px;
    padding: 0 0 18px 20px;
    background: linear-gradient(90deg, rgba(0, 18, 39, .72), transparent 72%);

    &::before,
    &::after {
      content: '';
      position: absolute;
      pointer-events: none;
    }

    &::before {
      top: 0;
      bottom: 0;
      left: 0;
      width: 2px;
      background: var(--clearneonBlue);
      box-shadow: ${({ $neon }) => $neon ? '0 0 7px rgba(0, 204, 255, .72)' : 'none'};
    }

    &::after {
      right: 0;
      bottom: 0;
      left: 0;
      height: 1px;
      background: rgba(77, 238, 234, .42);
      box-shadow: ${({ $neon }) => $neon ? '0 0 7px rgba(0, 204, 255, .45)' : 'none'};
    }
  }

  .mesa-hub-kicker {
    margin: 0 0 5px;
    color: var(--clearneonBlue);
    font-size: .68rem;
    font-weight: 800;
    letter-spacing: .16em;
  }

  .mesa-hub-header h1 {
    margin: 0;
    ${mesaFuturisticTitle}
    font-size: clamp(1.7rem, 3vw, 2.55rem);
    line-height: 1.05;
  }

  .mesa-hub-header > div:first-child > p:last-child {
    margin: 8px 0 0;
    color: var(--lightGrey);
  }

  .mesa-hub-header > div:last-child {
    flex: 0 0 auto;
  }

  .mesa-hub-header > div:last-child button {
    min-width: 220px;
  }

  @media (max-width: 800px) {
    .mesa-hub-header {
      align-items: stretch;
      flex-direction: column;
      padding-left: 14px;
    }

    .mesa-hub-header > div:last-child {
      display: grid;
      grid-template-columns: 1fr;
    }

    .mesa-hub-header > div:last-child button { min-width: 0; }
  }
`;

export const MesaPageLoading = styled.div`
  display: grid;
  width: 100%;
  min-height: calc(100svh - var(--main-header-height, 85px) - 4rem);
  place-items: center;
  padding: 24px;

  @media (max-width: 768px) {
    min-height: calc(100svh - var(--main-header-height, 54px) - 2rem);
    padding: 16px;
  }
`;

export const PageHeader = styled.header<{ $neon?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 22px;
  padding: 0 0 14px 18px;
  background: linear-gradient(90deg, rgba(0, 18, 39, .58), transparent 72%);

  &::before,
  &::after {
    content: '';
    position: absolute;
    pointer-events: none;
  }

  &::before {
    top: 0;
    bottom: 0;
    left: 0;
    width: 2px;
    background: var(--clearneonBlue);
    box-shadow: ${({ $neon }) => $neon ? '0 0 7px rgba(0, 204, 255, .72)' : 'none'};
  }

  &::after {
    right: 0;
    bottom: 0;
    left: 0;
    height: 1px;
    background: rgba(77, 238, 234, .42);
    box-shadow: ${({ $neon }) => $neon ? '0 0 7px rgba(0, 204, 255, .45)' : 'none'};
  }

  h1 {
    margin: 0;
    ${mesaFuturisticTitle}
    font-size: clamp(1.45rem, 2.4vw, 2.15rem);
    line-height: 1.1;
  }

  p { color: var(--lightGrey); margin-top: 6px; }

  @media (max-width: 720px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

export const ActionButton = styled.button<{ $accent?: 'blue' | 'pink' | 'green' | 'red'; $compact?: boolean }>`
  --mesa-accent: ${({ $accent }) => $accent === 'pink'
    ? 'var(--clearneonPink)'
    : $accent === 'green'
      ? 'var(--clearneonGreen)'
      : $accent === 'red'
        ? 'var(--neonRed)'
        : 'var(--clearneonBlue)'};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: ${({ $compact }) => $compact ? '36px' : '44px'};
  padding: ${({ $compact }) => $compact ? '7px 12px' : '10px 18px'};
  border: 1px solid var(--mesa-accent);
  border-radius: 4px;
  background: color-mix(in srgb, var(--mesa-accent) 5%, rgba(0, 5, 14, 0.88));
  color: var(--mesa-accent);
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: ${({ $compact }) => $compact ? '.82rem' : '.95rem'};
  letter-spacing: .06em;
  cursor: pointer;
  transition: transform 160ms ease, box-shadow 160ms ease, background 160ms ease;

  svg { color: currentColor; font-size: 1.2em; }
  &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 0 10px color-mix(in srgb, var(--mesa-accent) 45%, transparent); }
  &:disabled { opacity: .38; cursor: not-allowed; }
`;

export const Section = styled.section`
  margin-top: 24px;
`;

export const SectionTitle = styled.div<{ $neon?: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
  padding: 2px 0 9px 13px;
  background: linear-gradient(90deg, rgba(0, 18, 39, .44), transparent 68%);

  &::before,
  &::after {
    content: '';
    position: absolute;
    pointer-events: none;
  }

  &::before {
    top: 0;
    bottom: 0;
    left: 0;
    width: 1px;
    background: var(--clearneonBlue);
    box-shadow: ${({ $neon }) => $neon ? '0 0 6px rgba(0, 204, 255, .65)' : 'none'};
  }

  &::after {
    right: 0;
    bottom: 0;
    left: 0;
    height: 1px;
    background: rgba(77, 238, 234, .36);
    box-shadow: ${({ $neon }) => $neon ? '0 0 6px rgba(0, 204, 255, .42)' : 'none'};
  }

  h2 {
    margin: 0;
    ${mesaFuturisticTitle}
    font-size: clamp(.96rem, 1.6vw, 1.25rem);
    line-height: 1.15;
  }
`;

export const TableList = styled.div`
  display: grid;
  gap: 10px;
`;

export const MesaRow = styled.article<{ $neon?: boolean }>`
  display: grid;
  grid-template-columns: minmax(180px, 300px) minmax(0, 1fr) auto;
  gap: 20px;
  align-items: stretch;
  min-height: 112px;
  padding: 8px;
  ${mesaHudFrame}
  transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease, clip-path 180ms ease;
  cursor: pointer;

  &:hover { transform: translateY(-2px); border-color: var(--clearneonBlue); box-shadow: 0 0 12px rgba(0,184,255,.24); }

  @media (max-width: 760px) {
    grid-template-columns: 118px minmax(0, 1fr);
    gap: 12px;
    min-height: 126px;
    > :last-child { grid-column: 1 / -1; }
  }
`;

export const MesaRowImage = styled.div`
  overflow: hidden;
  min-height: 94px;
  border: 1px solid rgba(77, 238, 234, .28);
  background: rgba(0, 0, 0, .55);
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
`;

export const MesaRowBody = styled.div`
  min-width: 0;
  padding: 7px 0;
  h3 { font-size: 1.05rem; color: var(--whitesmoke); margin-bottom: 4px; }
  > p { color: var(--lightGrey); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 9px; }
`;

export const MesaMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 7px 16px;
  font-size: .83rem;
  color: var(--lightGrey);
  span { display: inline-flex; gap: 6px; align-items: center; color: inherit; }
  svg, strong { color: var(--clearneonBlue); }
`;

export const MesaRowActions = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 8px;
  min-width: 150px;
  padding-top: 4px;

  @media (max-width: 760px) {
    min-width: 0;
    padding-top: 0;
    justify-content: stretch;
    button { flex: 1; }
  }
`;

export const EmptyState = styled.div`
  padding: 32px 18px;
  border: 1px dashed rgba(77, 238, 234, .32);
  background: rgba(0, 8, 20, .66);
  text-align: center;
  color: var(--lightGrey);
  svg { display: block; margin: 0 auto 10px; color: var(--clearneonBlue); font-size: 2rem; }
`;

export const Pagination = styled.nav`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 15px;

  button, span {
    min-width: 34px;
    height: 34px;
    display: grid;
    place-items: center;
    border: 1px solid rgba(77,238,234,.38);
    border-radius: 4px;
    background: rgba(0,9,22,.86);
    color: var(--whitesmoke);
  }
  button { cursor: pointer; }
  button:hover:not(:disabled) { border-color: var(--clearneonBlue); color: var(--clearneonBlue); }
  button:disabled { opacity: .35; cursor: not-allowed; }
  span { color: var(--clearneonBlue); }
`;

export const SearchToolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(220px, 300px) auto;
  gap: 14px;
  align-items: start;
  margin-bottom: 22px;

  @media (max-width: 820px) { grid-template-columns: 1fr 1fr; > :first-child { grid-column: 1 / -1; } }
  @media (max-width: 560px) { grid-template-columns: 1fr; > :first-child { grid-column: auto; } }
`;

export const CheckFilter = styled.label`
  min-height: 52px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 15px;
  border: 1px solid rgba(77,238,234,.35);
  border-radius: 4px;
  background: rgba(1,9,20,.9);
  cursor: pointer;
  input { accent-color: var(--clearneonBlue); width: 17px; height: 17px; }
`;

export const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  @media (max-width: 1040px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  @media (max-width: 650px) { grid-template-columns: 1fr; }
`;

export const MesaCardShell = styled.article<{ $neon?: boolean }>`
  min-height: 360px;
  display: flex;
  flex-direction: column;
  ${mesaHudFrame}
  cursor: pointer;
  transition: transform 170ms ease, box-shadow 170ms ease, border-color 170ms ease, clip-path 180ms ease;
  &:hover { transform: translateY(-4px); border-color: var(--clearneonBlue); box-shadow: 0 0 16px rgba(0,184,255,.26); }
`;

export const MesaCardImage = styled.div`
  height: 190px;
  background: rgba(0,0,0,.65);
  img { display:block; width:100%; height:100%; object-fit:cover; }
`;

export const MesaCardBody = styled.div`
  display:flex;
  flex-direction:column;
  flex:1;
  gap:9px;
  padding:15px 17px;
  h3 { font-size:1.08rem; }
  p { color:var(--lightGrey); line-height:1.45; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
`;

export const TagRow = styled.div`
  display:flex;
  flex-wrap:wrap;
  gap:7px;
`;

export const Tag = styled.span<{ $pink?: boolean }>`
  padding:4px 8px;
  border:1px solid ${({ $pink }) => $pink ? 'rgba(255,0,184,.55)' : 'rgba(77,238,234,.5)'};
  border-radius:3px;
  color:${({ $pink }) => $pink ? 'var(--clearneonPink)' : 'var(--clearneonBlue)'};
  background:rgba(0,0,0,.3);
  font-size:.7rem;
  text-transform:uppercase;
`;

export const CardFooter = styled.div`
  display:flex;
  justify-content:space-between;
  gap:10px;
  margin-top:auto;
  padding-top:10px;
  border-top:1px solid rgba(189,189,189,.17);
  font-size:.82rem;
  span { display:flex; align-items:center; gap:6px; color:var(--lightGrey); }
  svg { color:var(--clearneonBlue); }
`;

export const MesaPublicBackdrop = styled.div<{ $backgroundImage?: string }>`
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: rgba(0, 7, 18, .82);

  &::before {
    content: '';
    position: absolute;
    inset: -24px;
    background-image: ${({ $backgroundImage }) => $backgroundImage ? `url("${$backgroundImage}")` : 'none'};
    background-repeat: no-repeat;
    background-position: center;
    background-size: cover;
    filter: blur(14px);
    transform: scale(1.08);
    opacity: .38;
  }

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(180deg, rgba(0, 7, 18, .48) 0%, rgba(0, 7, 18, .74) 57%, rgba(0, 7, 18, .91) 100%),
      linear-gradient(90deg, rgba(0, 7, 18, .64), transparent 32%, transparent 68%, rgba(0, 7, 18, .64));
  }
`;

export const MesaPublicPage = styled(MesaPage)`
  min-height: calc(100svh - var(--main-header-height, 85px));
`;

export const MesaHudCorner = styled.span<{
  $position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  $neon: boolean;
  $color?: string;
}>`
  position: absolute;
  z-index: 4;
  width: 50px;
  height: 50px;
  pointer-events: none;
  background-color: ${({ $color, $neon }) => $color ?? ($neon ? 'var(--clearneonBlue)' : 'var(--neonBlue)')};
  filter: ${({ $color, $neon }) => {
    const color = $color ?? ($neon ? 'var(--clearneonBlue)' : 'var(--neonBlue)');
    return $neon
      ? `drop-shadow(0 0 2px ${color}) drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`
      : `drop-shadow(0 0 3px ${color})`;
  }};
  -webkit-mask-image: url("${HudCorner}");
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  -webkit-mask-position: center;
  mask-image: url("${HudCorner}");
  mask-repeat: no-repeat;
  mask-size: contain;
  mask-position: center;

  ${({ $position }) => {
    if ($position === 'top-left') return css`top: 0; left: 0; transform: scaleY(-1);`;
    if ($position === 'top-right') return css`top: 0; right: 0; transform: scale(-1);`;
    if ($position === 'bottom-right') return css`right: 0; bottom: 0; transform: scaleX(-1);`;
    return css`bottom: 0; left: 0;`;
  }}
`;

export const MesaHudLine = styled.span<{
  $position: 'top' | 'right' | 'bottom' | 'left';
  $active: boolean;
  $color?: string;
}>`
  position: absolute;
  z-index: 3;
  pointer-events: none;
  background: ${({ $color }) => $color ?? 'var(--clearneonBlue)'};
  box-shadow: 0 0 5px ${({ $color }) => $color ?? 'var(--clearneonBlue)'};
  will-change: opacity, transform;

  ${({ $position }) => {
    if ($position === 'top') return css`
      top: 0; right: 48px; left: 48px; height: 2px;
      transform: scaleX(0); transform-origin: left center;
    `;
    if ($position === 'bottom') return css`
      right: 48px; bottom: 0; left: 48px; height: 2px;
      transform: scaleX(0); transform-origin: right center;
    `;
    if ($position === 'left') return css`
      top: 48px; bottom: 48px; left: 0; width: 2px;
      transform: scaleY(0); transform-origin: top center;
    `;
    return css`
      top: 48px; right: 0; bottom: 48px; width: 2px;
      transform: scaleY(0); transform-origin: bottom center;
    `;
  }}

  ${({ $position, $active }) => $active && ($position === 'top' || $position === 'bottom'
    ? css`animation: ${hudLineHorizontal} 500ms ease-out forwards;`
    : css`animation: ${hudLineVertical} 500ms ease-out 250ms forwards;`)}
`;

export const PublicHero = styled.section<{ $neon: boolean }>`
  ${mesaHudFrame}
  box-shadow: ${({ $neon }) => $neon
    ? 'inset 0 0 20px rgba(0, 178, 255, .19), 0 0 9px rgba(0, 204, 255, .30)'
    : '0 18px 42px rgba(0, 0, 0, .28), inset 0 0 34px rgba(0, 179, 255, .035)'};
`;

export const PublicBanner = styled.div`
  position: relative;
  display: grid;
  place-items: center;
  min-height: clamp(310px, 46vh, 520px);
  overflow: hidden;
  background: rgba(0, 9, 21, .94);

  img {
    position: absolute;
    inset: 0;
    z-index: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 1;
    background:
      linear-gradient(90deg, rgba(0, 7, 18, .82), rgba(0, 7, 18, .18) 48%, rgba(0, 7, 18, .68)),
      linear-gradient(0deg, rgba(0, 6, 17, .72), transparent 55%);
  }

  &::after {
    content: '';
    position: absolute;
    inset: 14px;
    z-index: 2;
    border: 1px solid rgba(60, 216, 255, .22);
    clip-path: polygon(0 0, 14% 0, 14% 2px, 2px 2px, 2px 18%, 0 18%, 0 0, 100% 0, 100% 100%, 86% 100%, 86% calc(100% - 2px), calc(100% - 2px) calc(100% - 2px), calc(100% - 2px) 82%, 100% 82%);
  }

  @media (max-width: 768px) {
    min-height: clamp(250px, 38vh, 340px);
  }
`;

export const PublicBannerTitle = styled.div`
  position: relative;
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: min(calc(100% - 72px), 1180px);
  overflow: visible;

  @media (max-width: 768px) {
    width: min(calc(100% - 34px), 960px);
  }
`;

export const PublicContent = styled.div`
  position: relative;
  z-index: 3;
  padding: clamp(20px, 3vw, 34px) clamp(18px, 4vw, 56px) 34px;
  > p { margin:22px 0; color:var(--lightGrey); line-height:1.65; white-space:pre-line; }
`;

export const MasterLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 20px;
  margin: 0 0 14px;
  color: var(--lightGrey);

  span {
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    gap: 7px;
    line-height: 1;
    white-space: nowrap;
  }

  svg { flex: 0 0 auto; font-size: 1.18rem; color: var(--clearneonBlue); }
  strong { color: var(--clearneonBlue); }
`;

export const StatGrid = styled.div`
  display:grid;
  grid-template-columns:repeat(4,minmax(0,1fr));
  gap:14px;
  margin:20px 0;
  @media(max-width:820px){grid-template-columns:repeat(2,minmax(0,1fr));}
  @media(max-width:480px){grid-template-columns:1fr;}
`;

export const StatBox = styled.div<{
  $accent?: 'blue' | 'pink' | 'violet' | 'green';
  $neon: boolean;
}>`
  --mesa-panel-accent: ${({ $accent }) => $accent === 'pink'
    ? 'var(--clearneonPink)'
    : $accent === 'violet'
      ? 'var(--clearneonViolet)'
      : $accent === 'green'
        ? 'var(--clearneonGreen)'
        : 'var(--clearneonBlue)'};
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 90px;
  padding: 16px;
  ${mesaHudFrame}
  border: ${({ $neon }) => $neon ? '2px solid transparent' : '1px solid color-mix(in srgb, var(--mesa-panel-accent) 58%, transparent)'};
  box-shadow: ${({ $neon }) => $neon
    ? 'inset 0 0 20px color-mix(in srgb, var(--mesa-panel-accent) 19%, transparent), 0 0 9px color-mix(in srgb, var(--mesa-panel-accent) 30%, transparent)'
    : 'inset 0 0 28px color-mix(in srgb, var(--mesa-panel-accent) 4%, transparent)'};
  clip-path: ${({ $neon }) => $neon
    ? 'polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)'
    : 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'};
  transition: clip-path 180ms ease, border-color 260ms ease, box-shadow 320ms ease, background-color 260ms ease;

  svg { flex: 0 0 auto; font-size:1.75rem; color:var(--mesa-panel-accent); }
  small { display:block; color:var(--mesa-panel-accent); font-family:'DO Futuristic', sans-serif; font-size:.75rem; letter-spacing:.04em; }
  strong { display:block; margin-top:4px; color:var(--whitesmoke); font-size:1.2rem; }
`;

export const FormFrame = styled.section<{ $neon?: boolean }>`
  width:min(1240px,100%);
  margin:auto;
  padding:clamp(18px,4vw,48px);
  ${mesaHudFrame}
`;

export const FormGrid = styled.form`
  display:grid;
  grid-template-columns:minmax(300px,.85fr) minmax(340px,1.15fr);
  gap:28px 40px;
  @media(max-width:860px){grid-template-columns:1fr;}
`;

export const FormColumn = styled.div`
  display:flex;
  flex-direction:column;
  gap:19px;
`;

export const FieldLabel = styled.label`
  display:flex;
  flex-direction:column;
  gap:8px;
  color:var(--whitesmoke);
  > span { font-size:.9rem; }
  textarea, input {
    width:100%;
    min-height:52px;
    border:1px solid rgba(77,238,234,.42);
    border-radius:4px;
    padding:13px 15px;
    background:rgba(0,5,14,.88);
    color:var(--whitesmoke);
    outline:none;
    resize:vertical;
  }
  textarea{min-height:132px;line-height:1.5;}
  input:focus,textarea:focus{border-color:var(--clearneonBlue);box-shadow:0 0 8px rgba(0,184,255,.24);}
  small{align-self:flex-end;color:var(--grey);}
`;

export const FormFooter = styled.div`
  grid-column:1/-1;
  display:flex;
  justify-content:center;
  gap:12px;
  padding-top:12px;
`;

export const ManagementLayout = styled.div`
  display:grid;
  grid-template-columns:275px minmax(0,1fr);
  gap:20px;
  @media(max-width:900px){grid-template-columns:1fr;}
`;

export const ManagementSidebar = styled.aside<{ $neon?: boolean }>`
  align-self:start;
  padding:18px;
  ${mesaHudFrame}
  position:sticky;
  top:110px;
  h3{margin:0 0 15px;${mesaFuturisticTitle}font-size:1rem;line-height:1.15;}
  @media(max-width:900px){position:static;}
`;

export const SidebarMenu = styled.nav`
  display:flex;
  flex-direction:column;
  gap:7px;
  @media(max-width:900px){display:grid;grid-template-columns:repeat(3,minmax(0,1fr));}
  @media(max-width:560px){grid-template-columns:repeat(2,minmax(0,1fr));}
`;

export const SidebarButton = styled.button<{ $active?: boolean }>`
  display:flex;
  align-items:center;
  gap:10px;
  min-height:44px;
  padding:9px 12px;
  border:1px solid ${({$active})=>$active?'var(--clearneonBlue)':'transparent'};
  border-radius:3px;
  background:${({$active})=>$active?'rgba(0,184,255,.09)':'transparent'};
  color:${({$active})=>$active?'var(--clearneonBlue)':'var(--lightGrey)'};
  cursor:pointer;
  text-align:left;
  svg{color:currentColor;}
  &:hover:not(:disabled){color:var(--clearneonBlue);background:rgba(0,184,255,.06);}
  &:disabled{opacity:.36;cursor:not-allowed;}
`;

export const ManagementContent = styled.section<{ $neon?: boolean }>`
  min-width:0;
  padding:clamp(18px,3vw,32px);
  ${mesaHudFrame}
`;

export const RequestCard = styled.article<{ $neon?: boolean }>`
  display:grid;
  grid-template-columns:auto minmax(0,1fr) auto;
  align-items:center;
  gap:16px;
  padding:15px;
  ${mesaHudFrame}
  img{width:70px;height:70px;border-radius:50%;object-fit:cover;border:1px solid var(--clearneonBlue);}
  h3{margin-bottom:4px;} p{color:var(--lightGrey);line-height:1.45;}
  @media(max-width:650px){grid-template-columns:auto 1fr;> :last-child{grid-column:1/-1;}}
`;

export const CharacterGrid = styled.div`
  display:grid;
  grid-template-columns:repeat(3,minmax(310px,1fr));
  gap:18px;
  @media(max-width:1220px){grid-template-columns:repeat(2,minmax(300px,1fr));}
  @media(max-width:720px){grid-template-columns:1fr;}
`;

/** Grade própria da Mesa em jogo. Mantém os cards altos e legíveis sem afetar as demais seleções de personagem. */
export const MesaGameCharacterGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 430px));
  justify-content: center;
  align-items: stretch;
  gap: 22px;

  @media (max-width: 720px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const GameStatus = styled.div<{ $neon?: boolean }>`
  display:grid;
  grid-template-columns:repeat(5,minmax(0,1fr));
  gap:1px;
  margin:18px 0 22px;
  padding:1px;
  ${mesaHudFrame}
  background:rgba(77,238,234,.18);
  >div{padding:13px 16px;background:rgba(0,10,24,.95);}
  small{display:block;color:var(--clearneonBlue);text-transform:uppercase;font-size:.67rem;font-weight:700;}
  strong{display:block;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  @media(max-width:860px){grid-template-columns:repeat(2,minmax(0,1fr));>div:last-child{grid-column:1/-1;}}
`;

export const LiveBadge = styled.span<{ $connected:boolean }>`
  display:inline-flex;
  align-items:center;
  gap:7px;
  padding:5px 9px;
  border:1px solid ${({$connected})=>$connected?'var(--clearneonGreen)':'var(--neonRed)'};
  color:${({$connected})=>$connected?'var(--clearneonGreen)':'var(--neonRed)'};
  border-radius:3px;
  font-size:.75rem;
  text-transform:uppercase;
  &::before{
    content:'';
    width:7px;
    height:7px;
    border-radius:50%;
    background:${({ $connected }) => $connected ? 'var(--clearneonGreen)' : 'var(--neonRed)'};
    box-shadow:0 0 7px ${({ $connected }) => $connected ? 'var(--clearneonGreen)' : 'var(--neonRed)'};
  }
`;

export const LiveControl = styled.label<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 4px 9px;
  border: 1px solid ${({ $active }) => $active ? 'var(--clearneonGreen)' : 'rgba(189, 189, 189, .5)'};
  border-radius: 3px;
  color: ${({ $active }) => $active ? 'var(--clearneonGreen)' : 'var(--lightGrey)'};
  font-family: 'Cyberpunk Is Not Dead', sans-serif;
  font-size: .72rem;
  letter-spacing: .04em;
  cursor: pointer;

  input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }

  .live-control-track {
    position: relative;
    width: 31px;
    height: 16px;
    border: 1px solid currentColor;
    border-radius: 999px;
    background: rgba(0, 0, 0, .35);
    transition: background 160ms ease, box-shadow 160ms ease;
  }

  .live-control-track::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 3px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: currentColor;
    transition: transform 160ms ease;
  }

  input:checked + .live-control-track {
    background: color-mix(in srgb, var(--clearneonGreen) 20%, transparent);
    box-shadow: 0 0 8px color-mix(in srgb, var(--clearneonGreen) 50%, transparent);
  }

  input:checked + .live-control-track::after { transform: translateX(14px); }
  input:focus-visible + .live-control-track { outline: 2px solid var(--clearneonBlue); outline-offset: 3px; }
  input:disabled ~ span:last-child { opacity: .55; }
`;

export const DeadCardWrapper = styled.div<{ $exiting?:boolean }>`
  min-width:0;
  opacity:${({$exiting})=>$exiting?0:1};
  transform:${({$exiting})=>$exiting?'scale(.94)':'scale(1)'};
  transition:opacity 450ms ease,transform 450ms ease;
`;

export const ModalTextarea = styled.textarea`
  width:100%;min-height:120px;padding:13px;border:1px solid rgba(77,238,234,.44);border-radius:4px;
  background:rgba(0,4,12,.88);color:var(--whitesmoke);resize:vertical;outline:none;
  &:focus{border-color:var(--clearneonBlue);box-shadow:0 0 8px rgba(0,184,255,.2);}
`;

export const CharacterOwnerLine = styled.div`
  display:flex;align-items:center;gap:7px;color:var(--lightGrey);font-size:.78rem;margin:-2px 0 8px;
  strong{color:var(--clearneonBlue);}
`;

export const OnlineDot = styled.span<{ $online:boolean }>`
  width:8px;height:8px;border-radius:50%;background:${({$online})=>$online?'var(--clearneonGreen)':'var(--grey)'};
  box-shadow:${({$online})=>$online?'0 0 7px var(--clearneonGreen)':'none'};
`;

export const DisabledHint = styled.span`
  margin-left:auto;padding:2px 6px;border:1px solid rgba(189,189,189,.25);border-radius:3px;color:var(--grey);font-size:.65rem;
`;
