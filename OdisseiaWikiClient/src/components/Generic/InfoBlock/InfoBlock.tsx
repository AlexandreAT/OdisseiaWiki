import React from 'react';
import { ContainerInfo, InfoContent, InfoImage, InfoText, Title, Subtitle, Paragraph } from './InfoBlock.styles';
import { colorSchemes } from '../../../styles/ColorSchemes';
import { useSelector } from 'react-redux'

interface Props {
    title: string;
    subtitle?: string;
    imageSrc?: string;
    imagePosition?: 'left' | 'right';
    imageAlt?: string;
    paragraph: string[];
    colorScheme: keyof typeof colorSchemes;
}

const InfoBlock: React.FC<Props> = ({ title, subtitle, imageSrc, imagePosition = 'left', imageAlt, paragraph, colorScheme }) => {
    const scheme = colorSchemes[colorScheme];
    const { theme, neon } = useSelector((state: any) => state.themesReducer);

    return (
        <ContainerInfo colorScheme={scheme} theme={theme} neon={neon}>
            <Title colorScheme={scheme} theme={theme} neon={neon}>
                {title}
            </Title>
            <InfoContent>
                {imageSrc && imagePosition === 'left' && (
                    <figure>
                        <InfoImage src={imageSrc} alt={imageAlt}/>
                    </figure>
                )}
                <InfoText>
                    {subtitle && (
                        <Subtitle colorScheme={scheme} theme={theme} neon={neon}>
                            {subtitle}
                        </Subtitle>
                    )}
                    {paragraph.map((text, index) => (
                        <Paragraph key={index} colorScheme={scheme} theme={theme} neon={neon}>{text}</Paragraph>
                    ))}
                </InfoText>
                {imageSrc && imagePosition === 'right' && (
                    <figure>
                        <InfoImage src={imageSrc} alt={imageAlt}/>
                    </figure>
                )}
            </InfoContent>
        </ContainerInfo>
    );
}

export default InfoBlock;
