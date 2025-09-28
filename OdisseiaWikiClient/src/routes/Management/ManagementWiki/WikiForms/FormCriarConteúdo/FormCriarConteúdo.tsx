import { Header, Main } from './FormCriarConteúdo.style';
import { Select } from '../../../../../components/Generic/Select/Select';
import { useState } from 'react';
import { FormCharacter } from './FormCharacter/FormCharacter';

interface FormProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

const OPTIONS = [
    { value: 'character', label: 'Personagem' },
    { value: 'city', label: 'Cidade' },
    { value: 'item', label: 'Item' }
];

export const FormCriarConteúdo = ({ theme, neon }: FormProps) => {
    const [type, setType] = useState('character');

    const renderTypeForm = () => {
        switch (type) {
            case 'character':
                return <FormCharacter theme={theme} neon={neon} />;
            case 'city':
                return <p>Form city</p>;
            case 'item':
                return <p>Form item</p>;
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