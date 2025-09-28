import styled from "styled-components";

export const MainContainer = styled.div`
    width: 100%;
    z-index: 1;
`

export const Background = styled.div`
    background-image: url('/src/assets/BannerLogin.jpg');
    background-size: cover;
    background-position: center;
    z-index: -1;
    width: 100%;
    height: 100vh;
    position: absolute;
`

export const ContainerController = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.2);
    align-items: center;
    justify-content: flex-start;
    backdrop-filter: blur(5px);
    position: relative;
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
`

export const ContainerContent = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    z-index: 0;
`