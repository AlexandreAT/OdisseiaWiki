import styled from 'styled-components';

export const DieStage = styled.span<{ $discarded?: boolean }>`
  position: relative;
  display: inline-block;
  vertical-align: middle;
  width: 35px;
  height: 35px;
  margin: -4px 5px -4px 3px;
  perspective: 280px;
  transform-style: preserve-3d;
  flex: 0 0 auto;
  opacity: ${({ $discarded }) => $discarded ? .5 : 1};
  @media (max-width: 650px) { margin-right: 3px; }
`;

export const DieSpinner = styled.span`
  position: absolute;
  inset: 0;
  display: block;
  transform-style: preserve-3d;
`;

export const DieMesh = styled.span<{ $landing: string; $rolling: boolean }>`
  position: absolute;
  inset: 0;
  display: block;
  transform-style: preserve-3d;
  transform: ${({ $landing }) => $landing};
  ${({ $rolling }) => $rolling && `svg text { filter: blur(1.1px); opacity: .65; }`}
`;
