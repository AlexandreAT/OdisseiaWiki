import { useState } from 'react';
import { ManagementContainer, ButtonDiv, ButtonForm } from './ManagementWiki.style';
import { ContentForm } from './WikiForms/ContentForm';
import { isNullOrEmpty } from '../../../utils/isNullOrEmpty';

interface ManagementWikiProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

export const ManagementWiki = ({ theme, neon }: ManagementWikiProps) => {
  const [mode, setMode] = useState<'create' | 'search' | null>('create');

  return (
    <ManagementContainer>
        <ButtonDiv>
            <ButtonForm
                onClick={() => setMode('search')}
                theme={theme} 
                neon={neon}
                buttonClicked={mode === 'search'}>
                    Buscar
            </ButtonForm>

            <ButtonForm 
                onClick={() => setMode('create')}
                theme={theme}
                neon={neon}
                buttonClicked={mode === 'create'}>
                    Criar
            </ButtonForm>
        </ButtonDiv>
        {!isNullOrEmpty(mode) && 
            <ContentForm mode={mode} theme={theme} neon={neon} />
        }
    </ManagementContainer>
  );
};