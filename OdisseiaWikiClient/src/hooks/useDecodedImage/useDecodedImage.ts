import { useEffect, useState } from 'react';
import { getDecodedImage, watchDecodedImage } from './imageLoader';

export const useDecodedImage = (src: string) => {
  const [image, setImage] = useState(() => getDecodedImage(src));

  useEffect(() => watchDecodedImage(src, setImage), [src]);

  return image;
};
