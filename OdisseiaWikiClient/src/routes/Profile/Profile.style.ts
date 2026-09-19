import styled, { css, keyframes } from 'styled-components';
import { HudFrame } from '../../components/Generic/HudFrame';

const profileFrameReveal = keyframes`
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
`;

const profileLineHorizontal = keyframes`
  from { opacity: 0; transform: scaleX(0); }
  to { opacity: 1; transform: scaleX(1); }
`;

const profileLineVertical = keyframes`
  from { opacity: 0; transform: scaleY(0); }
  to { opacity: 1; transform: scaleY(1); }
`;

const profileCornerReveal = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

export const ProfilePage = styled.main`
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: min(1520px, calc(100% - 48px));
  margin: 0 auto;
  padding: 36px 0 24px;

  @media (max-width: 720px) {
    gap: 18px;
    width: min(100% - 20px, 1520px);
    padding-top: 22px;
  }
`;

export const ProfileFrame = styled(HudFrame)`
  width: 100%;
  padding: clamp(20px, 3vw, 36px);

  /* Somente os quatro frames externos do Perfil usam o encaixe amplo de Mesas. */
  > span:nth-of-type(1) { top: 0; left: 0; }
  > span:nth-of-type(2) { top: 0; right: 0; }
  > span:nth-of-type(3) { bottom: 0; left: 0; }
  > span:nth-of-type(4) { right: 0; bottom: 0; }

  > span:nth-of-type(5) { top: 0; }
  > span:nth-of-type(6) { right: 0; }
  > span:nth-of-type(7) { bottom: 0; }
  > span:nth-of-type(8) { left: 0; }

  ${({ neon }) => neon && css`
    animation: ${profileFrameReveal} 320ms ease-out both;

    > span:nth-of-type(-n + 4) {
      animation: ${profileCornerReveal} 160ms ease-out 430ms both;
    }

    > span:nth-of-type(5),
    > span:nth-of-type(7) {
      animation: ${profileLineHorizontal} 500ms ease-out both;
    }

    > span:nth-of-type(6),
    > span:nth-of-type(8) {
      animation: ${profileLineVertical} 500ms ease-out 250ms both;
    }
  `}

  @media (prefers-reduced-motion: reduce) {
    animation: none;

    > span {
      animation: none;
    }
  }
`;

export const SectionHeading = styled.header`
  position: relative;
  z-index: 4;
  margin-bottom: 26px;
  text-align: center;

  h1,
  h2 {
    margin: 0;
    color: var(--clearneonBlue) !important;
    font-family: 'DO Futuristic', sans-serif;
    font-size: clamp(1.55rem, 3vw, 2.55rem);
    font-weight: 100;
    letter-spacing: 0.09em;
    line-height: 1.1;
    text-transform: uppercase;
  }

  p {
    max-width: 780px;
    margin: 10px auto 0;
    color: var(--lightGrey) !important;
    line-height: 1.55;
  }

  @media (max-width: 520px) {
    margin-bottom: 20px;
    text-align: left;
  }
`;

export const ProfileGrid = styled.div`
  position: relative;
  z-index: 4;
  display: grid;
  grid-template-columns: minmax(220px, 300px) minmax(0, 1fr);
  gap: clamp(28px, 5vw, 58px);
  align-items: center;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

export const AvatarColumn = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 300px;
  margin: 0 auto;

  > div {
    max-width: 280px;
  }

  > p {
    margin-top: 10px;
    color: var(--lightGrey) !important;
    font-size: 0.78rem;
    text-align: center;
  }
`;

export const DetailsColumn = styled.div`
  display: grid;
  gap: 12px;
  min-width: 0;
`;

export const DataRow = styled.div`
  display: grid;
  grid-template-columns: 28px minmax(92px, 130px) minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  min-height: 58px;
  padding: 10px 14px;
  border: 1px solid rgba(77, 238, 234, 0.28);
  border-radius: 5px;
  background: rgba(0, 6, 15, 0.78);

  > svg {
    color: var(--clearneonBlue);
  }

  .profile-label {
    color: var(--clearneonBlue) !important;
    font-size: 0.9rem;
    font-weight: 700;
  }

  .profile-value {
    overflow: hidden;
    color: var(--whitesmoke) !important;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profile-readonly {
    color: var(--grey) !important;
    font-size: 0.72rem;
    white-space: nowrap;
  }

  @media (max-width: 650px) {
    grid-template-columns: 24px minmax(0, 1fr);
    gap: 5px 10px;

    .profile-label { align-self: end; }
    .profile-value,
    .profile-readonly,
    .profile-field,
    .profile-action {
      grid-column: 2;
    }
    .profile-value { white-space: normal; overflow-wrap: anywhere; }
  }
`;

export const EditableRow = styled(DataRow)`
  grid-template-columns: 28px minmax(92px, 130px) minmax(190px, 1fr);

  .profile-field {
    min-width: 0;
  }

  @media (max-width: 650px) {
    grid-template-columns: 24px minmax(0, 1fr);
  }
`;

export const ProfileActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;

  @media (max-width: 520px) {
    > div { width: 100%; }
  }
`;

export const EmbeddedContent = styled.div`
  position: relative;
  z-index: 4;
  min-width: 0;

  > main {
    max-width: none;
  }
`;

export const DangerArea = styled.div`
  position: relative;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;

  h2 {
    margin: 0 0 6px;
    color: var(--neonRed) !important;
    font-family: 'DO Futuristic', sans-serif;
    font-size: 1.25rem;
    font-weight: 100;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  p {
    max-width: 760px;
    color: var(--lightGrey) !important;
    line-height: 1.5;
  }

  @media (max-width: 700px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

export const DeleteModalContent = styled.div`
  display: grid;
  gap: 18px;

  p { line-height: 1.55; }
  strong { color: var(--neonRed); }
`;

export const DeleteModalActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 12px;
`;

export const ProfileLoading = styled.div`
  display: grid;
  min-height: calc(100svh - var(--main-header-height, 85px) - 8rem);
  place-items: center;
`;

export const ProfileError = styled(ProfileLoading)`
  align-content: center;
  gap: 18px;
  text-align: center;
`;
