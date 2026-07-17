import styled from "styled-components";

interface Props {
    theme?: 'dark' | 'light';
    neon?: 'on' | 'off';
}

export const FormController = styled.form<{ marginTop?: string }>`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: auto;
    min-height: 0;
    position: relative;
    gap: 20px;
    align-items: center;
    justify-content: flex-start;
    z-index: 100;
    margin-top: ${({ marginTop }) => marginTop || '20px'};
    padding-bottom: 40px;
    box-sizing: border-box;
    min-width: 0;
    max-width: 100%;

    > * {
        min-width: 0;
        max-width: 100%;
    }
`

export const FormEditController = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;

    @media (max-width: 1100px) {
        width: 100%;
        box-sizing: border-box;
    }
`

export const FormHeader = styled.div<Props>`
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 32px;
    min-width: 0;

    @media (max-width: 1100px) {
        gap: 20px;
    }

    @media (max-width: 768px) {
        flex-direction: column-reverse;
    }
`;

export const HeaderInputs = styled.div<Props>`
    width: calc(75% - 16px);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-width: 0;

    @media (max-width: 1100px) {
        width: calc(70% - 10px);
    }

    @media (max-width: 768px) {
        width: 100%;
        flex-direction: column;
        gap: 10px;
    }
`;

export const HeaderAvatar = styled.div<Props>`
    width: calc(25% - 16px);
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 0;

    @media (max-width: 1100px) {
        width: calc(30% - 10px);
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

export const RelatedCharactersSection = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 10px;
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
    justify-content: center;
    width: 100%;

    > * {
        max-width: 100%;
    }

    @media (max-width: 1100px) {
        order: -1;
        position: static;
        padding: 10px;
        border-radius: 8px;
        background: rgba(0, 8, 18, 0.78);
        box-sizing: border-box;
    }

    @media (max-width: 768px) {
        flex-wrap: nowrap;
        gap: 4px;
        padding: 6px;

        > div {
            flex: 1 1 0;
            width: auto !important;
            min-width: 0;
            height: 44px !important;

            > div,
            > button {
                width: 100% !important;
                height: 36px !important;
            }

            > button {
                padding-inline: 4px;
                font-size: 9px;
            }
        }
    }
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
            flex: 1 1 130px;
            min-width: 0;
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

export const BottomContentController = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    gap: 20px;
    min-width: 0;
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
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;

    @media (max-width: 1100px) {
      grid-area: defenses;
      grid-row: 1;
      gap: 6px;
      padding: 8px 5px;
      align-self: start;

      > h2 {
        font-size: 12px;
      }
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
      gap: 6px;
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
      align-items: flex-start;
      align-self: start;
      margin-top: -2px;
    }

    @media (max-width: 768px) {
      min-height: clamp(136px, 32vw, 190px);
    }

    @media (max-width: 480px) {
      min-height: clamp(124px, 31vw, 145px);
    }

    @media (max-width: 360px) {
      min-height: 122px;
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

export const AvatarController = styled.div<{ hasImage: boolean, imageSize?: number }>`
  border-radius: 50%;
  background: var(--black);
  display: flex;
  align-items: center;
  justify-content: center;

  min-width: ${({ hasImage, imageSize }) => (imageSize ? `${imageSize + 45}px` : hasImage ? "250px" : "215px")};
  min-height: ${({ hasImage, imageSize }) => (imageSize ? `${imageSize + 45}px` : hasImage ? "250px" : "215px")};
  width: ${({ hasImage, imageSize }) => (imageSize ? `${imageSize + 45}px` : hasImage ? "250px" : "215px")};
  height: ${({ hasImage, imageSize }) => (imageSize ? `${imageSize + 45}px` : hasImage ? "250px" : "215px")};

  @media (max-width: 1100px) {
    min-width: clamp(155px, 42vw, 230px);
    min-height: clamp(155px, 42vw, 230px);
    width: clamp(155px, 42vw, 230px);
    height: clamp(155px, 42vw, 230px);
  }

  @media (max-width: 768px) {
    min-width: clamp(136px, 32vw, 190px);
    min-height: clamp(136px, 32vw, 190px);
    width: clamp(136px, 32vw, 190px);
    height: clamp(136px, 32vw, 190px);

    > button {
      width: 100% !important;
      height: 100% !important;
      transform: none;
    }
  }

  @media (max-width: 480px) {
    min-width: clamp(124px, 31vw, 145px);
    min-height: clamp(124px, 31vw, 145px);
    width: clamp(124px, 31vw, 145px);
    height: clamp(124px, 31vw, 145px);
  }

  @media (max-width: 360px) {
    min-width: 122px;
    min-height: 122px;
    width: 122px;
    height: 122px;
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
        gap: 6px;
        padding: 8px 3px;
        box-sizing: border-box;
    }

    @media (max-width: 768px) {
        justify-self: end;
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
      line-height: 1.1;
      letter-spacing: 0;
      text-align: center;
      white-space: nowrap;
      overflow-wrap: normal;
      word-break: normal;
    }
`

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
    padding: 0;
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
      padding: 1px;
      border-radius: 6px;
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
