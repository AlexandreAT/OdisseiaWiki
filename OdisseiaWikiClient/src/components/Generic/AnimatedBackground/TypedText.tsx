import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

interface TypedTextProps {
  text: string;
  typingSpeed?: number;
  onComplete?: () => void;
}

interface ContainerProps {
  $progress: number;
}

const TextContainer = styled(motion.div)`
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'DO Futuristic', sans-serif !important;
  font-size: 2.5rem !important;
  font-weight: 100;
  letter-spacing: 4px;
  color: white;
  text-align: center;
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.8);
  padding: 30px 50px;
  border-radius: 8px;
  z-index: 10;
  pointer-events: none;
  max-width: 80%;
  line-height: 1.4;
  overflow: hidden;
`;

const GradientBackground = styled.div<ContainerProps>`
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  background: linear-gradient(
    to right,
    rgba(0, 0, 0, 0.6) 0%,
    rgba(0, 0, 0, 0.6) ${props => props.$progress}%,
    rgba(0, 0, 0, 0) ${props => props.$progress}%,
    rgba(0, 0, 0, 0) 100%
  );
  border-radius: 4px;
  transition: background 0.1s linear;
  z-index: -1;
`;

const TextContent = styled.div`
  position: relative;
  z-index: 1;
  font-family: 'DO Futuristic', sans-serif !important;
  font-size: 2.5rem !important;
`;

export const TypedText: React.FC<TypedTextProps> = ({ 
  text, 
  typingSpeed = 50,
  onComplete 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  const progress = text.length > 0 ? ((currentIndex + 1) / text.length) * 250 : 0;

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, typingSpeed);

      return () => clearTimeout(timeout);
    } else if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text, typingSpeed, onComplete]);

  return (
    <TextContainer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GradientBackground $progress={progress} />
      <TextContent>
        {displayedText}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        >
          |
        </motion.span>
      </TextContent>
    </TextContainer>
  );
};
