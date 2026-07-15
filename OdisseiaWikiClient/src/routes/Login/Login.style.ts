import styled from "styled-components";

export const MainContainer = styled.div`
    width: 100%;
    min-height: 100dvh;
    position: relative;
    z-index: 1;
    isolation: isolate;

    &::before {
        content: '';
        position: absolute;
        inset: 0;
        z-index: -1;
        background-color: rgba(0, 0, 0, 0.2);
        backdrop-filter: blur(5px);
        pointer-events: none;
    }
`

export const Background = styled.div`
    background-image: url('/src/assets/BannerLogin.jpg');
    background-size: cover;
    background-position: center;
    z-index: -2;
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100dvh;
`

export const ContainerController = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    min-height: 100dvh;
    background-color: transparent;
    align-items: center;
    justify-content: flex-start;
    position: relative;
    box-sizing: border-box;

    @media (max-width: 768px) {
        height: auto;
        overflow-y: auto;
    }
`

export const HeaderLogo = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 20px;
    padding: 15px 15px 0;
    z-index: 1;
    position: absolute;
    box-sizing: border-box;

    @media (max-width: 768px) {
        padding: 10px 12px 0;
        margin-bottom: 0;
    }
`

export const ContainerContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 100dvh;
    z-index: 0;
    padding: 78px 16px 24px;
    box-sizing: border-box;

    > div {
        max-width: 100%;
    }

    @media (max-width: 768px) {
        justify-content: flex-start;
        padding: 70px 12px 20px;
    }

    @media (max-width: 480px) {
        padding-inline: 8px;
    }
`
