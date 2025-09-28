import React from 'react';
import { colorCardsSchemes } from '../../../Global Styles/ColorCardsSchemes';
import { useSelector } from 'react-redux';
import { SectionContainer, Title, Subtitle, ContentWrapper, SeeAllLink } from './style';
import { WikiContent, WikiSectionProps} from './types'

export const WikiSection = ({
  colorScheme,
  title,
  subtitle,
  content,
  variant = 'grid',
  contentType
}: WikiSectionProps) => {

    const renderContent = () => {
      // switch(variant) {
      //   case 'carousel':
      //     return <CharacterCarousel items={content} />;
      //   case 'grid':
      //     return <ContentGrid items={content} columns={3} />;
      //   default:
      //     return <ContentGrid items={content} columns={2} />;
      // }
    };
  
    const scheme = colorCardsSchemes[colorScheme];
    //const { theme, neon } = useSelector((state: any) => state.themesReducer);

    return (
      <SectionContainer scheme={scheme} className={`wiki-section ${contentType}`}>
        <Title scheme={scheme}>{title}</Title>
        {subtitle && <Subtitle>{subtitle}</Subtitle>}
        
        <ContentWrapper variant={variant}>
          
        </ContentWrapper>
        
        <SeeAllLink to={`/wiki/${contentType}`}>
          Ver todos {title.toLowerCase()}
        </SeeAllLink>
      </SectionContainer>
    )
}