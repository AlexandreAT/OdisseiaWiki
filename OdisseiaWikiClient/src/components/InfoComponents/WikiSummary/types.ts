import { colorCardsSchemes } from '../../../Global Styles/ColorCardsSchemes';

export type WikiContent = {
    Nome: string;
    Imagem?: string;
    Description?: string;
    link?: string;
    type?: 'character' | 'city' | 'item' | 'planet';
  };
  
  export type WikiSectionProps = {
    title: string;
    subtitle?: string;
    content: WikiContent[];
    variant?: 'carousel' | 'grid' | 'list';
    colorScheme: keyof typeof colorCardsSchemes;
    contentType: 'characters' | 'cities' | 'items' | 'planets';
  };