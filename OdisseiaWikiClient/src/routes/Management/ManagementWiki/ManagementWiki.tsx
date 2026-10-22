import { useEffect, useState } from 'react';
import { ManagementContainer, ButtonDiv, ButtonForm } from './ManagementWiki.style';
import { ContentForm } from './WikiForms/ContentForm';
import { isNullOrEmpty } from '../../../utils/isNullOrEmpty';
import { useSearchParams } from 'react-router-dom';
import { NpcCharacterEdit } from './WikiForms/FormBuscarConteúdo/NpcCharacterEdit';
import { hasUnsavedForms } from '../../../utils/unsavedChangesRegistry';

interface ManagementWikiProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onDirtyChange?: (dirty: boolean) => void;
}

export const ManagementWiki = ({ theme, neon, onDirtyChange }: ManagementWikiProps) => {
  const [mode, setMode] = useState<'create' | 'search' | null>('create');
  const [createDirty, setCreateDirty] = useState(false);
  useEffect(() => {
    onDirtyChange?.(createDirty);
    return () => onDirtyChange?.(false);
  }, [createDirty, onDirtyChange]);
  const [searchParams, setSearchParams] = useSearchParams();
  const cloneNpcId = searchParams.get('cloneNpc');
  const sourceMesaId = Number(searchParams.get('sourceMesaId')) || undefined;

  const closeClone = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('cloneNpc');
    next.delete('sourceMesaId');
    setSearchParams(next);
  };

  if (cloneNpcId) {
    return (
      <ManagementContainer>
        <NpcCharacterEdit
          theme={theme}
          neon={neon}
          characterId={cloneNpcId}
          clone
          sourceMesaId={sourceMesaId}
          onBack={closeClone}
          onSave={closeClone}
        />
      </ManagementContainer>
    );
  }

  return (
    <ManagementContainer>
        <ButtonDiv>
            <ButtonForm
                onClick={() => {
                  if (mode !== 'search' && (createDirty || hasUnsavedForms()) &&
                    !window.confirm('Existem alterações não salvas. Deseja descartá-las?')) return;
                  setMode('search');
                }}
                theme={theme} 
                neon={neon}
                buttonClicked={mode === 'search'}>
                    Buscar
            </ButtonForm>

            <ButtonForm 
                onClick={() => {
                  if (mode !== 'create' && hasUnsavedForms() &&
                    !window.confirm('Existem alterações não salvas. Deseja descartá-las?')) return;
                  setMode('create');
                }}
                theme={theme}
                neon={neon}
                buttonClicked={mode === 'create'}>
                    Criar
            </ButtonForm>
        </ButtonDiv>
        {!isNullOrEmpty(mode) && 
            <ContentForm mode={mode} theme={theme} neon={neon} onDirtyChange={setCreateDirty} />
        }
    </ManagementContainer>
  );
};
