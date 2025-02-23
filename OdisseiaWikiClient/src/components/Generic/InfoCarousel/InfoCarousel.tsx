import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { ContainerWiki, Title, DivInfos, Subtitle, InfoControl, InfoCard, CardHeader, CardImage, CardName, CardDescription, CardLink, CarouselOptions, CarouselButton } from './InfoCarousel.style';
import { Link } from 'react-router-dom';
import { colorSchemes } from '../../../styles/ColorSchemes';
import { IoIosArrowDropright, IoIosArrowDropleft } from "react-icons/io";

interface CardsTop {
    name: string;
    imageSrc?: string;
    description: string;
    link?: string;
}

interface CardsBottom {
    name: string;
    imageSrc?: string;
    description: string;
    link?: string;
}

interface Props {
    title: string;
    subtitleTop?: string;
    subtitleBottom?: string;
    imageStyleTop?: 'circle' | 'rectangle';
    imageStyleBottom?: 'circle' | 'rectangle';
    listTop: CardsTop[];
    listBottom: CardsBottom[];
    typeTop: 'simple' | 'city';
    typeBottom: 'simple' | 'city';
    colorScheme: keyof typeof colorSchemes;
}

const InfoCarousel: React.FC<Props> = ({ typeBottom, typeTop, title, subtitleTop, subtitleBottom, imageStyleTop, imageStyleBottom, listTop, listBottom, colorScheme }) => {
    const scheme = colorSchemes[colorScheme];
    const { theme, neon } = useSelector((state: any) => state.themesReducer);

    const chunkArray = (array: any[], size: number) => {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    };

    const pairsTop = chunkArray(listTop, 2);
    const pairsBottom = chunkArray(listBottom, 2);

    const [currentIndexTop, setCurrentIndexTop] = useState(0);
    const [currentIndexBottom, setCurrentIndexBottom] = useState(0);

    const handleNext = (line: string) => {
        if (line === 'top' && currentIndexTop < pairsTop.length - 1) {
            setCurrentIndexTop(currentIndexTop + 1);
        }
        if (line === 'bottom' && currentIndexBottom < pairsBottom.length - 1) {
            setCurrentIndexBottom(currentIndexBottom + 1);
        }
    };

    const handlePrev = (line: string) => {
        if (line === 'top' && currentIndexTop > 0) {
            setCurrentIndexTop(currentIndexTop - 1);
        }
        if (line === 'bottom' && currentIndexBottom > 0) {
            setCurrentIndexBottom(currentIndexBottom - 1);
        }
    };

    return (
        <ContainerWiki theme={theme} neon={neon} colorScheme={scheme}>
            <Title theme={theme} neon={neon} colorScheme={scheme}>{title}</Title>
            <DivInfos className='divTop' theme={theme} neon={neon} colorScheme={scheme}>
                <Subtitle className='subtitleTop' theme={theme} neon={neon} colorScheme={scheme}>{subtitleTop}</Subtitle>
                <InfoControl theme={theme} neon={neon} colorScheme={scheme}>
                    {pairsTop[currentIndexTop].map((item, index) => (
                        <InfoCard className='infoTop' key={index} theme={theme} neon={neon} colorScheme={scheme}>
                            <CardHeader className='headerTop' type={typeTop} theme={theme} neon={neon} colorScheme={scheme}>
                                <CardImage className='imageTop' type={typeTop} src={item.imageSrc} alt={item.name} imageStyleTop={imageStyleTop} theme={theme} neon={neon} colorScheme={scheme} />
                                <CardName className='nameTop' type={typeTop} theme={theme} neon={neon} colorScheme={scheme}>{item.name}</CardName>
                            </CardHeader>
                            <CardDescription>{item.description}</CardDescription>
                            {item.link && <CardLink theme={theme} neon={neon} colorScheme={scheme}><Link to={item.link} className='linkTop link'>Ler mais</Link></CardLink>}
                        </InfoCard>
                    ))}
                </InfoControl>
                {pairsTop.length > 1 && (
                    <CarouselOptions>
                        <CarouselButton className='buttonTop' theme={theme} neon={neon} colorScheme={scheme} onClick={() => handlePrev('top')} disabled={currentIndexTop === 0}><IoIosArrowDropleft className='icon' /></CarouselButton>
                        <CarouselButton className='buttonTop' theme={theme} neon={neon} colorScheme={scheme} onClick={() => handleNext('top')} disabled={currentIndexTop === pairsTop.length - 1}><IoIosArrowDropright className='icon' /></CarouselButton>
                    </CarouselOptions>
                )}
            </DivInfos>
            <DivInfos className='divBottom' theme={theme} neon={neon} colorScheme={scheme}>
                <Subtitle className='subtitleBottom' theme={theme} neon={neon} colorScheme={scheme}>{subtitleBottom}</Subtitle>
                <InfoControl theme={theme} neon={neon} colorScheme={scheme}>
                    {pairsBottom[currentIndexBottom].map((item, index) => (
                        <InfoCard className='infoBottom' key={index} theme={theme} neon={neon} colorScheme={scheme}>
                            <CardHeader className='headerBottom' type={typeBottom} theme={theme} neon={neon} colorScheme={scheme}>
                                <CardImage className='imageBottom' type={typeBottom} src={item.imageSrc} alt={item.name} imageStyleBottom={imageStyleBottom} theme={theme} neon={neon} colorScheme={scheme} />
                                <CardName className='nameBottom' type={typeBottom} theme={theme} neon={neon} colorScheme={scheme}>{item.name}</CardName>
                            </CardHeader>
                            <CardDescription>{item.description}</CardDescription>
                            {item.link && <CardLink theme={theme} neon={neon} colorScheme={scheme}><Link to={item.link} className='linkBottom link'>Ler mais</Link></CardLink>}
                        </InfoCard>
                    ))}
                </InfoControl>
                {pairsBottom.length > 1 && (
                    <CarouselOptions>
                        <CarouselButton className='buttonBottom' theme={theme} neon={neon} colorScheme={scheme} onClick={() => handlePrev('bottom')} disabled={currentIndexBottom === 0}><IoIosArrowDropleft className='icon' /></CarouselButton>
                        <CarouselButton className='buttonBottom' theme={theme} neon={neon} colorScheme={scheme} onClick={() => handleNext('bottom')} disabled={currentIndexBottom === pairsBottom.length - 1}><IoIosArrowDropright className='icon' /></CarouselButton>
                    </CarouselOptions>
                )}
            </DivInfos>
        </ContainerWiki>
    );
}

export default InfoCarousel;
