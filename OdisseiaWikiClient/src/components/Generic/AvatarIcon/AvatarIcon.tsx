import React, { useRef, useState } from 'react';
import { VscAccount } from 'react-icons/vsc';
import { isNullOrEmpty } from '../../../utils/isNullOrEmpty';
import { AvatarButton } from './AvatarIcon.style';

interface Props {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onFileSelect?: (file: File | null) => void;
  initialImage?: string;
  size?: number;
  clickable?: boolean;
}

export const AvatarIcon = ({
  theme,
  neon,
  onFileSelect,
  initialImage = '',
  size = 100,
  clickable = true,
}: Props) => {
  const fileAvatar = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>(initialImage);

  const handleAvatarClick = () => {
    if (!clickable) return;
    fileAvatar.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file) {
      const url = URL.createObjectURL(file);
      setAvatarUrl(url);
      onFileSelect?.(file);
    }
  };

  return (
    <AvatarButton
      type="button"
      hasImage={!isNullOrEmpty(avatarUrl)}
      theme={theme}
      neon={neon}
      size={size}
      clickable={clickable}
      onClick={handleAvatarClick}
    >
      {!isNullOrEmpty(avatarUrl) ? (
        <img
          src={avatarUrl}
          alt="Avatar"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      ) : (
        <VscAccount fontSize={`${size}px`} className="iconAvatar" />
      )}
      <input
        type="file"
        accept="image/*"
        ref={fileAvatar}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </AvatarButton>
  );
};