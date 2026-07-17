import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { MainContainer, MainContent, Options, OptionsController, OptionButton, ContainerContent, ToggleSidebarButton } from './Management.style';
import { ManagementWiki } from './ManagementWiki/ManagementWiki';
import { AnimatedBackground } from '../../components/Generic/AnimatedBackground/AnimatedBackground';

const OPTIONS = [
    { key: 'wiki', label: 'Wiki' },
    { key: 'sistema', label: 'Sistema' },
    { key: 'mesas', label: 'Mesas' },
    { key: 'jogadores', label: 'Jogadores' }
];

export const Management = () => {
    const { theme, neon } = useSelector((state: any) => state.themesReducer);
    const [selected, setSelected] = useState<string>('wiki');
    const [sidebarExpanded, setSidebarExpanded] = useState(false);

    useEffect(() => {
        const collapseMobileSidebar = () => {
            if (window.innerWidth <= 768) setSidebarExpanded(false);
        };

        window.addEventListener('resize', collapseMobileSidebar);
        return () => window.removeEventListener('resize', collapseMobileSidebar);
    }, []);
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
            <AnimatedBackground 
                type='management' 
                skipIntro={true}
            />
            <ToggleSidebarButton
                theme={theme}
                neon={neon}
                expanded={sidebarExpanded}
                onClick={() => setSidebarExpanded(!sidebarExpanded)}
                title={sidebarExpanded ? 'Retrair sidebar' : 'Expandir sidebar'}
                aria-label={sidebarExpanded ? 'Fechar menu de gerenciamento' : 'Abrir menu de gerenciamento'}
                aria-expanded={sidebarExpanded}
            >
                {sidebarExpanded ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </ToggleSidebarButton>
            
            <OptionsController expanded={sidebarExpanded}>
                {sidebarExpanded && (
                    <Options theme={theme} neon={neon}>
                        {OPTIONS.map(option => (
                            <OptionButton
                                key={option.key}
                                selected={selected === option.key}
                                onClick={() => {
                                    setSelected(option.key);
                                    if (window.innerWidth <= 768) setSidebarExpanded(false);
                                }}
                                theme={theme}
                                neon={neon}
                            >
                                {option.label}
                            </OptionButton>
                        ))}
                    </Options>
                )}
            </OptionsController>
            <MainContent sidebarExpanded={sidebarExpanded}>
                <ContainerContent>
                    {renderContent()}
                </ContainerContent>
            </MainContent>
        </MainContainer>
    );
}
