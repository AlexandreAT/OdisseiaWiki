import { useEffect, useState } from 'react';
import { ScrambledText } from './TextScramble.style';
import { TextScrambleProps } from './TextScramble.type';

const DEFAULT_CHARACTERS = '10#{}?<>/\\';

const getScrambledText = (
  text: string,
  resolvedCharacters: number,
  frame: number,
  characters: string,
) => text
  .split('')
  .map((character, index) => {
    if (/\s/.test(character) || index < resolvedCharacters) return character;

    return characters[(index + frame) % characters.length];
  })
  .join('');

export const TextScramble = ({
  text,
  duration = 700,
  startDelay = 0,
  characters = DEFAULT_CHARACTERS,
  className,
}: TextScrambleProps) => {
  const [displayedText, setDisplayedText] = useState(text);

  useEffect(() => {
    if (!text) {
      setDisplayedText(text);
      return undefined;
    }

    let animationFrame = 0;
    let delayTimeout = 0;
    const safeCharacters = characters || DEFAULT_CHARACTERS;

    const startAnimation = () => {
      const startTime = performance.now();

      const updateText = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const resolvedCharacters = Math.floor(text.length * progress);
        const frame = Math.floor(elapsed / 45);

        setDisplayedText(getScrambledText(text, resolvedCharacters, frame, safeCharacters));

        if (progress < 1) {
          animationFrame = requestAnimationFrame(updateText);
        } else {
          setDisplayedText(text);
        }
      };

      animationFrame = requestAnimationFrame(updateText);
    };

    setDisplayedText(getScrambledText(text, 0, 0, safeCharacters));
    delayTimeout = window.setTimeout(startAnimation, startDelay);

    return () => {
      window.clearTimeout(delayTimeout);
      cancelAnimationFrame(animationFrame);
    };
  }, [characters, duration, startDelay, text]);

  return (
    <ScrambledText className={className} aria-label={text} aria-live="off">
      {displayedText}
    </ScrambledText>
  );
};
