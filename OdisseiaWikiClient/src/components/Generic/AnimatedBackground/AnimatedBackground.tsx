import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { BackgroundContainer, Overlay, BlockerOverlay } from './AnimatedBackground.style';
import { TypedText } from './TypedText';
import CityBackgroundDistantCharacter from '../../../assets/CityBackgroundDistantCharacter.jpeg';
import CityBackgrounDistant from '../../../assets/CityBackgroundDistant.jpeg';
import CharacterBackgroundDistant from '../../../assets/CharacterBackgroundDistant.jpeg';

export type BackgroundType = 'pov' | 'distant' | 'distantCharacter';

interface AnimatedBackgroundProps {
  type: BackgroundType;
  introText?: string;
  skipIntro?: boolean;
  onIntroComplete?: () => void;
}

const BACKGROUND_IMAGES = {
  pov: CityBackgroundDistantCharacter,
  distant: CityBackgrounDistant,
  distantCharacter: CharacterBackgroundDistant
};

const INTRO_TEXTS = {
  pov: 'Seus personagens aguardam...',
  distant: 'Uma nova história começa...',
  distantCharacter: 'Uma nova história começa...'
};

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ type, introText, skipIntro = false, onIntroComplete }) => {
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'typing' | 'complete'>(skipIntro ? 'complete' : 'initial');
  const [showBlur, setShowBlur] = useState(skipIntro);
  const [showOverlay, setShowOverlay] = useState(skipIntro);
  const isFirstRender = useRef(!skipIntro);
  const previousType = useRef(type);

  useEffect(() => {
    if (isFirstRender.current) {
      setAnimationPhase('initial');
      setShowBlur(false);
      setShowOverlay(false);
    } else if (previousType.current !== type) {
      setAnimationPhase('complete');
      setShowBlur(true);
      setShowOverlay(true);
    }
    
    previousType.current = type;
  }, [type]);

  const handleInitialAnimationComplete = () => {
    if (isFirstRender.current) {
      setAnimationPhase('typing');
    }
  };

  const handleTypingComplete = () => {
    if (isFirstRender.current) {
      setTimeout(() => {
        setShowBlur(true);
        setShowOverlay(true);
        setAnimationPhase('complete');
        isFirstRender.current = false;
        onIntroComplete?.();
      }, 800);
    }
  };

  const displayText = introText || INTRO_TEXTS[type];
  const shouldShowText = isFirstRender.current && (animationPhase === 'typing' || animationPhase === 'initial');
  const isAnimating = animationPhase !== 'complete';

  return (
    <>
      {isAnimating && (
        <BlockerOverlay
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      <AnimatePresence mode="sync">
        <BackgroundContainer
          key={type}
          $backgroundImage={BACKGROUND_IMAGES[type]}
          $applyBlur={showBlur}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ 
            duration: isFirstRender.current ? 1.5 : 0.6, 
            ease: 'easeInOut' 
          }}
          onAnimationComplete={handleInitialAnimationComplete}
          style={{
            zIndex: animationPhase === 'complete' ? 0 : 9999
          }}
        >
          {shouldShowText && animationPhase === 'typing' && (
            <TypedText 
              text={displayText} 
              typingSpeed={60}
              onComplete={handleTypingComplete}
            />
          )}
          
          {showOverlay && (
            <Overlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
          )}
        </BackgroundContainer>
      </AnimatePresence>
    </>
  );
};
