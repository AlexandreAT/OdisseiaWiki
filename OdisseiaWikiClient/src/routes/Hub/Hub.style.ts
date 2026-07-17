import { styled } from 'styled-components';

interface Props {
    theme?: 'dark' | 'light';
    neon?: 'on' | 'off';
    img?: string;
}

interface SmallButtonProps extends Props {
  collapsed?: boolean;
  active?: boolean;
  index: number;
}

export const MainContainer = styled.div`
    width: 100%;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 20px;
    min-width: 0;
    max-width: 100%;
`

export const Header = styled.div<Props>`
    width: 100%;
    padding-top: 10px;
    margin: 0 35px;
    text-align: center;
    max-width: 100%;
    box-sizing: border-box;

    @media (max-width: 768px) {
      margin: 0;
      padding-inline: 8px;
    }
`

export const Title = styled.h1<Props>`
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 3px;
    font-size: 30px;

    ${props => props.theme === 'light' && `
        color: var(--clearneonYellow) !important;
        text-shadow: 0px 0px 5px var(--clearneonViolet);
    `};

    ${props => props.neon === 'on' && `
        color: var(--clearneonBlue) !important;
        text-shadow: 1.5px 1.5px 5px var(--clearneonPink);    
        ${props.theme === 'light' && `
            color: var(--clearneonYellow) !important;
            text-shadow: 0px 0px 5px var(--deepneonYellow);
        `};
    `};
`

export const ContentController = styled.div<{ collapsed?: boolean }>`
  width: 100%;
  height: ${({ collapsed }) => (collapsed ? '50px' : 'auto')};
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 50px;
  padding: ${({ collapsed }) => (collapsed ? '0' : '20px 20px 50px')};
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 1100px) {
    display: grid;
    grid-template-columns: ${({ collapsed }) => collapsed
      ? 'repeat(2, 60px)'
      : 'repeat(2, minmax(0, 1fr))'};
    width: min(100%, 720px);
    gap: 18px;

    > div {
      width: 100%;
      height: ${({ collapsed }) => collapsed ? '60px' : '220px'};
    }
  }

  @media (max-width: 768px) {
    grid-template-columns: ${({ collapsed }) => collapsed
      ? 'repeat(2, 46px)'
      : 'minmax(0, 1fr)'};
    gap: ${({ collapsed }) => collapsed ? '12px' : '18px'};
    padding: ${({ collapsed }) => collapsed ? '0' : '12px 8px 30px'};
    width: ${({ collapsed }) => collapsed ? '100%' : 'min(100%, 340px)'};
    justify-items: center;

    > div {
      width: ${({ collapsed }) => collapsed ? '46px' : 'min(100%, 300px)'};
      height: ${({ collapsed }) => collapsed ? '46px' : '170px'};
    }
  }
`

export const Content = styled.div<{ collapsed?: boolean }>`
    display: row;
    position: ${({ collapsed }) => collapsed ? 'static' : 'relative'};
    align-items: center;
    justify-content: center;
    width: 350px;
    height: 400px;
    max-width: 100%;

    @media (max-width: 1100px) {
      width: 100%;
      height: 220px;
    }

    @media (max-width: 768px) {
      height: 170px;
    }
`

export const DisabledFeatureOverlay = styled.div`
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.48);
  cursor: not-allowed;
`;

export const ProductionBanner = styled.div`
  width: 145%;
  padding: 10px 12px;
  transform: rotate(-12deg);
  background: repeating-linear-gradient(
    135deg,
    var(--neonYellow) 0 20px,
    var(--deepneonYellow) 20px 30px
  );
  color: var(--black) !important;
  font-family: 'DO Futuristic', sans-serif;
  font-size: clamp(12px, 2vw, 18px);
  font-weight: 900;
  letter-spacing: 2px;
  text-align: center;
  text-shadow: none;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.45);
  box-sizing: border-box;
`;

export const ClipButton = styled.button<Props>`
    position: relative;
    width: 100%;
    height: 100%;
    border: none;
    background: url(${props => props.img}) no-repeat center center;
    background-size: cover;
    overflow: hidden;
    cursor: pointer;
    border-radius: 10px;
    border: 2px solid var(--grey);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);

    &:disabled {
        cursor: not-allowed;
    }

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 1;
    }

    span {
        position: absolute;
        bottom: -50px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-size: 1.5rem;
        font-weight: bold;
        z-index: 2;
        transition: bottom 0.4s ease;
    }

    &:hover {
        &::before {
            opacity: 1;
        }
        span {
            bottom: 50%;
            transform: translate(-50%, 50%);
        }
        ${props => props.neon === 'on' 
            ? props.theme === 'dark'
                ? `box-shadow: 0 0 10px 1px var(--clearneonBlue);`
                : `box-shadow: 0 0 10px 1px var(--clearneonViolet);`
            : props.theme === 'dark' 
                ? `box-shadow: 0 0 10px 1px var(--whitesmoke);`
                : `box-shadow: 0 0 8px 1px var(--deepneonYellow);`
        }

        ${props => props.neon === 'on'
            ? props.theme === 'dark'
                ? `border: 2px solid white;`
                : `border: 2px solid var(--deepneonViolet);`
            : props.theme === 'dark' 
                ? `border: 2px solid var(--whitesmoke);`
                : `border: 2px solid var(--clearneonYellow);`
        }
        transition: all 0.4s ease;
    }
`;

export const ButtonSpan = styled.span<Props>`
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 3px;
    font-size: 20px;

    ${props => props.theme === 'light' && `
        color: var(--clearneonYellow) !important;
        text-shadow: 0px 0px 5px var(--clearneonViolet);
    `};

    ${props => props.neon === 'on' && `
        color: var(--clearneonBlue) !important;
        text-shadow: 1.5px 1.5px 5px var(--clearneonPink);    
        ${props.theme === 'light' && `
            color: var(--clearneonYellow) !important;
            text-shadow: 0px 0px 5px var(--deepneonYellow);
        `};
    `};
`

export const ClipButtonAnimated = styled(ClipButton)<SmallButtonProps>`
  position: ${({ collapsed }) => (collapsed ? 'absolute' : 'relative')};
  width: ${({ collapsed }) => (collapsed ? '60px' : '100%')};
  height: ${({ collapsed }) => (collapsed ? '60px' : '100%')};
  border-radius: ${({ collapsed }) => (collapsed ? '50%' : '10px')};
  top: ${({ collapsed }) => (collapsed ? '80px' : '0')};
  overflow: hidden;
  z-index: 5;
  transition: all 0.5s ease;

  &:disabled {
    ${({ collapsed }) => collapsed && `
      opacity: 0.52;
      filter: grayscale(0.7);
    `}
  }

  ${({ collapsed, index }) =>
    collapsed &&
    (index === 0
      ? `left: 20px;`   
      : `right: 20px;`)}

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: ${({ active }) => (active ? 'transparent' : 'rgba(0,0,0,0.5)')};
    border-radius: inherit;
    z-index: 1;
  }

  span {
    position: absolute;
    bottom: ${({ collapsed }) => (collapsed ? '-20px' : '-50px')};
    left: 50%;
    transform: translateX(-50%);
    font-size: ${({ collapsed }) => (collapsed ? '0.8rem' : '1.5rem')};
    font-weight: bold;
    color: white;
    z-index: 2;
  }
  
  ${({ active, theme, neon }) =>
    active && `
        box-shadow: ${neon === 'on' 
            ? theme === 'dark' 
            ? '0 0 10px 1px var(--clearneonBlue)' 
            : '0 0 10px 1px var(--clearneonViolet)' 
            : theme === 'dark' 
            ? '0 0 10px 1px var(--whitesmoke)' 
            : '0 0 8px 1px var(--deepneonYellow)'
        };
        border: 2px solid ${neon === 'on' 
            ? theme === 'dark' 
            ? 'white' 
            : 'var(--deepneonViolet)' 
            : theme === 'dark' 
            ? 'var(--whitesmoke)' 
            : 'var(--clearneonYellow)'
        };
    `}

  @media (max-width: 1100px) {
    ${({ collapsed, index }) => collapsed && index === 0 && `
      display: none;
    `}
  }

  @media (max-width: 768px) {
    ${({ collapsed }) => collapsed && `
      width: 46px;
      height: 46px;

      span {
        font-size: 0.62rem;
      }
    `}

    ${({ collapsed, index }) => collapsed && index === 0 && `
      display: none;
    `}
  }
`;

export const MobileCollapsedBackButton = styled.button<Props>`
  display: none;

  @media (max-width: 1100px) {
    position: absolute;
    top: 80px;
    left: 20px;
    z-index: 6;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    padding: 0;
    border: 2px solid ${({ theme, neon }) =>
      theme === 'dark'
        ? neon === 'on' ? 'var(--clearneonBlue)' : 'var(--neonBlue)'
        : neon === 'on' ? 'var(--clearneonViolet)' : 'var(--neonViolet)'};
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.45);
    color: ${({ theme, neon }) =>
      theme === 'dark'
        ? neon === 'on' ? 'var(--clearneonBlue)' : 'var(--neonBlue)'
        : neon === 'on' ? 'var(--clearneonViolet)' : 'var(--neonViolet)'};
    cursor: pointer;

    svg {
      font-size: 22px;
    }
  }
`;
