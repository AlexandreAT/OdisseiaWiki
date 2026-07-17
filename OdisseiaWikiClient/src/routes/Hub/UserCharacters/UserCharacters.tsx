import { useEffect, useMemo, useState } from 'react';
import { Add, ArrowBack, DeleteOutline, FilterAlt, Checklist, SortByAlpha } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../../../components/Generic/ConfirmDialog/ConfirmDialog';
import { PersonagemJogador, StatusBase } from '../../../models/PersonagemJogador';
import { CidadePayload, getCidades, getCidadesByIds } from '../../../services/cidadesService';
import { getMesas } from '../../../services/mesaService';
import { Mesa } from '../../../models/Mesa';
import { deletarPersonagensJogador, getPersonagensPorUsuario } from '../../../services/personagemJogadorService';
import { getRacas, getRacasByIds, RacaPayload } from '../../../services/racasService';
import { getApiErrorMessage } from '../../../utils/apiError';
import { CharacterCreate } from './CharacterCreate/CharacterCreate';
import { CharacterEdit } from './CharacterEdit/CharacterEdit';
import { CharacterSelectionCard } from './CharacterSelectionCard/CharacterSelectionCard';
import {
  BackButtonDiv,
  ButtonDiv,
  DeleteSelectedButton,
  FilterValueField,
  ListHeaderTools,
  ListController,
  Main,
  SelectModeButton,
  StyledIconButton,
  ToolField,
  ToolSelect,
  Title,
} from './UserCharacters.style';

interface UserCharactersProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  userId: number;
  onViewModeChange?: (mode: ViewMode) => void;
  onPersonagensChange?: (hasPersonagens: boolean) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

interface PersonagemComStatus extends PersonagemJogador {
  status: StatusBase;
  level: number;
  xp: number;
}

export type ViewMode = 'list' | 'create' | 'edit';
type CharacterOrder = 'name' | 'date';
type CharacterFilter = 'none' | 'race' | 'city' | 'mesa';

const emptyStatus: StatusBase = {
  vida: 0,
  vidaMaxima: 0,
  estamina: 0,
  estaminaMaxima: 0,
  mana: 0,
  manaMaxima: 0,
  capacidadeCarga: 0,
};

const parsePersonagens = (data: PersonagemJogador[]): PersonagemComStatus[] => data.map((rawPersonagem) => {
  const source = rawPersonagem as PersonagemJogador & Record<string, any>;
  const personagem: PersonagemJogador = {
    ...rawPersonagem,
    idpersonagemJogador: source.idpersonagemJogador ?? source.IdpersonagemJogador,
    idusuario: source.idusuario ?? source.Idusuario,
    idmesa: source.idmesa ?? source.Idmesa,
    nome: source.nome ?? source.Nome ?? '',
    idraca: source.idraca ?? source.Idraca,
    idcidade: source.idcidade ?? source.Idcidade,
    historia: source.historia ?? source.Historia,
    statusJson: source.statusJson ?? source.StatusJson,
    alinhamento: source.alinhamento ?? source.Alinhamento,
    tracos: source.tracos ?? source.Tracos,
    costumes: source.costumes ?? source.Costumes,
    infoSecundariasJson: source.infoSecundariasJson ?? source.InfoSecundariasJson,
    imagem: source.imagem ?? source.Imagem,
    galeriaImagem: source.galeriaImagem ?? source.GaleriaImagem,
    inventarioJson: source.inventarioJson ?? source.InventarioJson,
    skills: source.skills ?? source.Skills,
    magia: source.magia ?? source.Magia,
    personagemsVinculados: source.personagemsVinculados ?? source.PersonagemsVinculados,
    idpassiva: source.idpassiva ?? source.Idpassiva,
    ultimate: source.ultimate ?? source.Ultimate,
    nanites: source.nanites ?? source.Nanites,
    dataCriacao: source.dataCriacao ?? source.DataCriacao,
    racaNome: source.racaNome ?? source.RacaNome,
    cidadeNome: source.cidadeNome ?? source.CidadeNome,
    mesaNome: source.mesaNome ?? source.MesaNome,
    autorNome: source.autorNome ?? source.AutorNome,
    proficiencias: source.proficiencias ?? source.Proficiencias ?? [],
  };
  let parsedStatusJson: any = null;

  try {
    parsedStatusJson = typeof personagem.statusJson === 'string'
      ? JSON.parse(personagem.statusJson)
      : personagem.statusJson;
  } catch (error) {
    console.warn('Erro ao interpretar o status do personagem.', error);
  }

  const rawStatus = parsedStatusJson?.status ?? emptyStatus;

  return {
    ...personagem,
    proficiencias: (personagem.proficiencias ?? []).map((proficiencia: any) => ({
      idproficiencia: proficiencia.idproficiencia ?? proficiencia.Idproficiencia,
      nome: proficiencia.nome ?? proficiencia.Nome,
      descricao: proficiencia.descricao ?? proficiencia.Descricao,
    })),
    status: {
      vida: rawStatus.vida ?? 0,
      vidaMaxima: rawStatus.vidaMaxima ?? rawStatus.vida ?? 0,
      estamina: rawStatus.estamina ?? 0,
      estaminaMaxima: rawStatus.estaminaMaxima ?? rawStatus.estamina ?? 0,
      mana: rawStatus.mana ?? 0,
      manaMaxima: rawStatus.manaMaxima ?? rawStatus.mana ?? 0,
      capacidadeCarga: rawStatus.capacidadeCarga ?? 0,
    },
    level: Math.max(1, Number(parsedStatusJson?.nivel) || 1),
    xp: Math.max(0, Number(parsedStatusJson?.xp) || 0),
  };
});

const hydrateRelationNames = async (personagens: PersonagemComStatus[]): Promise<PersonagemComStatus[]> => {
  if (personagens.length === 0) return personagens;

  const raceIds = [...new Set(personagens
    .filter((personagem) => !personagem.racaNome)
    .map((personagem) => Number(personagem.idraca))
    .filter((id) => Number.isInteger(id) && id > 0))];
  const cityIds = [...new Set(personagens
    .filter((personagem) => !personagem.cidadeNome)
    .map((personagem) => Number(personagem.idcidade))
    .filter((id) => Number.isInteger(id) && id > 0))];
  const needsMesaNames = personagens.some((personagem) => !personagem.mesaNome && Number(personagem.idmesa) > 0);

  const [racesResult, citiesResult, mesasResult] = await Promise.allSettled([
    raceIds.length > 0 ? getRacasByIds(raceIds) : Promise.resolve([]),
    cityIds.length > 0 ? getCidadesByIds(cityIds) : Promise.resolve([]),
    needsMesaNames ? getMesas() : Promise.resolve([]),
  ]);

  const races = racesResult.status === 'fulfilled' ? racesResult.value : [];
  const cities = citiesResult.status === 'fulfilled' ? citiesResult.value : [];
  const mesas = mesasResult.status === 'fulfilled' ? mesasResult.value : [];
  const raceNames = new Map(races.map((race) => [Number(race.idraca), race.nome]));
  const cityNames = new Map(cities.map((city) => [Number(city.idcidade), city.nome]));
  const mesaNames = new Map(mesas.map((mesa) => [Number(mesa.idmesa), mesa.nome]));

  return personagens.map((personagem) => ({
    ...personagem,
    racaNome: personagem.racaNome || raceNames.get(Number(personagem.idraca)),
    cidadeNome: personagem.cidadeNome || cityNames.get(Number(personagem.idcidade)),
    mesaNome: personagem.mesaNome || mesaNames.get(Number(personagem.idmesa)),
  }));
};

const loadPersonagens = async (userId: number) => (
  hydrateRelationNames(parsePersonagens(await getPersonagensPorUsuario(userId)))
);

export const UserCharacters = ({
  theme,
  neon,
  userId,
  onViewModeChange,
  onPersonagensChange,
  onLoadingChange,
}: UserCharactersProps) => {
  const [personagens, setPersonagens] = useState<PersonagemComStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCharacter, setSelectedCharacter] = useState<PersonagemJogador | null>(null);
  const [orderBy, setOrderBy] = useState<CharacterOrder>('name');
  const [filterBy, setFilterBy] = useState<CharacterFilter>('none');
  const [filterValue, setFilterValue] = useState('');
  const [availableRaces, setAvailableRaces] = useState<RacaPayload[]>([]);
  const [availableCities, setAvailableCities] = useState<CidadePayload[]>([]);
  const [availableMesas, setAvailableMesas] = useState<Mesa[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStep: 1 | 2 = searchParams.get('step') === '2' ? 2 : 1;

  const updateRouteState = (mode: ViewMode, character?: PersonagemJogador, step?: 1 | 2) => {
    const next = new URLSearchParams(searchParams);
    next.set('section', 'personagens');

    if (mode === 'list') {
      next.delete('mode');
      next.delete('characterId');
      next.delete('step');
    } else {
      next.set('mode', mode);
      if (character) next.set('characterId', String(character.idpersonagemJogador));
      else next.delete('characterId');
      if (mode === 'edit') next.set('step', String(step ?? 1));
      else next.delete('step');
    }

    setSearchParams(next);
    setSelectedCharacter(character ?? null);
    setViewMode(mode);
  };

  const refreshCharacters = async () => {
    setPersonagens(await loadPersonagens(userId));
  };

  useEffect(() => {
    onViewModeChange?.(viewMode);
  }, [viewMode, onViewModeChange]);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    if (!loading) onPersonagensChange?.(personagens.length > 0);
  }, [personagens, loading, onPersonagensChange]);

  useEffect(() => {
    let active = true;

    loadPersonagens(userId)
      .then((data) => {
        if (active) setPersonagens(data);
      })
      .catch((requestError: unknown) => {
        if (active) setError(getApiErrorMessage(requestError, 'Erro ao carregar personagens'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    if (personagens.length === 0) return;

    let active = true;
    Promise.allSettled([getRacas(true), getCidades(true), getMesas()]).then(([racesResult, citiesResult, mesasResult]) => {
      if (!active) return;
      setAvailableRaces(racesResult.status === 'fulfilled' ? racesResult.value.racas ?? [] : []);
      setAvailableCities(citiesResult.status === 'fulfilled' ? citiesResult.value.cidades ?? [] : []);
      setAvailableMesas(mesasResult.status === 'fulfilled' ? mesasResult.value : []);
    });

    return () => { active = false; };
  }, [personagens.length]);

  useEffect(() => {
    if (loading) return;

    const requestedMode = searchParams.get('mode');
    if (requestedMode === 'create') {
      setSelectedCharacter(null);
      setViewMode('create');
      return;
    }

    if (requestedMode === 'edit') {
      const characterId = Number(searchParams.get('characterId'));
      const character = personagens.find((item) => item.idpersonagemJogador === characterId);
      if (character) {
        setSelectedCharacter(character);
        setViewMode('edit');
        return;
      }
    }

    setSelectedCharacter(null);
    setViewMode('list');
  }, [loading, personagens, searchParams]);

  const filterOptions = useMemo(() => {
    if (filterBy === 'race') {
      const usedIds = new Set(personagens.map((personagem) => Number(personagem.idraca)));
      return availableRaces
        .filter((race) => usedIds.has(Number(race.idraca)))
        .map((race) => ({ id: race.idraca, name: race.nome }));
    }

    if (filterBy === 'city') {
      const usedIds = new Set(personagens.map((personagem) => Number(personagem.idcidade)));
      return availableCities
        .filter((city) => usedIds.has(Number(city.idcidade)))
        .map((city) => ({ id: city.idcidade, name: city.nome }));
    }

    if (filterBy === 'mesa') {
      const usedIds = new Set(personagens.map((personagem) => Number(personagem.idmesa)));
      return availableMesas
        .filter((mesa) => usedIds.has(Number(mesa.idmesa)))
        .map((mesa) => ({ id: mesa.idmesa, name: mesa.nome }));
    }

    return [];
  }, [availableCities, availableMesas, availableRaces, filterBy, personagens]);

  const displayedCharacters = useMemo(() => {
    const selectedFilterId = Number(filterValue);
    const filtered = filterBy === 'none' || !selectedFilterId
      ? [...personagens]
      : personagens.filter((personagem) => {
          if (filterBy === 'race') return Number(personagem.idraca) === selectedFilterId;
          if (filterBy === 'city') return Number(personagem.idcidade) === selectedFilterId;
          return Number(personagem.idmesa) === selectedFilterId;
        });

    return filtered.sort((a, b) => {
      if (orderBy === 'date') {
        return new Date(b.dataCriacao || 0).getTime() - new Date(a.dataCriacao || 0).getTime();
      }
      return a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' });
    });
  }, [filterBy, filterValue, orderBy, personagens]);

  const handleFilterChange = (nextFilter: CharacterFilter) => {
    setFilterBy(nextFilter);
    setFilterValue('');
    setSelectedIds(new Set());
  };

  const toggleSelectionMode = () => {
    setSelectionMode((current) => !current);
    setSelectedIds(new Set());
  };

  const toggleCharacterSelection = (id: number) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBatchDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    setIsDeletingBatch(true);
    try {
      const deleted = await deletarPersonagensJogador(ids);
      await refreshCharacters();
      setSelectedIds(new Set());
      setSelectionMode(false);
      setBatchDeleteOpen(false);
      toast.success(`${deleted} ${deleted === 1 ? 'personagem excluído' : 'personagens excluídos'} com sucesso.`);
    } catch (requestError: unknown) {
      toast.error(getApiErrorMessage(requestError, 'Não foi possível excluir os personagens selecionados.'));
    } finally {
      setIsDeletingBatch(false);
    }
  };

  if (loading) return <div>Carregando personagens...</div>;

  if (viewMode === 'create') {
    return (
      <Main>
        <BackButtonDiv theme={theme} neon={neon}>
          <StyledIconButton theme={theme} neon={neon} onClick={() => updateRouteState('list')}>
            <ArrowBack className="icon" />
          </StyledIconButton>
        </BackButtonDiv>
        <Title theme={theme} neon={neon}>Criar Personagem</Title>
        <CharacterCreate
          theme={theme}
          neon={neon}
          userId={userId}
          onSave={async () => {
            updateRouteState('list');
            await refreshCharacters();
          }}
        />
      </Main>
    );
  }

  if (viewMode === 'edit') {
    return (
      <Main>
        <BackButtonDiv theme={theme} neon={neon}>
          <StyledIconButton theme={theme} neon={neon} onClick={() => updateRouteState('list')}>
            <ArrowBack className="icon" />
          </StyledIconButton>
        </BackButtonDiv>
        <Title theme={theme} neon={neon} $editMode>Editar Personagem</Title>
        {selectedCharacter && (
          <CharacterEdit
            theme={theme}
            neon={neon}
            personagem={selectedCharacter}
            userId={userId}
            initialStep={requestedStep}
            onSave={refreshCharacters}
            onBack={() => updateRouteState('list')}
          />
        )}
      </Main>
    );
  }

  return (
    <Main>
      <Title theme={theme} neon={neon}>Seus Personagens</Title>
      {personagens.length > 0 && (
        <ListHeaderTools theme={theme} neon={neon}>
          <ToolField>
            <SortByAlpha aria-hidden="true" />
            <span>Ordenar</span>
            <ToolSelect value={orderBy} onChange={(event) => setOrderBy(event.target.value as CharacterOrder)}>
              <option value="name">Nome</option>
              <option value="date">Data de criação</option>
            </ToolSelect>
          </ToolField>
          <ToolField>
            <FilterAlt aria-hidden="true" />
            <span>Filtrar</span>
            <ToolSelect value={filterBy} onChange={(event) => handleFilterChange(event.target.value as CharacterFilter)}>
              <option value="none">Sem filtro</option>
              <option value="race">Raça</option>
              <option value="city">Cidade</option>
              <option value="mesa">Mesa</option>
            </ToolSelect>
          </ToolField>
          {filterBy !== 'none' && (
            <FilterValueField>
              <span>Valor</span>
              <ToolSelect value={filterValue} onChange={(event) => setFilterValue(event.target.value)}>
                <option value="">Todos</option>
                {filterOptions.map((option) => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </ToolSelect>
            </FilterValueField>
          )}
          <SelectModeButton type="button" $active={selectionMode} onClick={toggleSelectionMode}>
            <Checklist />
            <span>{selectionMode ? 'Cancelar seleção' : 'Selecionar vários'}</span>
          </SelectModeButton>
          {selectionMode && (
            <DeleteSelectedButton
              type="button"
              disabled={selectedIds.size === 0 || isDeletingBatch}
              onClick={() => setBatchDeleteOpen(true)}
              title={selectedIds.size === 0 ? 'Selecione ao menos um personagem' : `Excluir ${selectedIds.size} selecionado(s)`}
            >
              <DeleteOutline />
              <span>Excluir ({selectedIds.size})</span>
            </DeleteSelectedButton>
          )}
        </ListHeaderTools>
      )}
      <ButtonDiv theme={theme} neon={neon}>
        <StyledIconButton theme={theme} neon={neon} onClick={() => updateRouteState('create')}>
          <Add className="icon" />
        </StyledIconButton>
      </ButtonDiv>
      {error ? error : (
        <ListController>
          {displayedCharacters.map((personagem) => (
            <CharacterSelectionCard
              key={personagem.idpersonagemJogador}
              personagem={personagem}
              status={personagem.status}
              level={personagem.level}
              xp={personagem.xp}
              theme={theme}
              neon={neon}
              onView={() => navigate(`/personagem/${personagem.idpersonagemJogador}?tipo=jogador`)}
              onSheet={() => updateRouteState('edit', personagem, 2)}
              onEdit={() => updateRouteState('edit', personagem, 1)}
              selectionMode={selectionMode}
              selected={selectedIds.has(personagem.idpersonagemJogador)}
              onToggleSelection={() => toggleCharacterSelection(personagem.idpersonagemJogador)}
            />
          ))}
        </ListController>
      )}
      <ConfirmDialog
        open={batchDeleteOpen}
        title="Excluir personagens selecionados"
        message={`Tem certeza de que deseja excluir ${selectedIds.size} ${selectedIds.size === 1 ? 'personagem' : 'personagens'}? As imagens vinculadas também serão removidas e esta ação não poderá ser desfeita.`}
        confirmText="Excluir selecionados"
        onConfirm={handleBatchDelete}
        onCancel={() => setBatchDeleteOpen(false)}
        isLoading={isDeletingBatch}
      />
    </Main>
  );
};
