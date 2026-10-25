import { useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import { ImageUploader } from '../../../../../components/Generic/ImageUploader/ImageUploader';
import { LoadingIndicator } from '../../../../../components/Generic/LoadingIndicator';
import { saveAsset } from '../../../../../services/assetsService';
import { conditionImage, withConditionImage } from '../../../../../utils/conditionImage';
import { useEventCallback } from '../../../../../hooks/useEventCallback';
import { normalizeImagePath } from '../../../../Wiki/utils/imagePathHelper';

const ImageField = styled.div`
  display: grid; justify-items: center; gap: 8px; margin: 8px 0 18px;
  > div { max-width: 190px; }
  > small { color: var(--grey); font-size: .78rem; text-align: center; }
  &[aria-busy='true'] > div:first-child { pointer-events: none; opacity: .65; }
`;

export function ConditionImageField({ json, code, readOnly, theme, neon, onChange, onUploadBusyChange }: {
  json?: string | null; code: string; readOnly: boolean; theme: 'dark' | 'light'; neon: 'on' | 'off';
  onChange: (json: string) => void;
  onUploadBusyChange?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    onUploadBusyChange?.(busy);
    return () => onUploadBusyChange?.(false);
  }, [busy, onUploadBusyChange]);
  const apply = useEventCallback((image?: string) => onChange(withConditionImage(json, image)));
  const image = normalizeImagePath(conditionImage(json));
  return <ImageField aria-busy={busy}>
    {readOnly ? image && <img src={image} alt={`Condição ${code}`} width={96} height={96} /> :
      <ImageUploader theme={theme} neon={neon} label="Imagem da condição (opcional)"
        cropPreset={{ mode: 'single', aspectRatio: 1, shape: 'square', displayShape: 'square' }}
        initialImage={image || undefined} onRemove={() => { if (!busy) apply(undefined); }}
        onImageCropped={async ({ file }) => {
          if (busy) return;
          setBusy(true); setError('');
          try {
            const asset = await saveAsset({ imageFile: file, type: 'sistema', entityName: code || 'condicao' });
            if (mounted.current) apply(asset.path);
          } catch (reason) {
            if (mounted.current) setError(reason instanceof Error ? reason.message : 'Não foi possível enviar a imagem.');
          } finally { if (mounted.current) setBusy(false); }
        }} />}
    {busy && <LoadingIndicator compact label="Enviando imagem — aguarde antes de salvar" />}
    {!readOnly && <small>Recorte quadrado. Sem imagem, o jogo usa um ícone padrão.</small>}
    {error && <small role="alert">{error}</small>}
  </ImageField>;
}
