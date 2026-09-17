import { useState } from 'react';
import { BackgroundContainer, Overlay, BlockerOverlay } from './AnimatedBackground.style';
import { TypedText } from './TypedText';
import CityBackgroundDistantCharacter from '../../../assets/CityBackgroundDistantCharacter.jpeg';
import CityBackgrounDistant from '../../../assets/CityBackgroundDistant.jpeg';
import CharacterBackgroundDistant from '../../../assets/CharacterBackgroundDistant.jpeg';
import ManagementBackground from '../../../assets/ManagementBakcground.jpg';
import { useDecodedImage } from '../../../hooks/useDecodedImage/useDecodedImage';
import { useBackgroundIntro } from './useBackgroundIntro';

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

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ type, introText, skipIntro = false, onIntroComplete }) => {
  const backgroundImage = useDecodedImage(BACKGROUND_IMAGES[type]);
  const { phase, shouldAnimateEntry, handleInitialAnimationComplete, handleTypingComplete } = useBackgroundIntro(skipIntro, onIntroComplete);
  const [displayText] = useState(() => introText || INTRO_TEXTS[type]);
  const isAnimating = phase !== 'complete';

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
        $backgroundImage={backgroundImage}
        $isIntro={isAnimating}
        initial={shouldAnimateEntry ? { opacity: 0 } : false}
        animate={{ opacity: 1 }}
        transition={shouldAnimateEntry
          ? { duration: 1.5, ease: 'easeInOut' }
          : { duration: 0 }}
        onAnimationComplete={handleInitialAnimationComplete}
      >
        {phase === 'typing' && (
          <TypedText
            text={displayText}
            typingSpeed={60}
            onComplete={handleTypingComplete}
          />
        )}

        <Overlay
          initial={false}
          animate={{ opacity: isAnimating ? 0 : 1 }}
          transition={{ duration: 0 }}
        />
      </BackgroundContainer>
    </>
  );
};
