import { Header, Main } from './FormCriarConteúdo.style';
import { Select } from '../../../../../components/Generic/Select/Select';
import { useState } from 'react';
import { FormCharacter } from './FormCharacter/FormCharacter';
import { FormCity } from './FormCity/FormCity';
import { FormRace } from './FormRace/FormRace';
import { FormItem } from './FormItem/FormItem';

interface FormProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

const OPTIONS = [
    { value: 'character', label: 'Personagem' },
    { value: 'city', label: 'Cidade' },
    { value: 'race', label: 'Raça' },
    { value: 'item', label: 'Item' }
];

export const FormCriarConteúdo = ({ theme, neon }: FormProps) => {
    const [type, setType] = useState('character');

    const renderTypeForm = () => {
        switch (type) {
            case 'character':
                return <FormCharacter theme={theme} neon={neon} contentType="Personagem" />;
            case 'city':
                return <FormCity theme={theme} neon={neon} contentType="Cidade" />;
            case 'race':
                return <FormRace theme={theme} neon={neon} contentType="Raça" />;
            case 'item':
                return <FormItem theme={theme} neon={neon} contentType="Item" />;
            default:
                return null;
        }
    };

    return (
        <Main>
            <Header>
                <Select
                    theme={theme}
                    neon={neon}
                    label="Tipo de conteúdo"
                    options={OPTIONS}
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    width="100%"
                />
            </Header>
            {renderTypeForm()}
        </Main>
    )
}