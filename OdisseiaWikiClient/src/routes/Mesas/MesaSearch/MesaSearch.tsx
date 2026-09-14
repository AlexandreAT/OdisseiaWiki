import SearchIcon from '@mui/icons-material/Search';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AnimatedBackground } from '../../../components/Generic/AnimatedBackground/AnimatedBackground';
import { LoadingIndicator } from '../../../components/Generic/LoadingIndicator';
import { Search } from '../../../components/Generic/Search/Search';
import { Select } from '../../../components/Generic/Select/Select';
import { MesaHudDecor } from '../components/MesaHudDecor/MesaHudDecor';
import { MesaCard } from '../components/MesaCard/MesaCard';
import { MesaPagination } from '../components/MesaPagination/MesaPagination';
import { CardGrid, CheckFilter, EmptyState, MesaPage, PageHeader, SearchToolbar } from '../Mesas.style';
import { useMesaSearch } from './useMesaSearch';
import type { MesaThemeState } from '../MesaThemeState';

const MesaSearch = () => {
  const { theme, neon } = useSelector((state: MesaThemeState) => state.themesReducer);
  const navigate = useNavigate();
  const state = useMesaSearch();
  const isNeonActive = neon === 'on';

  return (
    <>
      <AnimatedBackground type="distant" skipIntro />
      <MesaPage $neon={isNeonActive}>
        <PageHeader $neon={isNeonActive}>
          <MesaHudDecor neon={isNeonActive} />
          <div><h1>Pesquisa de Mesa</h1><p>Encontre uma campanha e solicite sua participação.</p></div>
        </PageHeader>
        <SearchToolbar>
          <Search
            theme={theme}
            neon={neon}
            label="Buscar Mesas"
            value={state.query}
            onChange={(event) => state.setQuery(event.target.value)}
            icon={<SearchIcon />}
            width="100%"
            height="52px"
          />
          <Select
            theme={theme}
            neon={neon}
            label="Sistema"
            value={state.systemId ?? ''}
            onChange={(event) => state.setSystemId(event.target.value ? Number(event.target.value) : undefined)}
            options={state.systems.map((system) => ({ value: system.idSistemaRpg, label: system.nome }))}
            width="100%"
            height="52px"
            portal
          />
          <CheckFilter>
            <input type="checkbox" checked={state.availableOnly} onChange={(event) => state.setAvailableOnly(event.target.checked)} />
            Apenas com vagas
          </CheckFilter>
        </SearchToolbar>
        {state.loading && (
          <EmptyState aria-busy="true"><LoadingIndicator label="Pesquisando Mesas" /></EmptyState>
        )}
        {!state.loading && (
          <>
            {state.result.itens.length === 0 ? <EmptyState>Nenhuma Mesa encontrada com estes filtros.</EmptyState> : (
              <CardGrid>{state.result.itens.map((mesa) => <MesaCard key={mesa.idMesa} mesa={mesa} onOpen={() => navigate(`/mesa/${mesa.idMesa}`)} />)}</CardGrid>
            )}
            <MesaPagination page={state.page} totalPages={state.result.totalPaginas} onChange={state.setPage} />
          </>
        )}
      </MesaPage>
    </>
  );
};

export default MesaSearch;
