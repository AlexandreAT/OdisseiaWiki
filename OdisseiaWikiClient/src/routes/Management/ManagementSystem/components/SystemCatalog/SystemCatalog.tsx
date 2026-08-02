import { useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import SettingsSuggestOutlinedIcon from '@mui/icons-material/SettingsSuggestOutlined';
import { Search } from '../../../../../components/Generic/Search/Search';
import { Select } from '../../../../../components/Generic/Select/Select';
import TitleGlitch from '../../../../../components/Generic/TitleGlitch/TitleGlitch';
import { SistemaRpgResumo } from '../../../../../models/SistemaRpg';
import {
  ActionButton,
  CardActions,
  CardDate,
  CardHeader,
  CatalogControls,
  HeaderActions,
  Metric,
  MetricGrid,
  PageHeader,
  StatePanel,
  StatusPill,
  SystemCard,
  SystemsGrid,
} from '../../ManagementSystem.style';

interface SystemCatalogProps {
  systems: SistemaRpgResumo[];
  loading: boolean;
  error: string | null;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  onRetry: () => void;
  onOpen: (system: SistemaRpgResumo) => void;
  onCreate: () => void;
  onEdit: (system: SistemaRpgResumo) => void;
  onToggleActive: (system: SistemaRpgResumo) => void;
  onDelete: (system: SistemaRpgResumo) => void;
}

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Data indisponível'
    : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(date);
};

export const SystemCatalog = ({
  systems,
  loading,
  error,
  theme,
  neon,
  onRetry,
  onOpen,
  onCreate,
  onEdit,
  onToggleActive,
  onDelete,
}: SystemCatalogProps) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [sort, setSort] = useState('atualizacao');

  const visibleSystems = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return systems
      .filter((system) => {
        if (statusFilter === 'ativos' && !system.ativo) return false;
        if (statusFilter === 'inativos' && system.ativo) return false;
        return !term || [system.nome, system.codigo, system.descricao ?? '']
          .some((field) => field.toLocaleLowerCase('pt-BR').includes(term));
      })
      .sort((left, right) => {
        if (sort === 'nome') return left.nome.localeCompare(right.nome, 'pt-BR');
        if (sort === 'versoes') return right.quantidadeVersoes - left.quantidadeVersoes;
        return new Date(right.dataAtualizacao).getTime() - new Date(left.dataAtualizacao).getTime();
      });
  }, [search, sort, statusFilter, systems]);

  return (
    <>
      <PageHeader theme={theme} neon={neon}>
        <div className="title-block">
          <TitleGlitch theme={theme} neon={neon} text="Sistemas de RPG" fontSize="clamp(24px, 3vw, 38px)" />
          <p>
            Crie sistemas modulares, evolua regras em rascunhos versionados e preserve as mesas
            que continuam usando versões anteriores.
          </p>
        </div>
        <HeaderActions>
          <ActionButton type="button" theme={theme} neon={neon} onClick={onCreate}>
            <AddIcon /> Novo sistema
          </ActionButton>
        </HeaderActions>
      </PageHeader>

      <CatalogControls>
        <Search
          theme={theme}
          neon={neon}
          label="Buscar por nome, código ou descrição"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          icon={<SearchIcon className="icon" />}
          height="56px"
        />
        <Select
          theme={theme}
          neon={neon}
          label="Status"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          options={[
            { label: 'Todos', value: 'todos' },
            { label: 'Ativos', value: 'ativos' },
            { label: 'Inativos', value: 'inativos' },
          ]}
          allowEmptyOption={false}
          height="56px"
        />
        <Select
          theme={theme}
          neon={neon}
          label="Ordenar por"
          value={sort}
          onChange={(event) => setSort(event.target.value)}
          options={[
            { label: 'Atualização', value: 'atualizacao' },
            { label: 'Nome', value: 'nome' },
            { label: 'Quantidade de versões', value: 'versoes' },
          ]}
          allowEmptyOption={false}
          height="56px"
        />
      </CatalogControls>

      {loading && (
        <StatePanel theme={theme} neon={neon} role="status">
          <SettingsSuggestOutlinedIcon />
          Carregando sistemas configuráveis...
        </StatePanel>
      )}

      {!loading && error && (
        <StatePanel theme={theme} neon={neon} $error role="alert">
          <strong>{error}</strong>
          <ActionButton type="button" theme={theme} neon={neon} onClick={onRetry}>
            <RefreshIcon /> Tentar novamente
          </ActionButton>
        </StatePanel>
      )}

      {!loading && !error && visibleSystems.length === 0 && (
        <StatePanel theme={theme} neon={neon}>
          <SettingsSuggestOutlinedIcon />
          {systems.length === 0
            ? 'Nenhum sistema foi cadastrado ainda.'
            : 'Nenhum sistema corresponde aos filtros atuais.'}
          {systems.length === 0 && (
            <ActionButton type="button" theme={theme} neon={neon} onClick={onCreate}>
              <AddIcon /> Criar o primeiro sistema
            </ActionButton>
          )}
        </StatePanel>
      )}

      {!loading && !error && visibleSystems.length > 0 && (
        <SystemsGrid>
          {visibleSystems.map((system) => (
            <SystemCard key={system.idSistemaRpg} theme={theme} neon={neon} $inactive={!system.ativo}>
              <CardHeader>
                <div>
                  <h3 title={system.nome}>{system.nome}</h3>
                  <small>{system.codigo}</small>
                </div>
                <StatusPill $status={system.ativo ? 'active' : 'inactive'}>
                  {system.ativo ? 'Ativo' : 'Inativo'}
                </StatusPill>
              </CardHeader>

              <p>{system.descricao?.trim() || 'Sem descrição cadastrada.'}</p>

              <MetricGrid>
                <Metric>
                  <span>Publicada</span>
                  <strong>{system.numeroVersaoPublicada ?? '—'}</strong>
                </Metric>
                <Metric>
                  <span>Versões</span>
                  <strong>{system.quantidadeVersoes}</strong>
                </Metric>
                <Metric>
                  <span>Mesas</span>
                  <strong>{system.quantidadeMesas}</strong>
                </Metric>
              </MetricGrid>

              <CardDate dateTime={system.dataAtualizacao}>
                Atualizado em {formatDate(system.dataAtualizacao)}
              </CardDate>

              <CardActions>
                <ActionButton type="button" theme={theme} neon={neon} $compact onClick={() => onOpen(system)}>
                  <FolderOpenOutlinedIcon /> Abrir
                </ActionButton>
                <ActionButton type="button" theme={theme} neon={neon} $compact onClick={() => onEdit(system)}>
                  <EditOutlinedIcon /> Editar
                </ActionButton>
                <ActionButton type="button" theme={theme} neon={neon} $compact onClick={() => onToggleActive(system)}>
                  <PowerSettingsNewIcon /> {system.ativo ? 'Desativar' : 'Ativar'}
                </ActionButton>
                <ActionButton type="button" theme={theme} neon={neon} $compact $danger onClick={() => onDelete(system)}>
                  <DeleteOutlineIcon /> Excluir
                </ActionButton>
              </CardActions>
            </SystemCard>
          ))}
        </SystemsGrid>
      )}
    </>
  );
};
