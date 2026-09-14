import { useState, useEffect, useRef } from 'react';
import { BackgroundContainer, Overlay, BlockerOverlay } from './AnimatedBackground.style';
import { TypedText } from './TypedText';
import CityBackgroundDistantCharacter from '../../../assets/CityBackgroundDistantCharacter.jpeg';
import CityBackgrounDistant from '../../../assets/CityBackgroundDistant.jpeg';
import CharacterBackgroundDistant from '../../../assets/CharacterBackgroundDistant.jpeg';
import ManagementBackground from '../../../assets/ManagementBakcground.jpg';

export type BackgroundType = 'pov' | 'distant' | 'distantCharacter' | 'management';

interface AnimatedBackgroundProps {
  type: BackgroundType;
  introText?: string;
  skipIntro?: boolean;
  onIntroComplete?: () => void;
}

const BACKGROUND_IMAGES = {
  pov: CityBackgroundDistantCharacter,
  distant: CityBackgrounDistant,
  distantCharacter: CharacterBackgroundDistant,
  management: ManagementBackground
};

const INTRO_TEXTS = {
  pov: 'Seus personagens aguardam...',
  distant: 'Uma nova história começa...',
  distantCharacter: 'Uma nova história começa...',
  management: 'Gerenciando conteúdo...'
};

const getDailySessionIntroKey = () => {
  const today = new Date().toISOString().slice(0, 10);
  return `odisseia:background-intro:${today}`;
};

const hasSeenIntroThisSession = () => {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(getDailySessionIntroKey()) === 'seen';
};

const markIntroAsSeenThisSession = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(getDailySessionIntroKey(), 'seen');
};

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ type, introText, skipIntro = false, onIntroComplete }) => {
  const shouldSkipIntro = skipIntro || hasSeenIntroThisSession();
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'typing' | 'complete'>(shouldSkipIntro ? 'complete' : 'initial');
  const [showOverlay, setShowOverlay] = useState(shouldSkipIntro);
  const isFirstRender = useRef(!shouldSkipIntro);
  const previousType = useRef(type);

  useEffect(() => {
    if (isFirstRender.current) {
      setAnimationPhase('initial');
      setShowOverlay(false);
    } else if (previousType.current !== type) {
      setAnimationPhase('complete');
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
        setShowOverlay(true);
        setAnimationPhase('complete');
        isFirstRender.current = false;
        markIntroAsSeenThisSession();
        onIntroComplete?.();
      }, 800);
    }
  };

  const displayText = introText || INTRO_TEXTS[type];
  const shouldShowText = isFirstRender.current && (animationPhase === 'typing' || animationPhase === 'initial');
  const isAnimating = animationPhase !== 'complete';
  const shouldAnimateEntry = !shouldSkipIntro && isFirstRender.current;

  return (
    <>
      {isAnimating && (
        <BlockerOverlay
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}
      
      <BackgroundContainer
        key={type}
        $backgroundImage={BACKGROUND_IMAGES[type]}
        initial={shouldAnimateEntry ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={shouldAnimateEntry
          ? { duration: 1.5, ease: 'easeInOut' }
          : { duration: 0 }}
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
            initial={false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0 }}
          />
        )}
      </BackgroundContainer>
    </>
  );
};
