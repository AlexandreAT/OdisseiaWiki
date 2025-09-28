import styled from "styled-components";

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
`

export const FormHeader = styled.div<Props>`
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
`;

export const HeaderInputs = styled.div<Props>`
    width: 75%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;

    @media (max-width: 768px) {
        flex-direction: column;
        gap: 10px;
    }
`;

export const HeaderAvatar = styled.div<Props>`
    width: 25%;
    display: flex;
    align-items: center;
    justify-content: center;

    @media (max-width: 768px) {
        width: 100%;
        margin-bottom: 10px;
    }
`;

export const GridInputs = styled.div`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
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
`

export const TableTitle = styled.h2`
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 3px;
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
`

export const SectionStatus = styled.div<Props>`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    width: 100%;
    gap: 15px;
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
    justify-content: space-between;
    margin: 20px 0;
    width: 100%;
`

export const StatusContentCenter = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    width: 60%;
    gap: 10px;
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
`

export const StatusDefesaDiv = styled.div<Props>`
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    gap: 30px;
`

export const StatusImageDiv = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: center;
    position: relative;
    width: 100%;
    height: 100%;
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
`;

export const AtributeController = styled.div`
    flex: 0.5;
`

export const StatusAtributosDiv = styled.div<Props>`
    width: 150px;
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
`

export const LabelStatus = styled.h2<{ width?: string }>`
    font-family: 'DO Futuristic', sans-serif;
    font-weight: 100;
    letter-spacing: 3px;
    font-size: ${({ width }) => width || '18px'};
    cursor: default;
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
`

export const AtributoDiv = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
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