import { JSONContent } from '../models/Characters';

/**
 * Converte uma string simples em JSONContent (formato TipTap/ProseMirror)
 */
export const stringToJSONContent = (text: string): JSONContent => {
  if (!text || text.trim() === '') {
    return {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: []
        }
      ]
    };
  }

  // Separa por quebras de linha e cria parágrafos
  const paragraphs = text.split('\n').map(line => ({
    type: 'paragraph',
    content: line.trim() ? [{ type: 'text', text: line }] : []
  }));

  return {
    type: 'doc',
    content: paragraphs
  };
};

/**
 * Converte JSONContent em string simples (para exibição básica ou fallback)
 */
export const jsonContentToString = (content: JSONContent | string | undefined): string => {
  if (!content) return '';
  
  // Se já for string, retorna
  if (typeof content === 'string') return content;

  // Extrai texto do JSONContent recursivamente
  const extractText = (node: JSONContent): string => {
    if (node.text) return node.text;
    
    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join('');
    }
    
    return '';
  };

  if (!content.content || !Array.isArray(content.content)) {
    return extractText(content);
  }

  // Une os parágrafos com quebra de linha
  return content.content
    .map(node => extractText(node))
    .filter(text => text.trim())
    .join('\n');
};

/**
 * Verifica se o conteúdo é um JSONContent válido
 */
export const isJSONContent = (value: any): value is JSONContent => {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('type' in value || 'content' in value || 'text' in value)
  );
};

/**
 * Normaliza o conteúdo para JSONContent
 * Se for string, converte. Se já for JSONContent, retorna.
 */
export const normalizeToJSONContent = (value: any): JSONContent => {
  if (!value) {
    return stringToJSONContent('');
  }

  if (typeof value === 'string') {
    return stringToJSONContent(value);
  }

  if (isJSONContent(value)) {
    return value;
  }

  // Se for outro tipo, tenta converter para string primeiro
  return stringToJSONContent(String(value));
};

/**
 * Prepara o conteúdo para envio à API
 * Se for string, converte para JSONContent. Se já for objeto, retorna.
 */
export const prepareForAPI = (value: any): JSONContent | undefined => {
  if (!value) return undefined;
  
  return normalizeToJSONContent(value);
};

/**
 * Cria um JSONContent vazio
 */
export const createEmptyJSONContent = (): JSONContent => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: []
    }
  ]
});
