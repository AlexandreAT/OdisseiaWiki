import styled from "styled-components";
import { managementEntityToolbarResponsive } from '../../ManagementEntityToolbar.style';

interface Props {
    theme?: 'dark' | 'light';
    neon?: 'on' | 'off';
}

export const FormController = styled.form`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    gap: 20px;
    align-items: center;
    justify-content: center;
    z-index: 100;
    min-width: 0;
    max-width: 100%;

    > * {
        min-width: 0;
        max-width: 100%;
    }
`

export const FormHeader = styled.div<Props>`
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    gap: 20px;
    min-width: 0;

    @media (max-width: 768px) {
        flex-direction: column-reverse;
        align-items: center;
    }
`;

export const HeaderInputs = styled.div<Props>`
    width: 80%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    min-width: 0;

    @media (max-width: 1100px) {
        width: calc(100% - 230px);
    }

    @media (max-width: 768px) {
        width: 100%;
        flex-direction: column;
        gap: 10px;
    }
`;

export const HeaderAvatar = styled.div<Props>`
    width: 18%;
    display: flex;
    min-width: 0;

    @media (max-width: 1100px) {
        width: 210px;
        justify-content: center;
    }

    @media (max-width: 768px) {
        width: 100%;
        margin-bottom: 10px;
    }
`;

export const GridInputs = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 15px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

export const SectionTable = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    gap: 10px;
    min-width: 0;
    max-width: 100%;
    overflow-x: hidden;

    @media (max-width: 768px) {
        gap: 6px;
    }
`

export const TableTitle = styled.h2`
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 3px;

    @media (max-width: 768px) {
        margin: 4px 0;
        font-size: 20px;
        letter-spacing: 1px;
    }
`

export const RelatedCharactersSection = styled.div<{ fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 10px;
  grid-column: ${({ fullWidth }) => (fullWidth ? '1 / -1' : 'auto')};
`;

export const SectionTitle = styled.h2<Props>`
  font-family: 'DO Futuristic', sans-serif;
  font-weight: 100;
  letter-spacing: 3px;
  font-size: 1.1rem;
  color: ${({ theme }) =>
    theme === "dark" ? "var(--clearWhite)" : "var(--deepgrey)"};
`;

export const NavegationButtons = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;

    @media (max-width: 1100px) {
        order: -1;
        position: static;
        width: 100%;
        justify-content: center;
        padding: 10px;
        border-radius: 8px;
        background: rgba(0, 8, 18, 0.78);
        box-sizing: border-box;
    }

    @media (max-width: 768px) {
        gap: 8px;
        padding: 6px;

        > div {
            width: 155px !important;
            height: 51px !important;

            > div,
            > button {
                width: 140px !important;
                height: 38px !important;
            }

            > button {
                padding-inline: 8px;
                font-size: 10px;
            }
        }
    }

    ${managementEntityToolbarResponsive}
`

export const SectionStatus = styled.div<Props>`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    width: 100%;
    gap: 15px;
    min-width: 0;

    @media (max-width: 768px) {
        flex-direction: column;
    }
`

export const StatusHeader = styled.div<Props>`
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20px;
`

export const HeaderInfo = styled.div<Props>`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 50px;
    width: 100%;
    min-width: 0;
    flex-wrap: wrap;

    @media (max-width: 768px) {
        gap: 14px;
        align-items: stretch;

        > * {
            flex: 1 1 120px;
        }
    }
`

export const InfoController = styled.div`
    display: flex;
    flex-direction: row;
    gap: 5px;
    align-items: center;
    justify-content: center;
`

export const StatusContent = styled.div<Props>`
    display: flex;
    flex-direction: row;
    align-items: stretch;
    justify-content: center;
    margin: 20px 0;
    width: 100%;
    gap: 15px;
    min-width: 0;

    @media (min-width: 1101px) {
        display: grid;
        grid-template-columns: minmax(150px, 0.8fr) minmax(300px, 1.4fr) minmax(150px, 0.8fr);
        column-gap: 15px;
    }

    @media (max-width: 1100px) {
        display: grid;
        grid-template-columns: minmax(70px, 0.55fr) minmax(235px, 3.1fr) minmax(70px, 0.55fr);
        grid-template-areas:
          "primary defenses secondary"
          "primary image secondary";
        align-items: stretch;
        column-gap: 8px;
        row-gap: 4px;
        margin: 12px 0;
    }

    @media (max-width: 768px) {
        grid-template-columns: minmax(82px, 0.9fr) minmax(150px, 1.7fr) minmax(88px, 0.95fr);
        column-gap: 4px;
    }

    @media (max-width: 480px) {
        grid-template-columns: minmax(76px, 0.9fr) minmax(140px, 1.7fr) minmax(82px, 0.95fr);
        column-gap: 4px;
    }

    @media (max-width: 340px) {
        grid-template-columns: 72px minmax(132px, 1.7fr) 78px;
    }
`

export const StatusContentCenter = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    flex: 1 1 0;
    width: auto;
    max-width: none;
    gap: 4px;
    min-width: 0;

    @media (min-width: 1101px) {
        width: 100%;
    }

    @media (max-width: 1100px) {
        display: contents;
        max-width: none;
    }
`

export const StatusDefesaController = styled.div<Props>`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 20px 10px 10px;
    border-radius: 10px;
    background: ${({ theme, neon }) =>
        theme === "dark"
            ? neon === "on"
                ? "var(--blackTransp)"
                : "var(--clearblack)"
            : neon === "on"
                ? "var(--whitesmoke)"
                : "var(--clearWhite)"
        };
    
    border: 2px solid ${({ theme, neon }) =>
        theme === "dark"
            ? neon === "on"
                ? "var(--clearneonBlue)"
                : "var(--lightBlack)"
            : neon === "on"
                ? "var(--neonViolet)"
                : "var(--lightGrey)"
        };

    @media (max-width: 1100px) {
        grid-area: defenses;
        min-width: 0;
        padding: 10px 6px 6px;
        gap: 6px;
        align-self: start;
    }

    @media (max-width: 360px) {
        min-height: 120px;
    }
`

export const StatusDefesaDiv = styled.div<Props>`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-evenly;
    width: 100%;
    gap: clamp(10px, 2vw, 30px);
    min-width: 0;
    flex-wrap: nowrap;

    @media (max-width: 768px) {
        justify-content: center;
        gap: 8px;
        flex-wrap: nowrap;
    }
`

export const StatusImageDiv = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    position: relative;
    width: 100%;
    height: 100%;

    @media (max-width: 1100px) {
        grid-area: image;
        width: 100%;
        height: auto;
        min-height: clamp(160px, 42vw, 230px);
        align-items: center;
        align-self: start;
    }

    @media (max-width: 360px) {
        min-height: 140px;
    }
`

export const InfoImage = styled.img`
    top: 60px;
    position: absolute;
    z-index: -1;
    height: calc(100% - 60px);
    width: 100%;
    border-radius: 5px;
    box-shadow: 0px 0px 15px black;
    object-fit: cover;
    object-position: center;

    @media (max-width: 1250px) {
        height: 100%;
        max-width: 100%;
    }

    @media (max-width: 1100px) {
        height: auto;
        max-width: 100%;
    }

    @media (max-width: 480px) {
        height: auto;
        width: 80%;
    }
`;

export const AvatarController = styled.div<{ hasImage: boolean }>`
  border-radius: 50%;
  background: var(--black);
  display: flex;
  align-items: center;
  justify-content: center;

  min-width: ${({ hasImage }) => (hasImage ? "250px" : "215px")};
  min-height: ${({ hasImage }) => (hasImage ? "250px" : "215px")};
  width: ${({ hasImage }) => (hasImage ? "250px" : "215px")};
  height: ${({ hasImage }) => (hasImage ? "250px" : "215px")};

  @media (max-width: 1100px) {
    min-width: clamp(155px, 42vw, 230px);
    min-height: clamp(155px, 42vw, 230px);
    width: clamp(155px, 42vw, 230px);
    height: clamp(155px, 42vw, 230px);
  }

  @media (max-width: 768px) {
    > button {
      width: 100% !important;
      height: 100% !important;
      transform: none;
    }
  }

  @media (max-width: 360px) {
    min-width: 140px;
    min-height: 140px;
    width: 140px;
    height: 140px;
  }
`;

export const AtributeController = styled.div`
    flex: 0 1 125px;
    max-width: 125px;

    @media (min-width: 1101px) {
        width: 100%;
        max-width: none;
    }

    @media (max-width: 1100px) {
        grid-area: primary;
        width: 100%;
        height: 100%;
        min-width: 0;
        max-width: none;
    }

    @media (max-width: 768px) {
        justify-self: start;
    }
`

export const StatusAtributosDiv = styled.div<Props>`
    width: 125px;
    max-width: 125px;
    flex: 0 1 125px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    gap: 30px;
    padding: 20px 5px;
    border-radius: 10px;
    background: ${({ theme, neon }) =>
        theme === "dark"
            ? neon === "on"
                ? "var(--blackTransp)"
                : "var(--clearblack)"
            : neon === "on"
                ? "var(--whitesmoke)"
                : "var(--clearWhite)"
        };
    
    border: 2px solid ${({ theme, neon }) =>
        theme === "dark"
            ? neon === "on"
                ? "var(--clearneonBlue)"
                : "var(--lightBlack)"
            : neon === "on"
                ? "var(--neonViolet)"
                : "var(--lightGrey)"
        };

    @media (min-width: 1101px) {
        width: 100%;
        max-width: none;
        flex: none;
        box-sizing: border-box;
    }

    @media (max-width: 1100px) {
        width: 100%;
        max-width: none;
        flex: none;
        height: 100%;
        min-width: 0;
        grid-area: secondary;
        gap: 8px;
        padding: 8px 3px;
    }

    @media (max-width: 768px) {
        justify-self: end;
        box-sizing: border-box;
        padding-inline: 2px;
    }
`

export const LabelStatus = styled.h2<{ width?: string }>`
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 3px;
    font-size: ${({ width }) => width || '18px'};
    cursor: default;

    @media (max-width: 768px) {
        max-width: 100%;
        margin: 0;
        font-size: clamp(8px, 2.4vw, 10px);
        line-height: 1.15;
        letter-spacing: 0;
        text-align: center;
        white-space: nowrap;
        overflow-wrap: normal;
        word-break: normal;
    }
`

export const TagsSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

export const TagInputContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 10px;
  align-items: flex-start;
  width: 100%;
  min-width: 0;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

export const TagsList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  width: 100%;
  min-height: 40px;
`;

export const TagItem = styled.div<Props>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 20px;
  background: ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--blackTransp)'
        : 'var(--clearblack)'
      : neon === 'on'
        ? 'var(--whitesmoke)'
        : 'var(--clearWhite)'};
  border: 1px solid ${({ theme, neon }) =>
    theme === 'dark'
      ? neon === 'on'
        ? 'var(--clearneonBlue)'
        : 'var(--lightGrey)'
      : neon === 'on'
        ? 'var(--neonViolet)'
        : 'var(--deepgrey)'};
  font-size: 14px;
  color: ${({ theme }) =>
    theme === 'dark' ? 'var(--clearWhite)' : 'var(--deepgrey)'};
  transition: all 0.2s ease;
`;

export const TagRemoveButton = styled.button`
  background: none;
  border: none;
  color: var(--red);
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  padding: 0;
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

export const CheckboxSection = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const MinimalInput = styled.input.attrs({ type: "number" })`
  width: 30px;
  max-width: 60px;
  height: 100%;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: center;
  border-radius: 5px;
  padding: 2px;

  -moz-appearance: 1textfield;
  &::-webkit-outer-spin-button,
  &::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &:focus {
    outline: none;
  }

  @media (max-width: 768px) {
    width: 24px;
    max-width: 24px;
    font-size: 10px;
  }
`;

export const AtributoBox = styled.div<Props>`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border: 2px solid ${({ theme, neon }) =>
        theme === "dark" 
            ? neon === "on" 
                ? "var(--clearneonBlue)"
                : "var(--neonBlue)"
            : neon === "on"
                ? "var(--neonViolet)"
                : "var(--clearneonViolet)"
        };
    background-color: ${({ theme, neon }) =>
        theme === 'light' 
            && neon === 'on' 
                ? 'var(--clearWhite)'
                : 'var(--clearblack)'};
    border-radius: 8px;
    box-sizing: border-box;
    width: 50px;
    height: 50px;

    @media (max-width: 768px) {
        width: 34px;
        height: 34px;
    }
`

export const AtributoDiv = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;

    @media (max-width: 768px) {
        width: 100%;
        min-width: 0;
        gap: 2px;

        > h2 {
            font-size: 7px;
            line-height: 1.05;
        }

        input {
            font-size: 8px;
        }
    }
`

export const FormItemAtributos = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    align-items: center;
    justify-content: center;
    gap: 15px;
`

export const ProsthesisActions = styled.div`
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
    width: 100%;

    > * {
        width: 100% !important;
        min-width: 0;
        height: 62px !important;
    }

    > * > div,
    > * > button {
        width: 100% !important;
        height: 56px !important;
    }

    > * > button {
        padding: 10px 18px;
        white-space: normal;
        text-align: center;
    }

    @media (min-width: 1400px) {
        gap: 16px;

        > * {
            height: 68px !important;
        }

        > * > div,
        > * > button {
            height: 62px !important;
        }

        > * > button {
            padding-inline: 22px;
        }
    }

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 8px;

        > * {
            width: 100% !important;
            height: 64px !important;
        }

        > * > div,
        > * > button {
            width: 100% !important;
            height: 58px !important;
        }

        > * > button {
            padding: 12px 18px;
        }
    }
`
