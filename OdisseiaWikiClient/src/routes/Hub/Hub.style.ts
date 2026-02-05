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
`

export const Header = styled.div<Props>`
    width: 100%;
    padding-top: 10px;
    margin: 0 35px;
    text-align: center;
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
  height: ${({ collapsed }) => (collapsed ? '50px' : '100%')};
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 50px;
  padding: ${({ collapsed }) => (collapsed ? '0' : '20px 20px 50px')};
`

export const Content = styled.div`
    display: row;
    align-items: center;
    justify-content: center;
    width: 350px;
    height: 400px;
`

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
`;