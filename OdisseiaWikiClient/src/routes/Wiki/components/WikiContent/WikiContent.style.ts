import styled from 'styled-components';

export const WikiPageHeaderSection = styled.section<{ 
  $coverImage?: string; 
  $headerExpanded?: boolean;
}>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: calc(100vh - ${props => props.$headerExpanded ? '165px' : '90px'});
  justify-content: center;

  position: relative;
  z-index: 0;
  isolation: isolate;

  border-bottom: 1px solid #333;
  min-width: 0;
  max-width: 100%;
  
  ${props => props.$coverImage ? `
    background-image: url("${props.$coverImage}");
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
  ` : `
    background: linear-gradient(135deg, #1a1a1a 0%, #0a3a3a 100%);
  `}

  &::before {
    content: '';
    position: absolute;
    inset: 0;

    background: linear-gradient(90deg, #0005 20%, #3334 100%);

    pointer-events: none;
  }

  @media (max-width: 768px) {
    height: auto;
    min-height: clamp(360px, 65vh, 620px);
  }
`;

export const ContentHeader = styled.div`
    position: relative;
    z-index: 10;
    padding: 32px 24px;
    width: 65%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding-left: 50px;
    min-width: 0;
    max-width: 100%;
    box-sizing: border-box;

    &::before {
    content: '';
    position: absolute;
    inset: 0;

    background: #0004;

    backdrop-filter: blur(2px);
    -webkit-backdrop-filter: blur(2px);

    mask-image: linear-gradient(
      to right,
      black 0%,
      black 40%,
      transparent 75%
    );

    -webkit-mask-image: linear-gradient(
      to right,
      black 0%,
      black 40%,
      transparent 75%
    );

    z-index: -1;
    pointer-events: none;
  }

  @media (max-width: 1100px) {
    width: 80%;
    padding-left: 32px;
  }

  @media (max-width: 768px) {
    width: 100%;
    padding: 24px 18px;
  }
`

export const PageCoverImage = styled.img`
  display: none;
`;

export const PageTitle = styled.h1`
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
  position: relative;
  z-index: 2;
  overflow-wrap: anywhere;

  @media (max-width: 768px) {
    font-size: clamp(20px, 6vw, 28px);
    line-height: 1.15;
    max-width: 100%;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: break-word;
    text-align: center;
    letter-spacing: 1px;
  }
`;

export const PageDescription = styled.p`
  margin: 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.7);
  line-height: 1.6;
  position: relative;
  z-index: 2;
  overflow-wrap: anywhere;
`;

export const PageMeta = styled.div`
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  opacity: 0.7;
  position: relative;
  z-index: 2;
  flex-wrap: wrap;
  min-width: 0;
  overflow-wrap: anywhere;
`;

export const WikiBlocksSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  width: 100%;
  min-width: 0;
  max-width: 100%;
`;

export const WikiBlockWrapper = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;

  @media (max-width: 768px) {
    padding: 16px;
  }

  @media (max-width: 480px) {
    padding: 14px;
  }
`;
