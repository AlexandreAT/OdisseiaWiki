import api from '../axios/api';
import {
  CharacterComparisonData,
  CharacterComparisonSource,
} from '../components/CharacterComparison/CharacterComparison.types';

interface SearchCharactersArgs {
  source: CharacterComparisonSource;
  sourceId?: number;
  currentVariantId?: string | null;
  tableId?: number | null;
  term: string;
  signal?: AbortSignal;
}

export const searchCharactersForComparison = async ({
  source,
  sourceId,
  currentVariantId,
  tableId,
  term,
  signal,
}: SearchCharactersArgs): Promise<CharacterComparisonData[]> => {
  const response = await api.get<CharacterComparisonData[]>('/personagens-comparacao/pesquisar', {
    params: {
      origem: source,
      idPersonagemAtual: sourceId,
      idVarianteAtual: currentVariantId || undefined,
      idMesa: tableId,
      termo: term,
    },
    signal,
  });
  return response.data;
};

export const getCharacterForComparison = async (
  source: CharacterComparisonSource,
  id: number,
  variantId?: string | null,
  signal?: AbortSignal,
): Promise<CharacterComparisonData> => {
  const response = await api.get<CharacterComparisonData>(
    `/personagens-comparacao/${source}/${id}`,
    { params: { idVariante: variantId || undefined }, signal },
  );
  return response.data;
};
