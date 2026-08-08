import api from '../axios/api';
import {
  CharacterComparisonData,
  CharacterComparisonSource,
} from '../components/CharacterComparison/CharacterComparison.types';

interface SearchCharactersArgs {
  source: CharacterComparisonSource;
  sourceId?: number;
  tableId?: number | null;
  term: string;
  signal?: AbortSignal;
}

export const searchCharactersForComparison = async ({
  source,
  sourceId,
  tableId,
  term,
  signal,
}: SearchCharactersArgs): Promise<CharacterComparisonData[]> => {
  const response = await api.get<CharacterComparisonData[]>('/personagens-comparacao/pesquisar', {
    params: {
      origem: source,
      idPersonagemAtual: sourceId,
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
  signal?: AbortSignal,
): Promise<CharacterComparisonData> => {
  const response = await api.get<CharacterComparisonData>(
    `/personagens-comparacao/${source}/${id}`,
    { signal },
  );
  return response.data;
};
