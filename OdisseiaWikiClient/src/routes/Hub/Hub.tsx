import { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ContentController, MainContainer, Content, ButtonSpan, Header, ClipButtonAnimated, DisabledFeatureOverlay, ProductionBanner, MobileCollapsedBackButton } from './Hub.style';
import { ArrowBack } from '@mui/icons-material';
import { ClipBox } from '../../components/Generic/ClipBox/ClipBox';
import BannerMesa from '../../assets/Banner Mesa.jpeg';
import BannerPersonagens from '../../assets/Banner Personagens.jpeg';
import TitleGlitch from '../../components/Generic/TitleGlitch/TitleGlitch';
import { UserCharacters, ViewMode } from './UserCharacters/UserCharacters';
import { AnimatedBackground, BackgroundType } from '../../components/Generic/AnimatedBackground/AnimatedBackground';

export const Hub = () => {
    const { theme, neon } = useSelector((state: any) => state.themesReducer);
    const [searchParams, setSearchParams] = useSearchParams();
    const initialSection = searchParams.get('section') === 'personagens' ? 'personagens' : '';
    const [selected, setSelected] = useState<'mesas' | 'personagens' | ''>(initialSection);
    const [isCollapsed, setIsCollapsed] = useState(initialSection !== '');
    const [characterViewMode, setCharacterViewMode] = useState<ViewMode>('list');
    const [hasPersonagens, setHasPersonagens] = useState(false);
    const [hasPlayedIntro, setHasPlayedIntro] = useState(false);
    const [isLoadingPersonagens, setIsLoadingPersonagens] = useState(true);
    const navigate = useNavigate();

    const usuarioLogadoStr = localStorage.getItem('usuario');
    const usuarioLogado = usuarioLogadoStr ? JSON.parse(usuarioLogadoStr) : null;

    useEffect(() => {
        if (!usuarioLogado) {
            navigate('/login');
        }
    }, [usuarioLogado, navigate])

    useEffect(() => {
        const section = searchParams.get('section');
        const routeSelection = section === 'personagens' ? 'personagens' : '';
        setSelected(routeSelection);
        setIsCollapsed(routeSelection !== '');
    }, [searchParams]);

    if (!usuarioLogado) {
        return null;
    }

    const handleClick = (type: 'mesas' | 'personagens') => {
        setSelected(type);
        setIsCollapsed(true);
        const next = new URLSearchParams(searchParams);
        next.set('section', type);
        setSearchParams(next);
    };

    const handleBackToSelection = () => {
        if (selected === 'personagens' && characterViewMode !== 'list') {
            setSearchParams({ section: 'personagens' });
            return;
        }

        setSelected('');
        setIsCollapsed(false);
        setSearchParams({});
    };

    const getBackgroundType = (): BackgroundType | null => {
        if (selected === 'personagens') {
            if (isLoadingPersonagens) {
                return null;
            }
            if (!hasPersonagens || characterViewMode !== 'list') {
                return 'pov';
            }
            
            return 'distantCharacter';
        }
        if (selected === 'mesas') {
            return 'distant';
        }
        return null;
    };

    const renderContent = () => {
        switch (selected) {
            case 'mesas':
                return <p>Conteúdo das Mesas</p>;
            case 'personagens':
                return <UserCharacters 
                    theme={theme} 
                    neon={neon} 
                    userId={usuarioLogado.id}
                    onViewModeChange={setCharacterViewMode}
                    onPersonagensChange={setHasPersonagens}
                    onLoadingChange={setIsLoadingPersonagens}
                />;
            default:
                return null;
        }
    };

    const backgroundType = getBackgroundType();
    
    return (
        <MainContainer>
            {backgroundType && (
                <AnimatedBackground 
                    type={backgroundType} 
                    skipIntro={hasPlayedIntro}
                    onIntroComplete={() => setHasPlayedIntro(true)}
                />
            )}
            <ClipBox
                backgroundColor='rgba(0, 0, 15, 0.4)'
                useClip={false}
                autoSize
                zIndex={1}
                theme={theme}
                neon={neon}
                width={selected === 'personagens' && characterViewMode !== 'list' ? 'min(1400px, 96vw)' : '1200px'}
            >
                <Header><TitleGlitch theme={theme} neon={neon} text='Gerenciar Mesas e Personagens' /></Header>
                <ContentController collapsed={isCollapsed}>
                    {[{ img: BannerMesa, label: 'Mesas' }, { img: BannerPersonagens, label: 'Personagens' }].map(
                        (btn, i) => (
                        <Content key={btn.label} collapsed={isCollapsed}>
                            <ClipButtonAnimated
                                img={btn.img}
                                theme={theme}
                                neon={neon}
                                collapsed={isCollapsed}
                                active={selected === btn.label.toLowerCase()}
                                index={i}
                                disabled={btn.label === 'Mesas'}
                                onClick={() => handleClick(btn.label.toLowerCase() as 'mesas' | 'personagens')}
                            >
                               <ButtonSpan theme={theme} neon={neon}>{btn.label}</ButtonSpan>
                            </ClipButtonAnimated>
                            {btn.label === 'Mesas' && isCollapsed && selected === 'personagens' && (
                                <MobileCollapsedBackButton
                                    type="button"
                                    theme={theme}
                                    neon={neon}
                                    aria-label="Voltar para Mesas e Personagens"
                                    onClick={handleBackToSelection}
                                >
                                    <ArrowBack />
                                </MobileCollapsedBackButton>
                            )}
                            {btn.label === 'Mesas' && !isCollapsed && (
                                <DisabledFeatureOverlay
                                    role="status"
                                    aria-label="Mesas: funcionalidade em produção"
                                >
                                    <ProductionBanner>EM PRODUÇÃO</ProductionBanner>
                                </DisabledFeatureOverlay>
                            )}
                        </Content>
                        )
                    )}
                </ContentController>

                {renderContent()}

            </ClipBox>
        </MainContainer>
    )
}
