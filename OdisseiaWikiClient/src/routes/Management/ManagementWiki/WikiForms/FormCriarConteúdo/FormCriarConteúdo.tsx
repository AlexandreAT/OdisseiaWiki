import { Header, Main } from './FormCriarConteúdo.style';
import { Select } from '../../../../../components/Generic/Select/Select';
import { useEffect, useState } from 'react';
import { useUnsavedChangesGuard } from '../../../../../hooks/useUnsavedChangesGuard';
import { FormCharacter } from './FormCharacter/FormCharacter';
import { FormCity } from './FormCity/FormCity';
import { FormRace } from './FormRace/FormRace';
import { FormItem } from './FormItem/FormItem';
import { FormPage } from './FormPage/FormPage';

interface FormProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onDirtyChange?: (dirty: boolean) => void;
}

const OPTIONS = [
    { value: 'character', label: 'Personagem' },
    { value: 'city', label: 'Cidade' },
    { value: 'race', label: 'Raça' },
    { value: 'item', label: 'Item' },
    { value: 'page', label: 'Página' }
];

export const FormCriarConteúdo = ({ theme, neon, onDirtyChange }: FormProps) => {
    const [type, setType] = useState('character');
    const [dirty, setDirty] = useState(false);
    const { guardDialog } = useUnsavedChangesGuard(dirty);
    const markSaved = () => setDirty(false);
    useEffect(() => {
      onDirtyChange?.(dirty);
      return () => onDirtyChange?.(false);
    }, [dirty, onDirtyChange]);

    const renderTypeForm = () => {
        switch (type) {
            case 'character':
                return <FormCharacter theme={theme} neon={neon} contentType="Personagem" onSaveSuccess={markSaved} />;
            case 'city':
                return <FormCity theme={theme} neon={neon} contentType="Cidade" onSaveSuccess={markSaved} />;
            case 'race':
                return <FormRace theme={theme} neon={neon} contentType="Raça" onSaveSuccess={markSaved} />;
            case 'item':
                return <FormItem theme={theme} neon={neon} contentType="Item" onSaveSuccess={markSaved} />;
            case 'page':
                return <FormPage theme={theme} neon={neon} onSaveSuccess={markSaved} />;
            default:
                return null;
        }
    };

    return (
        <Main onInputCapture={() => setDirty(true)} onChangeCapture={() => setDirty(true)}>
            {guardDialog}
            <Header>
                <Select
                    theme={theme}
                    neon={neon}
                    label="Tipo de conteúdo"
                    options={OPTIONS}
                    value={type}
                    onChange={(e) => {
                      if (dirty && !window.confirm('Existem alterações não salvas. Deseja descartá-las?')) return;
                      setDirty(false);
                      setType(e.target.value);
                    }}
                    width="100%"
                />
            </Header>
            {renderTypeForm()}
        </Main>
    )
}
