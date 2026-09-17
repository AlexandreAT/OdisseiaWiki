const readyImages = new Set<string>();
const pendingImages = new Map<string, Promise<string>>();

export const getDecodedImage = (src: string) => readyImages.has(src) ? src : '';

export const loadDecodedImage = (src: string): Promise<string> => {
  if (!src) return Promise.resolve('');
  if (readyImages.has(src)) return Promise.resolve(src);
  const pending = pendingImages.get(src);
  if (pending) return pending;

  const request = new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = async () => {
      try {
        if (image.decode) await image.decode();
        readyImages.add(src);
        resolve(src);
      } catch (error) {
        reject(error);
      } finally {
        image.onload = null;
        image.onerror = null;
      }
    };
    image.onerror = () => {
      image.onload = null;
      image.onerror = null;
      reject(new Error('Não foi possível carregar a imagem de fundo.'));
    };
    image.src = src;
  }).finally(() => pendingImages.delete(src));

  pendingImages.set(src, request);
  return request;
};

export const watchDecodedImage = (src: string, onReady: (image: string) => void) => {
  let active = true;
  void loadDecodedImage(src).then((image) => {
    if (active) onReady(image);
  }).catch(() => {
    // Uma falha mantém o último fundo válido (ou a cor de fundo inicial).
  });
  return () => { active = false; };
};
