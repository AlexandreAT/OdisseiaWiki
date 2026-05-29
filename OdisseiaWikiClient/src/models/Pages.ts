import { JSONContent } from './Characters';

// Enum para tipos de blocos
export enum PageBlockType {
  RICH_TEXT = 'Text',
  IMAGE = 'Image',
  GALLERY = 'Gallery',
  INFOLORE = 'InfoLore',
  RELATION = 'Relation',
}

// DTOs do Frontend (espelhando o backend)

export interface PageBlockDto {
  tipo: PageBlockType;
  conteudo: any; // Dinâmico conforme o tipo
  ordem: number;
}

export interface PageDto {
  idPage?: number;
  titulo: string;
  slug: string;
  descricao?: string;
  coverImage?: string;
  visivel: boolean;
  dataCriacao?: string;
}

export interface CreatePageWithBlocksDto {
  page: PageDto;
  blocks: PageBlockDto[];
}

export interface ResultPage {
  sucesso: boolean;
  mensagemErro?: string;
  page?: PageDto;
  blocks?: PageBlockDto[];
}

export interface ResultPageComplete {
  sucesso: boolean;
  mensagemErro?: string;
  page?: Page;
  blocks?: PageBlockDto[];
}

export interface ResultPages {
  sucesso: boolean;
  mensagemErro?: string;
  pages?: PageDto[];
}

export interface ResultPageWithBlocks {
  sucesso: boolean;
  mensagemErro?: string;
  page?: PageDto;
  blocks?: PageBlockDto[];
}

// Tipagem para conteúdo de blocos específicos

export interface RichTextBlockContent extends JSONContent {
  // Herda de JSONContent para suportar TipTap/ProseMirror
}

export interface ImageBlockContent {
  url: string;
  legenda?: string;
  texto?: JSONContent;
  posicaoTexto?: 'left' | 'right';
}

export interface GalleryBlockContent {
  imagens: ImageBlockContent[];
}

export interface InfoLoreBlockContent {
  idInfoLore: number;
  titulo?: string;
  imagem?: string;
}

export interface RelatedEntityBlockContent {
  idEntidade: number;
  tipoEntidade: 'Cidade' | 'Personagem' | 'Item' | 'Raca';
  nome?: string;
  imagem?: string;
}

// Modelo para uso interno (com ID de renderização)
export interface PageBlock extends PageBlockDto {
  tempId?: string; // ID temporário para renderização no frontend
}

export interface Page extends PageDto {
  blocks?: PageBlock[];
}

// InfoLore DTO (já definido em infoLoreService, mas incluindo aqui para facilitar)
export interface InfoLoreDto {
  idinfoLore?: number;
  titulo: string;
  descricao?: JSONContent | string;
  imagem?: string;
  ordem?: number;
  tags?: string[];
  visivel: boolean;
}
