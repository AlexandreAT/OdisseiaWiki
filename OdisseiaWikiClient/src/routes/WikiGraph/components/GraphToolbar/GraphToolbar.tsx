import { ChangeEvent, KeyboardEvent, useEffect, useId, useRef, useState } from 'react';
import {
  BiBookContent,
  BiBuildingHouse,
  BiGridAlt,
  BiSearch,
  BiShuffle,
  BiTargetLock,
  BiUser,
} from 'react-icons/bi';
import { GiDna2 } from 'react-icons/gi';
import {
  WikiGraphEntityType,
  WikiGraphIdentifiedNode,
  WikiGraphLayoutMode,
} from '../../../../models/WikiGraph';
import {
  CentralizeButton,
  EmptySearch,
  FocusButton,
  FocusFilters,
  OrganizationButton,
  OrganizationControl,
  OrganizationMenu,
  OrganizationOption,
  SearchArea,
  SearchBox,
  SearchResultButton,
  SearchResults,
  ToolbarActions,
  ToolbarWrapper,
} from './GraphToolbar.style';

interface GraphToolbarProps {
  activeTypes: ReadonlySet<WikiGraphEntityType>;
  query: string;
  results: WikiGraphIdentifiedNode[];
  searchPending: boolean;
  searchOpen: boolean;
  neon: boolean;
  layoutMode: WikiGraphLayoutMode;
  onToggleType: (type: WikiGraphEntityType) => void;
  onQueryChange: (value: string) => void;
  onSearchFocus: () => void;
  onSearchBlur: () => void;
  onSearchDismiss: () => void;
  onSelectResult: (node: WikiGraphIdentifiedNode) => void;
  onLayoutModeChange: (mode: WikiGraphLayoutMode) => void;
  onCentralize: () => void;
}

const typeOptions = [
  { type: 'character' as const, label: 'Personagens', color: 'var(--clearneonPink)', Icon: BiUser },
  { type: 'race' as const, label: 'Raças', color: 'var(--clearneonGreen)', Icon: GiDna2 },
  { type: 'city' as const, label: 'Cidades', color: 'var(--clearneonYellow)', Icon: BiBuildingHouse },
  { type: 'page' as const, label: 'Páginas', color: 'var(--clearneonBlue)', Icon: BiBookContent },
];

const typeMeta: Record<WikiGraphEntityType, { label: string; color: string }> = {
  character: { label: 'Personagem', color: 'var(--clearneonPink)' },
  race: { label: 'Raça', color: 'var(--clearneonGreen)' },
  city: { label: 'Cidade', color: 'var(--clearneonYellow)' },
  page: { label: 'Página', color: 'var(--clearneonBlue)' },
};

export const GraphToolbar = ({
  activeTypes,
  query,
  results,
  searchPending,
  searchOpen,
  neon,
  layoutMode,
  onToggleType,
  onQueryChange,
  onSearchFocus,
  onSearchBlur,
  onSearchDismiss,
  onSelectResult,
  onLayoutModeChange,
  onCentralize,
}: GraphToolbarProps) => {
  const resultListId = useId();
  const organizationRef = useRef<HTMLDivElement>(null);
  const [activeResultIndex, setActiveResultIndex] = useState(-1);
  const [organizationOpen, setOrganizationOpen] = useState(false);
  const availableResults = searchPending ? [] : results;
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => onQueryChange(event.target.value);

  useEffect(() => {
    setActiveResultIndex(-1);
  }, [query, results, searchPending]);

  useEffect(() => {
    if (!searchOpen || activeResultIndex < 0) return undefined;
    const animationFrame = window.requestAnimationFrame(() => {
      document.getElementById(`${resultListId}-option-${activeResultIndex}`)?.scrollIntoView({
        block: 'nearest',
      });
    });
    return () => window.cancelAnimationFrame(animationFrame);
  }, [activeResultIndex, resultListId, searchOpen]);

  useEffect(() => {
    if (!organizationOpen) return undefined;

    const dismiss = (event: MouseEvent) => {
      if (!organizationRef.current?.contains(event.target as Node)) {
        setOrganizationOpen(false);
      }
    };
    const dismissWithKeyboard = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') setOrganizationOpen(false);
    };

    document.addEventListener('mousedown', dismiss);
    document.addEventListener('keydown', dismissWithKeyboard);
    return () => {
      document.removeEventListener('mousedown', dismiss);
      document.removeEventListener('keydown', dismissWithKeyboard);
    };
  }, [organizationOpen]);

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onSearchDismiss();
      return;
    }

    if (availableResults.length === 0) return;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      onSearchFocus();
      setActiveResultIndex((current) => {
        const direction = event.key === 'ArrowDown' ? 1 : -1;
        if (current < 0) return direction > 0 ? 0 : availableResults.length - 1;
        return (current + direction + availableResults.length) % availableResults.length;
      });
      return;
    }

    if (event.key === 'Enter' && searchOpen) {
      event.preventDefault();
      onSelectResult(availableResults[activeResultIndex] ?? availableResults[0]);
    }
  };

  return (
    <ToolbarWrapper $neon={neon} aria-label="Controles da Teia de Conexões">
      <FocusFilters aria-label="Destacar tipos de entidade">
        {typeOptions.map(({ type, label, color, Icon }) => (
          <FocusButton
            key={type}
            type="button"
            $active={activeTypes.has(type)}
            $color={color}
            $neon={neon}
            aria-pressed={activeTypes.has(type)}
            onClick={() => onToggleType(type)}
          >
            <Icon aria-hidden="true" />
            {label}
          </FocusButton>
        ))}
      </FocusFilters>

      <SearchArea>
        <SearchBox>
          <BiSearch aria-hidden="true" />
          <input
            type="search"
            value={query}
            placeholder="Buscar entidades na teia..."
            aria-label="Buscar entidades na Teia de Conexões"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={searchOpen && Boolean(query.trim())}
            aria-controls={resultListId}
            aria-activedescendant={searchOpen && activeResultIndex >= 0
              ? `${resultListId}-option-${activeResultIndex}`
              : undefined}
            autoComplete="off"
            onChange={handleChange}
            onFocus={onSearchFocus}
            onBlur={onSearchBlur}
            onKeyDown={handleKeyDown}
          />
        </SearchBox>

        {searchOpen && query.trim() && (
          <SearchResults id={resultListId} role="listbox">
            {searchPending ? (
              <EmptySearch>Buscando...</EmptySearch>
            ) : availableResults.length === 0 ? (
              <EmptySearch>Nenhuma entidade visível encontrada.</EmptySearch>
            ) : availableResults.map((node, index) => (
              <SearchResultButton
                key={node.graphId}
                id={`${resultListId}-option-${index}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={index === activeResultIndex}
                $color={typeMeta[node.entityType].color}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveResultIndex(index)}
                onClick={() => onSelectResult(node)}
              >
                <span>{node.title}</span>
                <span>
                  {typeMeta[node.entityType].label}
                  {node.hidden && <small>Não visível</small>}
                </span>
              </SearchResultButton>
            ))}
          </SearchResults>
        )}
      </SearchArea>

      <ToolbarActions>
        <OrganizationControl ref={organizationRef}>
          <OrganizationButton
            type="button"
            $active={layoutMode === 'organized'}
            $neon={neon}
            aria-haspopup="menu"
            aria-expanded={organizationOpen}
            onClick={() => setOrganizationOpen((open) => !open)}
            title="Escolher organização da teia"
          >
            {layoutMode === 'organized'
              ? <BiGridAlt aria-hidden="true" />
              : <BiShuffle aria-hidden="true" />}
            <span>Organizar</span>
          </OrganizationButton>
          {organizationOpen && (
            <OrganizationMenu role="menu" aria-label="Organização da teia">
              <OrganizationOption
                type="button"
                role="menuitemradio"
                aria-checked={layoutMode === 'free'}
                $active={layoutMode === 'free'}
                onClick={() => {
                  onLayoutModeChange('free');
                  setOrganizationOpen(false);
                }}
              >
                <BiShuffle aria-hidden="true" />
                <span><strong>Livre</strong><small>Padrão desorganizado</small></span>
              </OrganizationOption>
              <OrganizationOption
                type="button"
                role="menuitemradio"
                aria-checked={layoutMode === 'organized'}
                $active={layoutMode === 'organized'}
                onClick={() => {
                  onLayoutModeChange('organized');
                  setOrganizationOpen(false);
                }}
              >
                <BiGridAlt aria-hidden="true" />
                <span><strong>Automática</strong><small>Separa nós e reduz cruzamentos</small></span>
              </OrganizationOption>
            </OrganizationMenu>
          )}
        </OrganizationControl>

        <CentralizeButton
          type="button"
          $neon={neon}
          onClick={onCentralize}
          title="Centralizar no nó principal"
        >
          <BiTargetLock aria-hidden="true" />
          <span>Centralizar</span>
        </CentralizeButton>
      </ToolbarActions>
    </ToolbarWrapper>
  );
};
