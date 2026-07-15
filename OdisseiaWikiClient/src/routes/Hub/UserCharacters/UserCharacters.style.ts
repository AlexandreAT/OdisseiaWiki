import { styled } from 'styled-components';
import { IconButton } from "@mui/material";

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
}

export const Main = styled.div`
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    max-width: 1100px;
    width: 100%;
    height: auto;
    gap: 30px;
    margin-bottom: 20px;
    padding: 0 80px 40px;
    box-sizing: border-box;
    z-index: 1;
    min-width: 0;

    @media (max-width: 1100px) {
      padding-inline: 40px;
    }

    @media (max-width: 768px) {
      padding: 0 16px 32px;
      gap: 20px;
    }

    @media (max-width: 480px) {
      padding-inline: 4px;
    }
`

export const Title = styled.h2<Props & { $editMode?: boolean }>`
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 3px;
    font-size: 24px;

    ${props => props.theme === 'light'
        ? props.neon === 'on'
            ? `
                color: var(--clearneonYellow) !important;
                text-shadow: 0px 0px 5px var(--deepneonYellow);
            `
            : `
                color: var(--clearneonYellow) !important;
                text-shadow: 0px 0px 5px var(--clearneonViolet);
            `
        : props.neon === 'on'
            ? ` 
                color: var(--neonBlue) !important;
                text-shadow: 0px 0px 5px var(--clearneonBlue);
            `
            : `
                color: var(--clearneonBlue) !important;
                text-shadow: 1.5px 1.5px 5px var(--clearneonPink);
            `
    };

    @media (max-width: 768px) {
      ${({ $editMode }) => $editMode && `margin-top: 14px;`}
    }
    
`

export const ListController = styled.div`
  width: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 30px;
  min-width: 0;

  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    justify-content: stretch;
    gap: 10px;
  }
`;

export const ButtonDiv = styled.div<Props>`
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    .icon{
        fill: ${({ theme, neon }) => theme === "dark" 
            ? neon === "on" 
                ? "var(--clearneonBlue)"
                : "var(--neonBlue)"
            : neon === "on" 
                ? "var(--clearneonViolet)"
                : "var(--neonViolet)"};
    }
`

export const BackButtonDiv = styled.div<Props>`
    position: absolute;
    top: 55px;
    left: 0px;
    z-index: 10;

    @media (max-width: 1100px) {
      position: static;
      display: flex;
      align-self: flex-start;
      width: 100%;
    }

    @media (max-width: 768px) {
      display: none;
    }

    .icon{
        fill: ${({ theme, neon }) => theme === "dark" 
            ? neon === "on" 
                ? "var(--clearneonBlue)"
                : "var(--neonBlue)"
            : neon === "on" 
                ? "var(--clearneonViolet)"
                : "var(--neonViolet)"};
    }
`

export const StyledIconButton = styled(IconButton)<Props>`
  width: 60px;
  height: 60px;
  border-radius: 50%;
  border: 2px solid
    ${({ theme, neon }) =>
      theme === 'dark'
        ? neon === 'on'
          ? 'var(--clearneonBlue)'
          : 'var(--neonBlue)'
        : neon === 'on'
        ? 'var(--clearneonViolet)'
        : 'var(--neonViolet)'} !important;
  display: flex;
  justify-content: center;
  align-items: center;

  .icon {
    fill: ${({ theme, neon }) =>
      theme === 'dark'
        ? neon === 'on'
          ? 'var(--clearneonBlue)'
          : 'var(--neonBlue)'
        : neon === 'on'
        ? 'var(--clearneonViolet)'
        : 'var(--neonViolet)'};
    font-size: 32px;

    transition: all 0.3s ease;
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    padding: 5px;

    .icon {
      font-size: 22px;
    }
  }

  &:hover {
    border-color: ${({ theme, neon }) =>
      theme === 'dark'
        ? neon === 'on'
          ? 'var(--clearneonBlue)'
          : 'var(--neonBlue)'
        : neon === 'on'
        ? 'var(--clearneonViolet)'
        : 'var(--neonViolet)'} !important;
    
    background-color: ${({ theme, neon }) =>
        theme === 'dark'
            ? neon === 'on'
                ? 'var(--clearneonBlue)'
                : 'var(--neonBlue)'
            : neon === 'on'
                ? 'var(--clearneonViolet)'
                : 'var(--neonViolet)'
    } !important;

    box-shadow: 0 0 10px 1px ${({ theme, neon }) =>
        theme === 'dark'
            ? neon === 'on'
                ? 'var(--clearneonBlue)'
                : 'var(--neonBlue)'
            : neon === 'on'
                ? 'var(--clearneonViolet)'
                : 'var(--neonViolet)'
    } !important;

    .icon {
        fill: ${({ theme }) =>
            theme === 'dark'
                ? 'var(--black)'
                : 'var(--whitesmoke)'};

        transition: all 0.3s ease;
    }

    transition: all 0.3s ease;
  }

  transition: all 0.3s ease;
`;

export const CharacterCard = styled.button`
  width: 250px;
  height: 300px;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 5px;
  border: none;
  background: none;
  border-radius: 6px;
  padding: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    transition: all 0.3s ease;
  }

  background-color: var(--clearblack);
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 480px) {
    width: 100%;
  }

  @media (max-width: 768px) {
    width: 100%;
    height: 238px;
    gap: 2px;
    padding: 4px;
  }
`;

export const CardRight = styled.div`
  height: 100%;
  width: 60%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 5px;

  @media (max-width: 768px) {
    width: 55%;
    gap: 6px;
    padding: 3px;
    min-width: 0;
  }
`

export const CardLeft = styled.div`
  height: 100%;
  width: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 15px;
  padding: 10px 0;

  @media (max-width: 768px) {
    width: 45%;
    gap: 8px;
    padding: 6px 0;
    min-width: 0;
  }
`

export const CharacterImage = styled.img<Props>`
  width: 110px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid transparent;
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    width: clamp(52px, 16vw, 66px);
    max-width: 100%;
  }

  &:hover {
    box-shadow: 0 0 10px 1px ${({ theme, neon }) =>
        theme === 'dark'
            ? neon === 'on'
                ? 'var(--clearneonBlue)'
                : 'var(--neonBlue)'
            : neon === 'on'
                ? 'var(--clearneonViolet)'
                : 'var(--neonViolet)'
    }
  }
`;

export const CharacterInfos = styled.div`
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
  height: 100%;
  gap: 8px;

  @media (max-width: 768px) {
    margin-top: 4px;
    gap: 4px;
    min-width: 0;
  }
`

export const CharacterLabel = styled.p`
  text-align: center;
  font-size: 0.8rem;
  font-weight: bold;
  text-shadow: 1px 1px 3px black;
  word-wrap: break-word;
  max-width: 100%;

  @media (max-width: 768px) {
    margin: 0;
    font-size: 0.58rem;
    line-height: 1.2;
    overflow-wrap: anywhere;
  }
`

export const CharacterName = styled.span`
  margin-top: 5px;
  text-align: center;
  font-size: 0.9rem;
  color: white;
  font-weight: bold;
  font-family: 'DO Futuristic', sans-serif;
  letter-spacing: 2px;
  text-shadow: 1px 1px 3px black;
  word-wrap: break-word;
  max-width: 100%;

  @media (max-width: 768px) {
    margin-top: 2px;
    font-size: 0.68rem;
    line-height: 1.2;
    letter-spacing: 0.5px;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    overflow: hidden;
    overflow-wrap: anywhere;
  }
`;
