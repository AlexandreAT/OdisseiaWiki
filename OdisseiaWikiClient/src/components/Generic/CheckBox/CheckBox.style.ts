import styled from 'styled-components';

interface Props {
  typeStyle?: 'primary' | 'secondary';
  fontSize?: string;
  width?: string;
  height?: string;
  neon?: 'on' | 'off';
  $neon?: 'on' | 'off';
}

const getNeon = (typeStyle?: 'primary' | 'secondary') => typeStyle === 'secondary' ? 'var(--neonPink)' : 'var(--neonBlue)';
const getClearNeon = (typeStyle?: 'primary' | 'secondary') => typeStyle === 'secondary' ? 'var(--clearneonPink)' : 'var(--clearneonBlue)';

export const ContainerController = styled.div<Props>`
    display: flex;
    align-items: center;
    width: ${({ width }) => width || '100%'};
    height: ${({ height }) => height || '20px'};
    &:has(> [data-field-help]) {
        height: auto;
        min-height: 25px;
        label { width: auto; }
    }
`

export const CheckboxLabel = styled.label<Props>`
    width: 100%;
    font-size: ${({ fontSize }) => fontSize || '0.9em'};
    font-weight: 500;
    display: flex;
    align-items: center;
    color: ${({ typeStyle }) => getNeon(typeStyle)};
    ${({ neon, typeStyle }) => neon === 'on'
        && `text-shadow: 0.5px 0.5px 1px ${getClearNeon(typeStyle)};`}
    cursor: pointer;
`;

export const InputCheckbox = styled.input.attrs({ type: 'checkbox' })<Props>`
    appearance: none;
    -webkit-appearance: none;
    box-sizing: border-box;
    flex: 0 0 20px;
    width: 20px;
    height: 20px;
    background-color: var(--deepgrey);
    margin-right: 8px;
    padding: 0;
    border: 1px solid var(--mediumgrey);
    border-radius: 4px;
    position: relative;
    outline: none;
    cursor: pointer;
    box-shadow: none;
    transition: background-color 180ms ease, border-color 180ms ease, box-shadow 180ms ease;

    &:checked {
        background-color: var(--black);
        border-color: ${({ $neon }) => $neon === 'on' ? 'var(--whitesmoke)' : 'var(--neonBlue)'};
        box-shadow: ${({ $neon }) => $neon === 'on'
            ? '0 0 4px var(--neonBlue), inset 0 0 3px var(--neonBlue)' : 'none'};
    }

    &:checked::after {
        content: "";
        display: block;
        box-sizing: content-box;
        width: 5px;
        height: 10px;
        border: solid var(--neonBlue);
        border-width: 0 3px 3px 0;
        transform: translate(-50%, -65%) rotate(45deg);
        position: absolute;
        left: 50%;
        top: 50%;
    }

    &:focus-visible { outline: 2px solid var(--whitesmoke); outline-offset: 3px; }
    &:disabled { opacity: .45; cursor: not-allowed; }
    :root[data-motion='reduced'] & { transition: none; }
`;
