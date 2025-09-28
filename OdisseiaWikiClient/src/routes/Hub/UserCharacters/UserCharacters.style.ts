import { styled } from 'styled-components';
import { IconButton } from "@mui/material";

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
}

export const Main = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    gap: 30px;
    margin-bottom: 20px;
    padding: 0 80px;
    z-index: 1;
`

export const Title = styled.h2<Props>`
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 3px;
    font-size: 24px;
    margin-bottom: 20px;

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
    
`

export const ListController = styled.div`
  width: 90%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 30px;
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
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100px;
  border: none;
  background: none;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: scale(1.05);
    transition: all 0.3s ease;
  }
`;

export const CharacterImage = styled.img<Props>`
  width: 110px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid transparent;
  transition: all 0.3s ease;

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

export const CharacterName = styled.span`
  margin-top: 5px;
  text-align: center;
  font-size: 0.9rem;
  color: white;
  font-weight: bold;
`;