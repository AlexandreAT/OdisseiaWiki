import { ContainerBanner, BannerEfect, BannerContent, BannerText, Title, Paragraph } from './Banner.style';
import { useSelector } from 'react-redux'
import { TextScramble } from '../TextScramble';
import { OdisseiaAnimatedTitle } from '../OdisseiaAnimatedTitle';

interface Props {
    title: string;
    subtitle?: string;
    imageSrc: string;
    paragraph: string[];
    textAnimationDuration?: number;
}

export const Banner = ({
    title,
    imageSrc,
    paragraph,
    textAnimationDuration,
}: Props) => {
    const { theme, neon } = useSelector((state: any) => state.themesReducer);

    return (
        <ContainerBanner theme={theme} neon={neon} image={imageSrc}>
            <BannerEfect theme={theme} neon={neon}/>
            <BannerContent theme={theme} neon={neon}>
                {title === 'Odisseia' ? (
                    <OdisseiaAnimatedTitle theme={theme} neon={neon} />
                ) : (
                    <Title theme={theme} neon={neon}>{title}</Title>
                )}
                <BannerText>
                    {paragraph.map((text, index) => (
                        <Paragraph key={index} theme={theme} neon={neon}>
                            <TextScramble
                                text={text}
                                duration={textAnimationDuration}
                                startDelay={index * 350}
                            />
                        </Paragraph>
                    ))}
                </BannerText>
            </BannerContent>
        </ContainerBanner>
    )
}
