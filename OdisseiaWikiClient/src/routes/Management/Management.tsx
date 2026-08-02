import { useSelector } from 'react-redux';
import { useEffect, useState } from 'react';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { MainContainer, MainContent, Options, OptionsController, OptionButton, ContainerContent, ToggleSidebarButton } from './Management.style';
import { ManagementWiki } from './ManagementWiki/ManagementWiki';
import { AnimatedBackground } from '../../components/Generic/AnimatedBackground/AnimatedBackground';
import { ManagementSystem } from './ManagementSystem/ManagementSystem';

const OPTIONS = [
    { key: 'wiki', label: 'Wiki' },
    { key: 'sistema', label: 'Sistema' },
    { key: 'mesas', label: 'Mesas' },
    { key: 'jogadores', label: 'Jogadores' }
];

type ManagementArea = 'wiki' | 'sistema' | 'mesas' | 'jogadores';

interface ManagementThemeState {
    themesReducer: {
        theme: 'dark' | 'light';
        neon: 'on' | 'off';
    };
}

const getInitialArea = (): ManagementArea => {
    const area = new URLSearchParams(window.location.search).get('area');
    return OPTIONS.some((option) => option.key === area)
        ? area as ManagementArea
        : 'wiki';
};

export const Management = () => {
    const { theme, neon } = useSelector((state: ManagementThemeState) => state.themesReducer);
    const [selected, setSelected] = useState<ManagementArea>(getInitialArea);
    const [sidebarExpanded, setSidebarExpanded] = useState(false);
    const [systemDirty, setSystemDirty] = useState(false);

    useEffect(() => {
        const collapseMobileSidebar = () => {
            if (window.innerWidth <= 768) setSidebarExpanded(false);
        };

        window.addEventListener('resize', collapseMobileSidebar);
        return () => window.removeEventListener('resize', collapseMobileSidebar);
    }, []);

    useEffect(() => {
        const syncAreaFromHistory = () => {
            const nextArea = getInitialArea();
            if (
                selected === 'sistema'
                && nextArea !== 'sistema'
                && systemDirty
                && !window.confirm('Existem alterações não salvas no módulo atual. Deseja descartá-las e sair?')
            ) {
                const params = new URLSearchParams(window.location.search);
                params.set('area', selected);
                window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
                return;
            }
            setSelected(nextArea);
        };

        window.addEventListener('popstate', syncAreaFromHistory);
        return () => window.removeEventListener('popstate', syncAreaFromHistory);
    }, [selected, systemDirty]);
    const renderContent = () => {
        switch (selected) {
            case 'wiki':
                return <ManagementWiki theme={theme} neon={neon} />;
            case 'sistema':
                return <ManagementSystem theme={theme} neon={neon} onDirtyChange={setSystemDirty} />;
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
                                    const nextArea = option.key as ManagementArea;
                                    if (
                                        selected === 'sistema'
                                        && nextArea !== 'sistema'
                                        && systemDirty
                                        && !window.confirm('Existem alterações não salvas no módulo atual. Deseja descartá-las e sair?')
                                    ) return;

                                    setSelected(nextArea);
                                    const params = new URLSearchParams(window.location.search);
                                    params.set('area', nextArea);
                                    if (nextArea !== 'sistema') {
                                        params.delete('system');
                                        params.delete('version');
                                        params.delete('module');
                                    }
                                    const query = params.toString();
                                    window.history.replaceState(
                                        null,
                                        '',
                                        `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`,
                                    );
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
