import { HTMLAttributes, ReactNode, useEffect, useState } from 'react';
import { MdOutlineImageNotSupported } from 'react-icons/md';
import { ImageFrame } from './FallbackImage.style';

export interface FallbackImageProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  src?: string | null;
  alt: string;
  fallbackIcon?: ReactNode;
}

export const FallbackImage = ({
  src,
  alt,
  fallbackIcon,
  ...props
}: FallbackImageProps) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const hasImage = Boolean(src?.trim()) && !failed;

  return (
    <ImageFrame
      {...props}
      role={hasImage ? undefined : 'img'}
      aria-label={hasImage ? undefined : alt}
    >
      {hasImage ? (
        <img src={src ?? undefined} alt={alt} onError={() => setFailed(true)} />
      ) : (
        fallbackIcon ?? <MdOutlineImageNotSupported aria-hidden="true" />
      )}
    </ImageFrame>
  );
};
