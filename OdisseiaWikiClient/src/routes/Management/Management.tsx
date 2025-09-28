import { useSelector } from 'react-redux';
import { useState } from 'react';
import { MainContainer, MainContent, Options, OptionsController, OptionButton, ContainerContent } from './Management.style';
import { ManagementWiki } from './ManagementWiki/ManagementWiki';

const OPTIONS = [
    { key: 'wiki', label: 'Wiki' },
    { key: 'sistema', label: 'Sistema' },
    { key: 'mesas', label: 'Mesas' },
    { key: 'jogadores', label: 'Jogadores' }
];

export const Management = () => {
    const { theme, neon } = useSelector((state: any) => state.themesReducer);
    const [selected, setSelected] = useState<string>('wiki');

    const renderContent = () => {
        switch (selected) {
            case 'wiki':
                return <ManagementWiki theme={theme} neon={neon} />;
            case 'sistema':
                return <p>Conteúdo do Sistema</p>;
            case 'mesas':
                return <p>Conteúdo das Mesas</p>;
            case 'jogadores':
                return <p>Conteúdo dos Jogadores</p>;
            default:
                return null;
        }
    };

    return (
        <MainContainer>
            <OptionsController>
                <Options theme={theme} neon={neon}>
                    {OPTIONS.map(option => (
                        <OptionButton
                            key={option.key}
                            selected={selected === option.key}
                            onClick={() => setSelected(option.key)}
                            theme={theme}
                            neon={neon}
                        >
                            {option.label}
                        </OptionButton>
                    ))}
                </Options>
            </OptionsController>
            <MainContent>
                <ContainerContent>
                    {renderContent()}
                </ContainerContent>
            </MainContent>
        </MainContainer>
    );
}