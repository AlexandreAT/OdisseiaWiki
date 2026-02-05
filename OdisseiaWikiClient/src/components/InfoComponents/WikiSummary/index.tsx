import { colorCardsSchemes } from '../../../Global Styles/ColorCardsSchemes';
import { SectionContainer, Title, Subtitle, ContentWrapper, SeeAllLink } from './style';
import { WikiSectionProps} from './types'

export const WikiSection = ({
  colorScheme,
  title,
  subtitle,
  variant = 'grid',
  contentType
}: WikiSectionProps) => {
    const scheme = colorCardsSchemes[colorScheme];
    
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