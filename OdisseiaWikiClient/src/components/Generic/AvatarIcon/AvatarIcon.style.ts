import styled from 'styled-components';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  hasImage: boolean;
  size: number;
  clickable: boolean;
}

export const AvatarButton = styled.button<Props>`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: transparent;
  border-radius: 50%;
  z-index: 1;
  outline: none;
  border: none;
  transition: all 0.2s ease;

  width: ${({ size }) => size}px;
  height: ${({ size }) => size}px;

  ${({ clickable }) =>
    clickable
      ? `
        cursor: pointer;
        &:hover {
          transform: scale(1.2);
        }
      `
      : `
        cursor: default;
        pointer-events: none;
      `
  }

  ${({ hasImage, neon, theme }) =>
    hasImage &&
    `
      transform: scale(1.2);
      ${neon === 'on' &&
        `box-shadow: 0 0 10px 1px var(${
          theme === 'dark' ? `--neonBlue` : `--neonPink`
        });`
      }
  `}

  .iconAvatar {
    border-radius: 50%;
    fill: ${({ theme }) =>
      theme === 'dark' ? `var(--neonBlue)` : `var(--neonPink)`};
  }

  ${({ neon, theme }) =>
    neon === 'on' &&
    `
      .iconAvatar {
        fill: var(${theme === 'dark' ? `--clearneonBlue` : `--clearneonPink`});
        box-shadow: 0 0 10px 1px var(${
          theme === 'dark' ? `--neonBlue` : `--neonPink`
        });
        transition: all 0.3s ease-in-out;
      }
  `}
`;