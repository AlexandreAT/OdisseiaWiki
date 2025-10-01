import React, { useEffect } from 'react'
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { ContentController, MainContainer, Content, ClipButton, ButtonSpan, Header, Title, ClipButtonAnimated } from './Hub.style';
import { ClipBox } from '../../components/Generic/ClipBox/ClipBox';
import BannerMesa from '../../assets/Banner Mesa.jpeg';
import BannerPersonagens from '../../assets/Banner Personagens.jpeg';
import TitleGlitch from '../../components/Generic/TitleGlitch/TitleGlitch';
import { UserCharacters } from './UserCharacters/UserCharacters';

export const Hub = () => {
    const { theme, neon } = useSelector((state: any) => state.themesReducer);
    const [selected, setSelected] = useState<'mesas' | 'personagens' | ''>('');
    const [isCollapsed, setIsCollapsed] = useState(false);

    useEffect(() => {

    }, [])

    const usuarioLogado = {
        id: 1,
        email: "alexandre.arribamar@gmail.com",
        nickname: "alexandre",
        imagemUrl: "https://lh3.googleusercontent.com/a/ACg8ocIbvXfeCB5VHE3QM2vu6vVBJ1GQky5X3W7qLg3mdL3jC6SWYDk4Nw=s96-c"
    };

    const handleClick = (type: 'mesas' | 'personagens') => {
        setSelected(type);
        setIsCollapsed(true);
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
                />;
            default:
                return null;
        }
    };
    
    return (
        <MainContainer>
            <ClipBox autoSize zIndex={1} theme={theme} neon={neon} width='1200px' height='100vh' >
                <Header><TitleGlitch theme={theme} neon={neon} text='Gerenciar Mesas e Personagens' /></Header>
                <ContentController collapsed={isCollapsed}>
                    {[{ img: BannerMesa, label: 'Mesas' }, { img: BannerPersonagens, label: 'Personagens' }].map(
                        (btn, i) => (
                        <Content key={btn.label}>
                            <ClipButtonAnimated
                                img={btn.img}
                                theme={theme}
                                neon={neon}
                                collapsed={isCollapsed}
                                active={selected === btn.label.toLowerCase()}
                                index={i}
                                onClick={() => handleClick(btn.label.toLowerCase() as 'mesas' | 'personagens')}
                            >
                               <ButtonSpan theme={theme} neon={neon}>{btn.label}</ButtonSpan>
                            </ClipButtonAnimated>
                        </Content>
                        )
                    )}
                </ContentController>

                {renderContent()}

            </ClipBox>
        </MainContainer>
    )
}