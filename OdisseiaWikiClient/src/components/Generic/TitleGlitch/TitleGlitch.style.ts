import styled, { keyframes, css } from 'styled-components';

interface Props {
    theme?: 'dark' | 'light';
    neon?: 'on' | 'off';
}

const neonBlinkBlue = keyframes`
    0%, 2% { text-shadow: -1px -1px 3px var(--neonBlue), 1px 1px 3px var(--neonBlue); }
    3%, 3.5% { text-shadow: none; }
    4%, 4.9% { text-shadow: -1px -1px 3px var(--clearneonPink), 1px 1px 3px var(--clearneonBlue); }
    5%, 5.5% { text-shadow: none; }
    6%, 6.9% { text-shadow: -1px -1px 3px var(--clearneonBlue), 1px 1px 3px var(--clearneonPink); }
    7%, 46% { text-shadow: -1px -1px 3px var(--neonBlue), 1px 1px 3px var(--neonBlue); }
    47%, 48% { text-shadow: -1px -1px 3px var(--clearneonBlue), 1px 1px 3px var(--neonRed); }
    49%, 49.5% { text-shadow: none; }
    50%, 51% { text-shadow: -1px -1px 3px var(--neonRed), 1px 1px 3px var(--clearneonBlue); }
    51%, 51.5% { text-shadow: none; }
    52%, 100% { text-shadow: -1px -1px 4px var(--neonBlue), 1px 1px 4px var(--neonBlue); }
`;

const neonBlinkPink = keyframes`
    0%, 2% { text-shadow: -1px -1px 3px var(--clearneonPink), 1px 1px 3px var(--clearneonPink); }
    3%, 3.5% { text-shadow: none; }
    4%, 4.9% { text-shadow: -1px -1px 3px var(--clearneonBlue), 1px 1px 3px var(--neonPink); }
    5%, 5.5% { text-shadow: none; }
    6%, 6.9% { text-shadow: -1px -1px 3px var(--neonPink), 1px 1px 3px var(--clearneonBlue); }
    7%, 46% { text-shadow: -1px -1px 3px var(--clearneonPink), 1px 1px 3px var(--clearneonPink); }
    47%, 48% { text-shadow: -1px -1px 3px var(--neonPink), 1px 1px 3px var(--neonViolet); }
    49%, 49.5% { text-shadow: none; }
    50%, 51% { text-shadow: -1px -1px 3px var(--neonViolet), 1px 1px 3px var(--neonPink); }
    51%, 51.5% { text-shadow: none; }
    52%, 100% { text-shadow: -1px -1px 3px var(--clearneonPink), 1px 1px 3px var(--clearneonPink); }
`;

export const Title = styled.h2<Props>`
    font-family: 'Cyberpunk Is Not Dead', sans-serif;
    font-size: 2rem;
    color: var(--black) !important;
    text-shadow: ${({theme}) => theme === 'dark'
        ? `-1px -1px 0px var(--neonBlue), -1px 1px 0px var(--neonBlue), 1px -1px 0px var(--neonBlue), 1px 1px 0px var(--neonBlue)`
        : `-1px -1px 0px var(--neonPink), -1px 1px 0px var(--neonPink), 1px -1px 0px var(--neonPink), 1px 1px 0px var(--neonPink)`};
    letter-spacing: 3px;
    ${({ neon, theme }) => neon === 'on' && css`
      animation: ${theme === 'dark' ? neonBlinkBlue : neonBlinkPink} 12s infinite linear;
    `}
`;