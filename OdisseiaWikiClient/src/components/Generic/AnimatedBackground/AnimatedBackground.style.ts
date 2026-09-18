import styled from 'styled-components';
import { motion } from 'framer-motion';

interface BackgroundContainerProps {
  $backgroundImage: string;
  $isIntro: boolean;
}

export const BackgroundContainer = styled(motion.div)<BackgroundContainerProps>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: ${({ $isIntro }) => $isIntro ? 9999 : 0};
  background-color: #010815;
  background-image: ${({ $backgroundImage }) => $backgroundImage ? `url("${$backgroundImage}")` : 'none'};
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  pointer-events: none;
`;

export const Overlay = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  pointer-events: none;
`;

export const BlockerOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: transparent;
  /* A introdução é visual: ela nunca pode interceptar a navegação do site. */
  pointer-events: none;
  z-index: 0;
`;
