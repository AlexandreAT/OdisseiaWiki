import React from 'react';
import { ContainerBanner, BannerEfect, BannerContent, BannerText, Title, Paragraph } from '../styles/Banner.style';
import { useSelector } from 'react-redux'
import bannerImage from '../assets/BannerHome.jpg';
import bannerImageLight from '../assets/BannerHomeLight.jpg';

interface Props {
    title: string;
    subtitle?: string;
    imageSrc?: string;
    paragraph: string[];
}

const Banner: React.FC<Props> = ({ title, imageSrc, paragraph }) => {
    const { theme, neon } = useSelector((state: any) => state.themesReducer);
    
    if(!imageSrc){
        if(theme === 'dark'){
            imageSrc = bannerImage;
        }
        else{
            imageSrc = bannerImageLight;
        }
    }

    return (
        <ContainerBanner theme={theme} neon={neon} image={imageSrc}>
            <BannerEfect theme={theme} neon={neon}/>
            <BannerContent theme={theme} neon={neon}>
                <Title theme={theme} neon={neon}>{title}</Title>
                <BannerText>
                    {paragraph.map((text, index) => (
                        <Paragraph key={index} theme={theme} neon={neon}>{text}</Paragraph>
                    ))}
                </BannerText>
            </BannerContent>
        </ContainerBanner>
    )
}

export default Banner