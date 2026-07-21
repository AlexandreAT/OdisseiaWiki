import React from 'react';
import { createPortal } from 'react-dom';
import { useParams, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { usePersonagem } from './usePersonagem';
import { PageContainer, TopSection, BottomSection, AvatarWrapper, MetaRow, Sections, CardContent, InfoList, InfoItem, MetaContent, SectionSpacer, AvatarDivController, SatusDivController, StatusList, StatusDiv, HeaderStatusController, StatusController, StatusHeader, StatusBarWrapper, StatusBarFill, InfoControllers, TitleDiv, TagItem, TagList, RelatedLink, HistoryWrapper, HistoryModalOverlay, HistoryModalSheet, HistoryModalHeader, HistoryModalTitle, HistoryModalClose, HistoryModalContent, InfoSpan, BottomInfoLeft, BottomInfoRight, StoryWithImage, StoryImage, HudCornerEl, HudTopLine, HudBottomLine, HudLeftLine, HudRightLine, StatusTopLine, StatusBottomLine, StatusLeftLine, StatusRightLine, BackgroundVideoContainer, BackgroundVideo, BackgroundOverlay, HexagonHud, HexagonBackground, HexagonBorder, HexagonContent, HexagonValue, PageController, PageLoadingState, SectionRow, InventoryList, LoadBar, LoadProgress, ImplantGrid, ImplantMods, SkillGrid, AbilityDescription, AbilityPair, AbilityCard, CooldownBar, CooldownFill, ItemDescriptionPreview, ItemDescriptionLayout, ItemDetailsBody, ViewMoreButton, DetailAttributes, DetailAttribute, DetailTextPair, DetailText, ItemDescriptionImage } from './PersonagemPage.style';
import { PersonagemRichText, FlexRow, MutedText, BoldLabel, ItemThumb, ItemPlaceholder, GalleryToggle, GalleryContent, MaskIcon, AuthorIcon, ItemRow, FlexFill } from './PersonagemPage.style';
import glassHeart from '../../assets/svg/glass-heart.svg';
import rollingEnergy from '../../assets/svg/rolling-energy.svg';
import electric from '../../assets/svg/electric.svg';
import upgrade from '../../assets/svg/upgrade.svg';
import { RichTextDisplay } from '../../components/Generic/RichTextDisplay/RichTextDisplay';
import { normalizeImagePath } from '../Wiki/utils/imagePathHelper';
import { ClipBox } from '../../components/Generic/ClipBox/ClipBox';
import { AvatarIcon } from '../../components/Generic/AvatarIcon/AvatarIcon';
import TitleGlitch from '../../components/Generic/TitleGlitch/TitleGlitch';
import { getCidadeById } from '../../services/cidadesService';
import { getRacaById } from '../../services/racasService';
import { GalleryBlock } from '../Wiki/components/blocks/GalleryBlock/GalleryBlock';
import { PageBlockType } from '../../models/Pages';
import { normalizeGalleryImages } from '../../models/GalleryImage';
import village from '../../assets/svg/village.svg';
import scales from '../../assets/svg/scales.svg';
import dna1 from '../../assets/svg/dna1.svg';
import { SpanLink } from '../../components/Generic/SpanLink/SpanLink';
import { getPersonagensByIds } from '../../services/personagensService';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import backgroundVideo from '../../assets/backgroundLinesScifiAnimation.mp4';
import { ScrollRevealBlock } from '../../components/Generic/ScrollRevealBlock';
import { getInventarioItems, getProtesesItems } from '../../utils/itemInventorySections';
import { Item } from '../../models/Itens';
import { getItensByIds } from '../../services/itensService';
import { getItemImage } from '../../utils/getItemImage';
import { ColorScheme, getColorVars } from '../../utils/getColorVars';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';
import { ListModal } from '../../components/Generic/ListModal';
import { BiChevronDown } from 'react-icons/bi';
import { DEFAULT_MAX_CHARACTER_LEVEL, getDefaultXpRequiredForLevel } from '../../utils/characterProgression';
import { Lightbox } from '../Wiki/components/blocks/shared/Lightbox/Lightbox';
import { RelatedPageLink, RelatedPages, RelatedPagesTitle } from '../Cidade/CidadePage.style';

const detailLabels: Record<string, string> = {
  curta: 'Dano Curto',
  media: 'Dano Médio',
  longa: 'Dano Longo',
  capacidade: 'Capacidade Munição',
  acerto: 'Acerto',
  dano: 'Dano',
};

const formatDetailLabel = (key: string) => detailLabels[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim();

const getAttributeEntries = (attributes: Record<string, any> | undefined, prefix = ''): Array<{ label: string; value: string }> => {
  if (!attributes) return [];

  return Object.entries(attributes).flatMap(([key, value]) => {
    if (key.startsWith('__') || key.toLowerCase().includes('efeitorichtext') || ['atual', 'ataquesPorTurno', 'especial', 'especiais'].includes(key) || value === undefined || value === null || value === '' || value === false || value === 0 || (Array.isArray(value) && value.length === 0)) return [];
    const label = ['danoPorAlcance', 'municao'].includes(key) ? prefix : (prefix ? `${prefix} ${formatDetailLabel(key)}` : formatDetailLabel(key));

    if (typeof value === 'object' && !Array.isArray(value)) return getAttributeEntries(value, label);

    return [{ label, value: Array.isArray(value) ? value.join(', ') : String(value) }];
  });
};

type InventarioItemProps = {
  item: any;
  itemBaseImage?: string;
  onOpenDescription: (item: Item) => void;
  colorScheme?: ColorScheme;
};

const InventarioItem: React.FC<InventarioItemProps> = ({ item, itemBaseImage, onOpenDescription, colorScheme = 'blue' }) => {
  const nomeItem = item.nome ?? item.nomeItem ?? item.titulo ?? String(item);
  const quantidade = item.quantidade ?? item.qtd ?? item.qtde ?? null;
  const imagem = getItemImage(item, itemBaseImage ? { imagem: itemBaseImage } : undefined);
  const { color, clearColor } = getColorVars(colorScheme);

  return (
    <ItemRow $clickable={Boolean(item.descricao)} $color={color} $clearColor={clearColor} onClick={() => item.descricao && onOpenDescription(item)}>
      {imagem ? (
        <ItemThumb $color={color} $clearColor={clearColor} src={normalizeImagePath(imagem)} alt={nomeItem} />
      ) : (
        <ItemPlaceholder $color={color} $clearColor={clearColor} aria-label="Item sem imagem"><Inventory2OutlinedIcon /></ItemPlaceholder>
      )}
      <FlexFill>
        <BoldLabel $color={color}>{nomeItem}</BoldLabel>
        {item.descricao && <ItemDescriptionPreview><RichTextDisplay content={item.descricao} /></ItemDescriptionPreview>}
      </FlexFill>
      <MutedText>{quantidade ? `x${quantidade}` : ''}</MutedText>
    </ItemRow>
  );
};

const ImplantItem: React.FC<{ item: Item; itemBaseImage?: string; onOpenDescription?: (item: Item) => void }> = ({ item, itemBaseImage, onOpenDescription }) => {
  const attributes = item.atributos as { material?: string; modificacoes?: Array<{ nome: string }>; lacrimas?: Array<{ nome: string }> } | undefined;
  const mods = [...(attributes?.modificacoes ?? []), ...(attributes?.lacrimas ?? [])];
  const imagem = getItemImage(item, itemBaseImage ? { imagem: itemBaseImage } : undefined);
  const hasDetails = Boolean(item.descricao || Object.values((attributes ?? {}) as Record<string, unknown>).some((value) => value !== undefined && value !== null && value !== '' && value !== false));

  return (
    <ItemRow $clickable={Boolean(onOpenDescription && hasDetails)} $color="var(--neonPurple)" $clearColor="var(--clearneonPurple)" onClick={() => onOpenDescription && hasDetails && onOpenDescription(item)}>
      {imagem ? <ItemThumb $color="var(--neonPurple)" $clearColor="var(--clearneonPurple)" src={normalizeImagePath(imagem)} alt={item.nome} /> : <ItemPlaceholder $color="var(--neonPurple)" $clearColor="var(--clearneonPurple)" aria-label="Implante sem imagem"><Inventory2OutlinedIcon /></ItemPlaceholder>}
      <FlexFill>
      <BoldLabel $color="var(--neonPurple)">{item.nome || 'Implante sem nome'}</BoldLabel>
      {item.descricao && <ItemDescriptionPreview><RichTextDisplay content={item.descricao} /></ItemDescriptionPreview>}
      <ImplantMods>{mods.length > 0 ? mods.map((mod, index) => <span key={`${mod.nome}-${index}`}>◊ {mod.nome}</span>) : 'Sem modificacoes'}</ImplantMods>
      </FlexFill>
    </ItemRow>
  );
};

type AbilityItemProps = {
  ability: any;
  index: number;
  type: 'skills' | 'magias' | 'proficiencias';
  color: string;
  onOpenDescription?: (item: Item) => void;
};

const getAbilityEffect = (ability: any) => (
  ability?.efeito
  ?? ability?.descricao
  ?? ability?.atributos?.__efeitoRichText
  ?? ability?.atributos?.efeitoRichText
);

const AbilityItem: React.FC<AbilityItemProps> = ({ ability, index, type, color, onOpenDescription }) => {
  const effect = getAbilityEffect(ability);
  const clearColor = type === 'skills'
    ? 'var(--clearneonCyan)'
    : type === 'proficiencias'
      ? 'var(--clearneonRed)'
      : 'var(--clearneonPurple)';
  const fallbackName = type === 'skills' ? 'Skill' : type === 'magias' ? 'Magia' : 'Proficiência';

  return (
    <ItemRow $clickable={Boolean(onOpenDescription)} $color={color} $clearColor={clearColor} onClick={() => onOpenDescription?.({ ...ability, __detailType: type === 'proficiencias' ? 'proficiency' : 'ability', descricao: type === 'proficiencias' ? ability.descricao : '', tipo: 'outro', quantidade: 1 } as Item)}>
      <FlexFill>
      <BoldLabel $color={color}>{ability.nome ?? ability.titulo ?? `${fallbackName} ${index + 1}`}</BoldLabel>
      {effect ? <ItemDescriptionPreview><RichTextDisplay content={effect} /></ItemDescriptionPreview> : <ItemDescriptionPreview>Sem efeito registrado.</ItemDescriptionPreview>}
      </FlexFill>
    </ItemRow>
  );
};

const hasRichTextValue = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return false;
    try { return hasRichTextValue(JSON.parse(trimmed)); } catch { return true; }
  }
  if (Array.isArray(value)) return value.some(hasRichTextValue);
  if (typeof value === 'object') {
    if (typeof value.text === 'string' && value.text.trim()) return true;
    return Array.isArray(value.content) && value.content.some(hasRichTextValue);
  }
  return false;
};

const hasMeaningfulAbilityAttribute = (value: any): boolean => {
  if (value === null || value === undefined || value === false || value === 0) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.some(hasMeaningfulAbilityAttribute);
  if (typeof value === 'object') return Object.values(value).some(hasMeaningfulAbilityAttribute);
  return true;
};

const isMeaningfulAbility = (ability: any) => Boolean(
  ability
  && (
    String(ability.nome ?? ability.titulo ?? '').trim()
    || hasRichTextValue(getAbilityEffect(ability))
    || hasMeaningfulAbilityAttribute(ability.atributos)
  )
);

type HudContentSectionProps = {
  title: string;
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  color: string;
  clearColor: string;
  children: React.ReactNode;
};

const HudContentSection: React.FC<HudContentSectionProps> = ({
  title,
  theme,
  neon,
  color,
  clearColor,
  children,
}) => (
  <CardContent gap={12} neon={neon} $color={color}>
    <HudCornerEl $position="top-left" $color={color} $clearColor={clearColor} $neon={neon === 'on'} />
    <HudCornerEl $position="top-right" $color={color} $clearColor={clearColor} $neon={neon === 'on'} />
    <HudCornerEl $position="bottom-left" $color={color} $clearColor={clearColor} $neon={neon === 'on'} />
    <HudCornerEl $position="bottom-right" $color={color} $clearColor={clearColor} $neon={neon === 'on'} />
    <HudTopLine $isActive={neon === 'on'} $color={color} $clearColor={clearColor} $neon={neon === 'on'} />
    <HudBottomLine $isActive={neon === 'on'} $color={color} $clearColor={clearColor} $neon={neon === 'on'} />
    <HudLeftLine $isActive={neon === 'on'} $color={color} $clearColor={clearColor} $neon={neon === 'on'} />
    <HudRightLine $isActive={neon === 'on'} $color={color} $clearColor={clearColor} $neon={neon === 'on'} />
    <TitleGlitch theme={theme} neon={neon} text={title} fontSize="20px" colorOverride={color} />
    {children}
  </CardContent>
);

const PersonagemPage: React.FC = () => {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const id = params.id;
  const characterSource = searchParams.get('tipo') === 'jogador' ? 'player' : 'public';
  const { loading, error, personagem, relatedPages } = usePersonagem(id, characterSource);
  const { theme, neon } = useSelector((state: any) => state.themesReducer);
  const getField = (obj: any, keys: string[]) => {
    if (!obj) return undefined;
    for (const k of keys) {
      const v = obj[k];
      if (v !== undefined && v !== null && String(v).toString().trim() !== '') return v;
    }
    return undefined;
  };

  const [cidadeNome, setCidadeNome] = React.useState<string | null>(null);
  const [cidadeImagem, setCidadeImagem] = React.useState<string | null>(null);
  const [racaNome, setRacaNome] = React.useState<string | null>(null);
  const [personagensVinculadosNomes, setPersonagensVinculadosNomes] = React.useState<{ id: number; nome: string }[]>([]);
  const [galleryOpen, setGalleryOpen] = React.useState(true);
  const [mainImageOpen, setMainImageOpen] = React.useState(false);
  const [historyModalOpen, setHistoryModalOpen] = React.useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = React.useState<Item | null>(null);
  const [activeAbilityTab, setActiveAbilityTab] = React.useState<'skills' | 'magias'>('skills');
  const [itemBaseImages, setItemBaseImages] = React.useState<Record<string, string>>({});
  const [listModal, setListModal] = React.useState<'inventory' | 'implants' | 'abilities' | 'proficiencies' | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const fetchRelated = async () => {
      try {
        const idCidade = getField(personagem, ['idcidade', 'Idcidade', 'idCidade', 'idcidade']) as any;
        if (idCidade) {
          const res: any = await getCidadeById(Number(idCidade));
          const cidade = res?.cidade ?? res;
          if (mounted && cidade) {
            setCidadeNome(cidade.nome ?? null);
            setCidadeImagem(cidade.imagem ?? null);
          }
        }
        const idRaca = getField(personagem, ['idraca', 'Idraca', 'idRaca']) as any;
        
        if (idRaca) {
          const rr: any = await getRacaById(Number(idRaca));
          const raca = rr?.raca ?? rr;
          if (mounted && raca) {
            setRacaNome(raca.nome ?? null);
          }
        }

        const vinculados = (personagem as any)?.personagemsVinculados;
        if (Array.isArray(vinculados) && vinculados.length > 0) {
          const res = await getPersonagensByIds(vinculados);
          if (mounted && Array.isArray(res)) {
            const nomes = res.map((p: any) => ({
              id: Number(p.idpersonagem ?? p.id),
              nome: p.nome ?? 'Sem nome'
            }));
            setPersonagensVinculadosNomes(nomes);
          }
        }
      } catch (e) {
        // fail silently
      }
    };
    fetchRelated();
    return () => { mounted = false; };
  }, [personagem]);

  React.useEffect(() => {
    const inventory = Array.isArray((personagem as any)?.inventarioJson)
      ? (personagem as any).inventarioJson as Item[]
      : [];
    const itemBaseIds = [...new Set(inventory.map((item) => item.idItemBase).filter(Boolean))] as string[];

    if (itemBaseIds.length === 0) {
      setItemBaseImages({});
      return;
    }

    let active = true;
    getItensByIds(itemBaseIds)
      .then((items) => {
        if (!active) return;

        setItemBaseImages(items.reduce<Record<string, string>>((images, item) => {
          if (item.iditem && item.imagem) images[item.iditem] = item.imagem;
          return images;
        }, {}));
      })
      .catch(() => {
        if (active) setItemBaseImages({});
      });

    return () => { active = false; };
  }, [personagem]);

  React.useEffect(() => {
    if (!historyModalOpen && !selectedInventoryItem) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setHistoryModalOpen(false);
      setSelectedInventoryItem(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyModalOpen, selectedInventoryItem]);

  if (loading) return <PageLoadingState>Carregando personagem...</PageLoadingState>;
  if (error) return <div>Erro: {error}</div>;
  console.log("🚀 ~ PersonagemPage ~ personagem:", personagem)
  if (!personagem) return <div>Personagem não encontrado</div>;

  const nome = getField(personagem, ['nome', 'Nome']) || 'Sem nome';
  const currentLevel = Math.max(1, Math.trunc(Number((personagem as any)?.statusJson?.nivel) || 1));
  const currentXp = Math.max(0, Number((personagem as any)?.statusJson?.xp) || 0);
  const isMaximumLevel = currentLevel >= DEFAULT_MAX_CHARACTER_LEVEL;
  const xpRequiredForNextLevel = getDefaultXpRequiredForLevel(currentLevel);
  const xpPercentage = isMaximumLevel
    ? 100
    : Math.round((currentXp / xpRequiredForNextLevel) * 100);
  const imagem = getField(personagem, ['imagem', 'Imagem', 'imagemUrl', 'ImagemUrl']) as string | undefined;
  const autorNome = getField(personagem, ['autorNome', 'AutorNome']) as string | undefined;
  const historia = getField(personagem, ['historia', 'Historia']) as any | undefined;
  const hasHistory = hasRichTextValue(historia);
  const alinhamentoRaw = getField(personagem, ['alinhamento', 'Alinhamento', 'alignment']);

  const alinhamento = alinhamentoRaw
    ? String(alinhamentoRaw)
        .split('_')
        .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
        .join(' e ')
    : null;

  const costumes = (personagem as any)?.costumes;
  const costumesList = Array.isArray(costumes) && costumes.length > 0 ? costumes : null;

  const tracos = (personagem as any)?.tracos;
  const tracosList = Array.isArray(tracos) && tracos.length > 0 ? tracos : null;

  const infoExtras = (personagem as any)?.infoSecundariasJson;
  const hasInfoExtras = infoExtras && String(infoExtras).trim() !== '';

  const vinculados = (personagem as any)?.personagemsVinculados;
  const hasVinculados = Array.isArray(vinculados) && vinculados.length > 0;

  const tags = (personagem as any)?.tags;
  const tagsList = Array.isArray(tags) && tags.length > 0 ? tags : null;
  const hasInformation = Boolean(tagsList || costumesList || hasVinculados || tracosList || hasInfoExtras);

  const rawItems = (personagem as any)?.inventarioJson;
  const allItems: Item[] = Array.isArray(rawItems) ? rawItems : [];
  const inventoryItems = getInventarioItems(allItems);
  const implantItems = getProtesesItems(allItems);
  const currentLoad = inventoryItems.reduce((total, item) => (
    total + (Number(item.peso) || 0) * (Number(item.quantidade) || 1)
  ), 0);
  const loadCapacity = Number((personagem as any)?.statusJson?.status?.capacidadeCarga) || 150;
  const loadPercentage = Math.round((currentLoad / loadCapacity) * 100);
  const isOverloaded = currentLoad > loadCapacity;

  const rawGallery = (personagem as any)?.galeriaImagem;
  const galleryImages = normalizeGalleryImages(rawGallery);
  const skills = Array.isArray((personagem as any)?.skills) ? (personagem as any).skills.filter(isMeaningfulAbility) : [];
  const magias = Array.isArray((personagem as any)?.magia) ? (personagem as any).magia.filter(isMeaningfulAbility) : [];
  const proficiencias = Array.isArray((personagem as any)?.proficiencias)
    ? (personagem as any).proficiencias.filter((proficiencia: any) => String(proficiencia?.nome ?? '').trim())
    : [];
  const activeAbilities = activeAbilityTab === 'skills' ? skills : magias;
  const activeAbilityColor = activeAbilityTab === 'skills' ? 'var(--neonCyan)' : 'var(--neonPurple)';
  const visibleInventoryItems = inventoryItems.slice(0, 4);
  const visibleImplantItems = implantItems.slice(0, 4);
  const visibleAbilities = activeAbilities.slice(0, 6);
  const visibleSkills = skills.slice(0, 6);
  const visibleMagias = magias.slice(0, 6);
  const visibleProficiencias = proficiencias.slice(0, 6);

  const passiva = (personagem as any)?.passiva ?? (personagem as any)?.idpassiva;
  const hasPassiva = typeof passiva === 'number'
    ? passiva > 0
    : isMeaningfulAbility(passiva);
  const passivaNome = typeof passiva === 'object'
    ? (passiva?.nome ?? passiva?.titulo ?? 'Passiva')
    : passiva ? `Passiva ${passiva}` : 'Nenhuma passiva registrada';
  const passivaDescricao = typeof passiva === 'object'
    ? (passiva?.descricao ?? passiva?.efeito ?? 'Sem descricao registrada.')
    : 'Sem descricao registrada.';
  const ultimate = (personagem as any)?.ultimate;
  const hasUltimate = typeof ultimate === 'string'
    ? ultimate.trim().length > 0
    : isMeaningfulAbility(ultimate);
  const ultimateNome = typeof ultimate === 'object'
    ? (ultimate?.nome ?? ultimate?.titulo ?? 'Ultimate')
    : ultimate || 'Nenhuma ultimate registrada';
  const ultimateDescricao = typeof ultimate === 'object'
    ? (ultimate?.descricao ?? ultimate?.efeito ?? 'Sem descricao registrada.')
    : 'Sem descricao registrada.';
  const cooldownValue = Number((personagem as any)?.cooldownUltimate ?? ultimate?.cooldown) || 0;
  const selectedInventoryItemImage = selectedInventoryItem
    ? getItemImage(selectedInventoryItem, selectedInventoryItem.idItemBase ? { imagem: itemBaseImages[selectedInventoryItem.idItemBase] } : undefined)
    : undefined;
  const selectedDescription = selectedInventoryItem?.descricao;
  const isSelectedAbility = (selectedInventoryItem as any)?.__detailType === 'ability';
  const selectedEffect = isSelectedAbility
    ? getAbilityEffect(selectedInventoryItem)
    : selectedInventoryItem?.efeito;
  const selectedSpecial = (selectedInventoryItem?.atributos as any)?.especial ?? (selectedInventoryItem?.atributos as any)?.especiais?.filter(Boolean).join(', ');
  const selectedAttributeEntries = getAttributeEntries(selectedInventoryItem?.atributos as Record<string, any> | undefined);
  const selectedAbilityEntries = isSelectedAbility ? [
    Array.isArray((selectedInventoryItem as any)?.elemento) && (selectedInventoryItem as any).elemento.length > 0
      ? { label: 'Elemento', value: (selectedInventoryItem as any).elemento.join(', ') }
      : null,
    (selectedInventoryItem as any)?.custo !== undefined && (selectedInventoryItem as any).custo !== ''
      ? { label: 'Custo', value: String((selectedInventoryItem as any).custo) }
      : null,
    (selectedInventoryItem as any)?.nivel !== undefined && (selectedInventoryItem as any).nivel !== ''
      ? { label: 'Nivel', value: String((selectedInventoryItem as any).nivel) }
      : null,
  ].filter((entry): entry is { label: string; value: string } => entry !== null) : [];
  const detailAttributeEntries = [...selectedAttributeEntries, ...selectedAbilityEntries];

                console.log("🚀 ~ PersonagemPage ~ visibleAbilities:", visibleAbilities)
  return (
    <PageContainer>
        <BackgroundVideoContainer>
          <BackgroundVideo
            src={backgroundVideo}
            autoPlay
            loop
            muted
            playsInline
          />
          <BackgroundOverlay />
        </BackgroundVideoContainer>
        <PageController>
        <ClipBox theme={theme} neon={neon} width="100%" height="auto" useClip={false} borderRadius="8px" zIndex={1}>
            <TopSection>
                <AvatarDivController>
                    <AvatarWrapper>
                        <AvatarIcon
                          theme={theme}
                          neon={neon}
                          initialImage={imagem ? normalizeImagePath(imagem) : ''}
                          size={250}
                          clickable={Boolean(imagem)}
                          onClick={() => setMainImageOpen(true)}
                        />
                    </AvatarWrapper>

                    <CardContent maxWidth='320px' neon={neon}>
                      <HudCornerEl $position="top-left" $neon={neon === 'on'} />
                      <HudCornerEl $position="top-right" $neon={neon === 'on'} />
                      <HudCornerEl $position="bottom-left" $neon={neon === 'on'} />
                      <HudCornerEl $position="bottom-right" $neon={neon === 'on'} />
                      <HudTopLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                      <HudBottomLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                      <HudLeftLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                      <HudRightLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                      <InfoControllers>
                        <TitleDiv>
                            <TitleGlitch theme={theme} neon={neon} text={nome} fontSize="20px" />
                        </TitleDiv>
                        <MetaRow>
                            <HeaderStatusController>
                                <MetaContent as={FlexRow} gap={12} alignItems="flex-start">
                                  <FlexRow gap={8}>
                                    <MaskIcon src={dna1} color={'var(--neonBlue)'} size={20} />
                                    <BoldLabel>Raça:</BoldLabel> {racaNome ?? (personagem as any).racaNome ?? ((personagem as any).idraca ?? '—')}
                                  </FlexRow>
                                  <FlexRow gap={8}>
                                    <MaskIcon src={village} color={'var(--neonBlue)'} size={20} />
                                    <BoldLabel>Cidade:</BoldLabel> {cidadeNome ?? (personagem as any).cidadeNome ?? ((personagem as any).idcidade ?? '—')}
                                  </FlexRow>
                                  <FlexRow gap={8}>
                                    <MaskIcon src={scales} color={'var(--neonBlue)'} size={20} />
                                    <BoldLabel>Alinhamento:</BoldLabel> {alinhamento ?? '—'}
                                  </FlexRow>
                                  {autorNome && (
                                    <FlexRow gap={8}>
                                      <AuthorIcon aria-hidden="true">
                                        <AccountCircleOutlinedIcon />
                                      </AuthorIcon>
                                      <BoldLabel>Autor:</BoldLabel> {autorNome}
                                    </FlexRow>
                                  )}
                                </MetaContent>
                            </HeaderStatusController>
                        </MetaRow>
                      </InfoControllers>
                    </CardContent>
                </AvatarDivController>
                <SatusDivController>
                    <StatusController>
                        <TitleGlitch theme={theme} neon={neon} text={"Status"} fontSize="20px" />
                        <StatusList>
                            <StatusHeader>
                                <StatusDiv>
                                  <HudCornerEl $position="top-left" $color="var(--neonRed)" $clearColor="var(--clearneonRed)" $neon={neon === 'on'} />
                                  <HudCornerEl $position="bottom-right" $color="var(--neonRed)" $clearColor="var(--clearneonRed)" $neon={neon === 'on'} />
                                  <StatusTopLine $isActive={neon === 'on'} $color="var(--neonRed)" $clearColor="var(--clearneonRed)" $neon={neon === 'on'} />
                                  <StatusBottomLine $isActive={neon === 'on'} $color="var(--neonRed)" $clearColor="var(--clearneonRed)" $neon={neon === 'on'} />
                                  <StatusLeftLine $isActive={neon === 'on'} $color="var(--neonRed)" $clearColor="var(--clearneonRed)" $neon={neon === 'on'} />
                                  <StatusRightLine $isActive={neon === 'on'} $color="var(--neonRed)" $clearColor="var(--clearneonRed)" $neon={neon === 'on'} />
                                  <MaskIcon src={glassHeart} color={'var(--neonRed)'} size={64} />
                                  <div>
                                    <BoldLabel>Vida</BoldLabel>
                                    <MutedText>{(personagem as any)?.statusJson?.status?.vida ?? '—'} / {(personagem as any)?.statusJson?.status?.vidaMaxima ?? '—'}</MutedText>
                                    <StatusBarWrapper $color="var(--neonRed)">
                                      <StatusBarFill $color={'var(--neonRed)'} $pct={Math.round(((Number((personagem as any)?.statusJson?.status?.vida) || 0) / (Number((personagem as any)?.statusJson?.status?.vidaMaxima) || 1)) * 100)} />
                                    </StatusBarWrapper>
                                  </div>
                                </StatusDiv>
                                <StatusDiv>
                                  <HudCornerEl $position="top-left" $color="var(--neonBlue)" $clearColor="var(--clearneonBlue)" $neon={neon === 'on'} />
                                  <HudCornerEl $position="bottom-right" $color="var(--neonBlue)" $clearColor="var(--clearneonBlue)" $neon={neon === 'on'} />
                                  <StatusTopLine $isActive={neon === 'on'} $color="var(--neonBlue)" $clearColor="var(--clearneonBlue)" $neon={neon === 'on'} />
                                  <StatusBottomLine $isActive={neon === 'on'} $color="var(--neonBlue)" $clearColor="var(--clearneonBlue)" $neon={neon === 'on'} />
                                  <StatusLeftLine $isActive={neon === 'on'} $color="var(--neonBlue)" $clearColor="var(--clearneonBlue)" $neon={neon === 'on'} />
                                  <StatusRightLine $isActive={neon === 'on'} $color="var(--neonBlue)" $clearColor="var(--clearneonBlue)" $neon={neon === 'on'} />
                                  <MaskIcon src={rollingEnergy} color={neon === 'on' ? 'var(--clearneonBlue)' : 'var(--neonBlue)'} size={64} />
                                  <div>
                                    <BoldLabel>Mana</BoldLabel>
                                    <MutedText>{(personagem as any)?.statusJson?.status?.mana ?? '—'} / {(personagem as any)?.statusJson?.status?.manaMaxima ?? '—'}</MutedText>
                                    <StatusBarWrapper $color="var(--neonBlue)">
                                      <StatusBarFill $color={'var(--neonBlue)'} $pct={Math.round(((Number((personagem as any)?.statusJson?.status?.mana) || 0) / (Number((personagem as any)?.statusJson?.status?.manaMaxima) || 1)) * 100)} />
                                    </StatusBarWrapper>
                                  </div>
                                </StatusDiv>
                            </StatusHeader>

                            <StatusHeader>
                                <StatusDiv>
                                  <HudCornerEl $position="top-left" $color="var(--neonGreen)" $clearColor="var(--clearneonGreen)" $neon={neon === 'on'} />
                                  <HudCornerEl $position="bottom-right" $color="var(--neonGreen)" $clearColor="var(--clearneonGreen)" $neon={neon === 'on'} />
                                  <StatusTopLine $isActive={neon === 'on'} $color="var(--neonGreen)" $clearColor="var(--clearneonGreen)" $neon={neon === 'on'} />
                                  <StatusBottomLine $isActive={neon === 'on'} $color="var(--neonGreen)" $clearColor="var(--clearneonGreen)" $neon={neon === 'on'} />
                                  <StatusLeftLine $isActive={neon === 'on'} $color="var(--neonGreen)" $clearColor="var(--clearneonGreen)" $neon={neon === 'on'} />
                                  <StatusRightLine $isActive={neon === 'on'} $color="var(--neonGreen)" $clearColor="var(--clearneonGreen)" $neon={neon === 'on'} />
                                  <MaskIcon src={electric} color={'var(--neonGreen)'} size={64} />
                                  <div>
                                    <BoldLabel>Estamina</BoldLabel>
                                    <MutedText>{(personagem as any)?.statusJson?.status?.estamina ?? '—'} / {(personagem as any)?.statusJson?.status?.estaminaMaxima ?? '—'}</MutedText>
                                    <StatusBarWrapper $color="var(--neonGreen)">
                                      <StatusBarFill $color={'var(--neonGreen)'} $pct={Math.round(((Number((personagem as any)?.statusJson?.status?.estamina) || 0) / (Number((personagem as any)?.statusJson?.status?.estaminaMaxima) || 1)) * 100)} />
                                    </StatusBarWrapper>
                                  </div>
                                </StatusDiv>
                                <StatusDiv>
                                  <HudCornerEl $position="top-left" $color="var(--neonYellow)" $clearColor="var(--clearneonYellow)" $neon={neon === 'on'} />
                                  <HudCornerEl $position="bottom-right" $color="var(--neonYellow)" $clearColor="var(--clearneonYellow)" $neon={neon === 'on'} />
                                  <StatusTopLine $isActive={neon === 'on'} $color="var(--neonYellow)" $clearColor="var(--clearneonYellow)" $neon={neon === 'on'} />
                                  <StatusBottomLine $isActive={neon === 'on'} $color="var(--neonYellow)" $clearColor="var(--clearneonYellow)" $neon={neon === 'on'} />
                                  <StatusLeftLine $isActive={neon === 'on'} $color="var(--neonYellow)" $clearColor="var(--clearneonYellow)" $neon={neon === 'on'} />
                                  <StatusRightLine $isActive={neon === 'on'} $color="var(--neonYellow)" $clearColor="var(--clearneonYellow)" $neon={neon === 'on'} />
                                  <MaskIcon src={upgrade} color={'var(--neonYellow)'} size={64} />
                                  <div>
                                    <BoldLabel>Xp</BoldLabel>
                                    <MutedText>{isMaximumLevel ? `Nível máximo · ${currentXp} XP` : `${currentXp} / ${xpRequiredForNextLevel}`}</MutedText>
                                    <StatusBarWrapper $color="var(--neonYellow)">
                                      <StatusBarFill $color={'var(--neonYellow)'} $pct={xpPercentage} />
                                    </StatusBarWrapper>
                                  </div>
                                </StatusDiv>
                            </StatusHeader>
                        </StatusList>
                        <HexagonHud>
                          <HexagonBackground />
                          <HexagonContent>
                            <BoldLabel>Nível</BoldLabel>
                            <HexagonValue>{currentLevel}</HexagonValue>
                          </HexagonContent>
                          <HexagonBorder $neon={neon === 'on'} />
                        </HexagonHud>
                    </StatusController>
                </SatusDivController>
            </TopSection>
            {(hasInformation || hasHistory) && (
            <BottomSection>
                {hasInformation && <BottomInfoLeft>
                  <CardContent gap={5} neon={neon}>
                    <HudCornerEl $position="top-left" $neon={neon === 'on'} />
                    <HudCornerEl $position="top-right" $neon={neon === 'on'} />
                    <HudCornerEl $position="bottom-left" $neon={neon === 'on'} />
                    <HudCornerEl $position="bottom-right" $neon={neon === 'on'} />
                    <HudTopLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <HudBottomLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <HudLeftLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <HudRightLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <TitleGlitch theme={theme} neon={neon} text={"Informacoes"} fontSize="20px" />
                      {tagsList && (
                        <HeaderStatusController>
                            <InfoList>
                                <InfoItem>
                                  <BoldLabel>Tags:</BoldLabel>{' '}
                                  <InfoSpan>{tagsList.map((tag: string, idx: number) => (
                                    <React.Fragment key={idx}>
                                      {idx > 0 && <span> | </span>}
                                      {tag}
                                    </React.Fragment>
                                  ))}
                                  </InfoSpan>
                                </InfoItem>
                            </InfoList>
                        </HeaderStatusController>
                      )}

                      {costumesList && (
                        <HeaderStatusController>
                            <InfoList>
                                <InfoItem>
                                  <BoldLabel>Costumes:</BoldLabel>{' '}
                                  {costumesList.map((c: string, idx: number) => (
                                    <React.Fragment key={idx}>
                                      {idx > 0 && <span> | </span>}
                                      {c}
                                    </React.Fragment>
                                  ))}
                                </InfoItem>
                            </InfoList>
                        </HeaderStatusController>
                      )}

                      {hasVinculados && (
                        <HeaderStatusController>
                            <InfoList>
                                <InfoItem>
                                  <BoldLabel>Personagens Relacionados:</BoldLabel>{' '}
                                  {personagensVinculadosNomes.length > 0 ? (
                                    personagensVinculadosNomes.map((p, idx) => (
                                      <React.Fragment key={p.id}>
                                        {idx > 0 && <span> | </span>}
                                        <RelatedLink>
                                          <SpanLink
                                            theme={theme}
                                            neon={neon}
                                            colorScheme="bluePink"
                                            link={`/personagem/${p.id}`}
                                            textSize="14px"
                                            className="inline-link"
                                          >
                                            {p.nome}
                                          </SpanLink>
                                        </RelatedLink>
                                      </React.Fragment>
                                    ))
                                  ) : (
                                    <MutedText>Carregando...</MutedText>
                                  )}
                                </InfoItem>
                            </InfoList>
                        </HeaderStatusController>
                      )}

                      {tracosList && (
                        <HeaderStatusController>
                            <TagList>
                              <BoldLabel>Traços de Personalidade:</BoldLabel>
                              {tracosList.map((traco: string, idx: number) => (
                                <TagItem key={idx}>{traco}</TagItem>
                              ))}
                            </TagList>
                        </HeaderStatusController>
                      )}

                      {hasInfoExtras && (
                        <HeaderStatusController>
                            <InfoList>
                                <InfoItem><BoldLabel>Informações Extras:</BoldLabel> {infoExtras}</InfoItem>
                            </InfoList>
                        </HeaderStatusController>
                      )}
                  </CardContent>
                </BottomInfoLeft>}
                {hasHistory && <BottomInfoRight>
                  <CardContent neon={neon}>
                    <HudCornerEl $position="top-left" $neon={neon === 'on'} />
                    <HudCornerEl $position="top-right" $neon={neon === 'on'} />
                    <HudCornerEl $position="bottom-left" $neon={neon === 'on'} />
                    <HudCornerEl $position="bottom-right" $neon={neon === 'on'} />
                    <HudTopLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <HudBottomLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <HudLeftLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <HudRightLine $isActive={neon === 'on'} $neon={neon === 'on'} />
                    <TitleGlitch theme={theme} neon={neon} text={"Historia"} fontSize="20px" />
                      <StoryWithImage cityImage={cidadeImagem}>
                        <HistoryWrapper onClick={() => setHistoryModalOpen(true)}>
                          <PersonagemRichText>
                          <div className="ProseMirror">
                              <RichTextDisplay content={historia} />
                          </div>
                          </PersonagemRichText>
                        </HistoryWrapper>
                        {cidadeImagem && <StoryImage src={normalizeImagePath(cidadeImagem)} alt={cidadeNome ?? 'Cidade'} />}
                      </StoryWithImage>
                  </CardContent>
                </BottomInfoRight>}
            </BottomSection>
            )}
        </ClipBox>
        </PageController>

        {historyModalOpen && historia && createPortal(
          <HistoryModalOverlay onClick={(e) => { if (e.target === e.currentTarget) setHistoryModalOpen(false); }}>
            <HistoryModalSheet theme={theme} neon={neon}>
              <HistoryModalHeader theme={theme} neon={neon}>
                <HistoryModalTitle theme={theme} neon={neon}>Historia</HistoryModalTitle>
                <HistoryModalClose theme={theme} neon={neon} onClick={() => setHistoryModalOpen(false)} title="Fechar">
                  <CloseIcon />
                </HistoryModalClose>
              </HistoryModalHeader>
              <HistoryModalContent theme={theme} neon={neon}>
                <div className="ProseMirror">
                  <RichTextDisplay content={historia} />
                </div>
                {relatedPages.length > 0 && (
                  <RelatedPages>
                    <RelatedPagesTitle>PÃ¡ginas que fazem referÃªncia a este personagem</RelatedPagesTitle>
                    {relatedPages.map((page) => (
                      <RelatedPageLink key={page.idPage ?? page.slug} to={`/wiki/${encodeURIComponent(page.slug)}`}>
                        <span>{page.titulo}</span>
                      </RelatedPageLink>
                    ))}
                  </RelatedPages>
                )}
              </HistoryModalContent>
            </HistoryModalSheet>
          </HistoryModalOverlay>,
          document.getElementById('modal-root') || document.body
        )}

        {selectedInventoryItem && createPortal(
          <HistoryModalOverlay onClick={(event) => { if (event.target === event.currentTarget) setSelectedInventoryItem(null); }}>
            <HistoryModalSheet theme={theme} neon={neon}>
              <HistoryModalHeader theme={theme} neon={neon}>
                <HistoryModalTitle theme={theme} neon={neon}>{selectedInventoryItem.nome}</HistoryModalTitle>
                <HistoryModalClose theme={theme} neon={neon} onClick={() => setSelectedInventoryItem(null)} title="Fechar" aria-label="Fechar descrição do item" autoFocus>
                  <CloseIcon />
                </HistoryModalClose>
              </HistoryModalHeader>
              <HistoryModalContent theme={theme} neon={neon}>
                <ItemDescriptionLayout $withoutMedia={isSelectedAbility || !selectedInventoryItemImage}>
                  {!isSelectedAbility && selectedInventoryItemImage && (
                    <ItemDescriptionImage src={normalizeImagePath(selectedInventoryItemImage)} alt={selectedInventoryItem.nome} />
                  )}
                  <ItemDetailsBody>
                    {selectedDescription && <div className="ProseMirror"><RichTextDisplay content={selectedDescription} /></div>}
                    {isSelectedAbility && selectedEffect && <DetailText><BoldLabel>EFEITO</BoldLabel><RichTextDisplay content={selectedEffect} /></DetailText>}
                    {(detailAttributeEntries.length > 0 || selectedSpecial) && (
                      <DetailAttributes $inline={isSelectedAbility}>
                        {detailAttributeEntries.map((entry) => <DetailAttribute key={`${entry.label}-${entry.value}`}><span>{entry.label}</span><strong>{entry.value}</strong></DetailAttribute>)}
                        {selectedSpecial && <DetailAttribute className="detail-special"><span>Especial</span><strong>{selectedSpecial}</strong></DetailAttribute>}
                      </DetailAttributes>
                    )}
                  </ItemDetailsBody>
                </ItemDescriptionLayout>
                {!isSelectedAbility && selectedEffect && selectedEffect !== selectedDescription && (
                  <DetailTextPair>
                    {selectedEffect && selectedEffect !== selectedDescription && <DetailText><BoldLabel>EFEITO</BoldLabel><RichTextDisplay content={selectedEffect} /></DetailText>}
                  </DetailTextPair>
                )}
              </HistoryModalContent>
            </HistoryModalSheet>
          </HistoryModalOverlay>,
          document.getElementById('modal-root') || document.body
        )}

        {listModal === 'inventory' && (
          <ListModal
            title="INVENTARIO"
            items={inventoryItems}
            color="var(--neonBlue)"
            emptyMessage="Sem itens"
            onClose={() => setListModal(null)}
            renderItem={(item, index) => (
              <InventarioItem
                key={item.id ?? `${item.nome}-${index}`}
                item={item}
                itemBaseImage={item.idItemBase ? itemBaseImages[item.idItemBase] : undefined}
                onOpenDescription={setSelectedInventoryItem}
              />
            )}
          />
        )}

        {listModal === 'implants' && (
          <ListModal
            title="PROTESES / IMPLANTES"
            items={implantItems}
            color="var(--neonPurple)"
            emptyMessage="Sem proteses ou implantes"
            onClose={() => setListModal(null)}
            renderItem={(item, index) => <ImplantItem key={item.id ?? `${item.nome}-${index}`} item={item} itemBaseImage={item.idItemBase ? itemBaseImages[item.idItemBase] : undefined} onOpenDescription={setSelectedInventoryItem} />}
          />
        )}

        {listModal === 'abilities' && (
          <ListModal<any>
            title={activeAbilityTab === 'skills' ? 'SKILLS' : 'MAGIAS'}
            items={activeAbilities}
            color={activeAbilityColor}
            emptyMessage={activeAbilityTab === 'skills' ? 'Sem skills' : 'Sem magias'}
            onClose={() => setListModal(null)}
            renderItem={(ability, index) => <AbilityItem key={ability.id ?? `${ability.nome}-${index}`} ability={ability} index={index} type={activeAbilityTab} color={activeAbilityColor} onOpenDescription={setSelectedInventoryItem} />}
          />
        )}

        {listModal === 'proficiencies' && (
          <ListModal<any>
            title="PROFICIÊNCIAS"
            items={proficiencias}
            color="var(--neonRed)"
            emptyMessage="Sem proficiências"
            onClose={() => setListModal(null)}
            renderItem={(proficiencia, index) => (
              <AbilityItem
                key={proficiencia.idproficiencia ?? `${proficiencia.nome}-${index}`}
                ability={proficiencia}
                index={index}
                type="proficiencias"
                color="var(--neonRed)"
                onOpenDescription={setSelectedInventoryItem}
              />
            )}
          />
        )}

      <Sections>
        {galleryImages.length > 0 && <ScrollRevealBlock variant="personagemCard" threshold={0.4}>
          <SectionSpacer>
            <HudContentSection title="GALERIA" theme={theme} neon={neon} color="var(--neonBlue)" clearColor="var(--clearneonBlue)">
              <GalleryToggle
                type="button"
                onClick={() => setGalleryOpen((isOpen) => !isOpen)}
                aria-expanded={galleryOpen}
                aria-label={galleryOpen ? 'Recolher galeria' : 'Expandir galeria'}
                title={galleryOpen ? 'Recolher galeria' : 'Expandir galeria'}
              >
                <span>{galleryOpen ? 'Ocultar' : 'Mostrar'}</span>
                <BiChevronDown />
              </GalleryToggle>
              {galleryOpen && (
                <GalleryContent>
                  <GalleryBlock
                      block={{ tipo: PageBlockType.GALLERY, conteudo: { imagens: galleryImages }, ordem: 0 }}
                      blockIndex={0}
                      theme={theme}
                      neon={neon}
                  />
                </GalleryContent>
              )}
            </HudContentSection>
          </SectionSpacer>
        </ScrollRevealBlock>}

        <SectionRow>
          <ScrollRevealBlock variant="personagemCard" threshold={0.4}>
            <SectionSpacer>
              <HudContentSection title="INVENTARIO" theme={theme} neon={neon} color="var(--neonBlue)" clearColor="var(--clearneonBlue)">
                <FlexRow gap={12} alignItems="center">
                  <BoldLabel>{`${currentLoad} / ${loadCapacity} kg`}</BoldLabel>
                  <LoadBar><LoadProgress $pct={loadPercentage} $color={isOverloaded ? 'var(--neonRed)' : 'var(--neonBlue)'} /></LoadBar>
                </FlexRow>
                {inventoryItems.length > 0 ? <>
                  <InventoryList>
                    {visibleInventoryItems.map((item, index) => (
                      <InventarioItem key={item.id ?? `${item.nome}-${index}`} item={item} itemBaseImage={item.idItemBase ? itemBaseImages[item.idItemBase] : undefined} onOpenDescription={setSelectedInventoryItem} />
                    ))}
                  </InventoryList>
                  {inventoryItems.length > visibleInventoryItems.length && (
                    <ViewMoreButton $color="var(--neonBlue)" onClick={() => setListModal('inventory')}>
                      Ver mais ({inventoryItems.length - visibleInventoryItems.length} itens)
                    </ViewMoreButton>
                  )}
                </> : <MutedText>Sem itens</MutedText>}
              </HudContentSection>
            </SectionSpacer>
          </ScrollRevealBlock>

          {implantItems.length > 0 && <ScrollRevealBlock variant="personagemCard" threshold={0.4}>
            <SectionSpacer>
              <HudContentSection title="PROTESES / IMPLANTES" theme={theme} neon={neon} color="var(--neonPurple)" clearColor="var(--clearneonPurple)">
                {implantItems.length > 0 ? <>
                <ImplantGrid>
                  {visibleImplantItems.map((item, index) => {
                    return <ImplantItem key={item.id ?? `${item.nome}-${index}`} item={item} itemBaseImage={item.idItemBase ? itemBaseImages[item.idItemBase] : undefined} onOpenDescription={setSelectedInventoryItem} />;

                    /*
                    return (
                      <ImplantCard key={item.id ?? `${item.nome}-${index}`}>
                        <BoldLabel>{item.nome || 'Implante sem nome'}</BoldLabel>
                        <ImplantMaterial>{attributes?.material ?? 'material nao informado'}</ImplantMaterial>
                        <ImplantMods>{mods.length > 0 ? mods.map((mod, modIndex) => <span key={`${mod.nome}-${modIndex}`}>◆ {mod.nome}</span>) : 'Sem modificacoes'}</ImplantMods>
                      </ImplantCard>
                    );
                    */
                  })}
                </ImplantGrid>
                {implantItems.length > visibleImplantItems.length && (
                  <ViewMoreButton $color="var(--neonPurple)" onClick={() => setListModal('implants')}>
                    Ver mais ({implantItems.length - visibleImplantItems.length} itens)
                  </ViewMoreButton>
                )}
                </> : <MutedText>Sem proteses ou implantes</MutedText>}
              </HudContentSection>
            </SectionSpacer>
          </ScrollRevealBlock>}
        </SectionRow>

        <SectionRow>
        {skills.length > 0 && <ScrollRevealBlock variant="personagemCard" threshold={0.4}>
          <SectionSpacer>
            <HudContentSection title="SKILLS" theme={theme} neon={neon} color="var(--neonCyan)" clearColor="var(--clearneonCyan)">
              {skills.length > 0 ? <>
              <SkillGrid>
                {visibleSkills.map((ability: any, index: number) => {
                  return <AbilityItem key={ability.id ?? `${ability.nome}-${index}`} ability={ability} index={index} type="skills" color="var(--neonCyan)" onOpenDescription={setSelectedInventoryItem} />;

                  /*
                  return (
                    <NpcSkillCard key={ability.id ?? `${ability.nome}-${index}`} $color={activeAbilityColor}>
                      <BoldLabel>{ability.nome ?? ability.titulo ?? `${activeAbilityTab === 'skills' ? 'Skill' : 'Magia'} ${index + 1}`}</BoldLabel>
                      <AbilityDescription>{readableDescription}</AbilityDescription>
                      {(ability.custo || ability.nivel || ability.tipo) && <MutedText>{[ability.tipo, ability.custo && `Custo: ${ability.custo}`, ability.nivel && `Nivel: ${ability.nivel}`].filter(Boolean).join(' • ')}</MutedText>}
                    </NpcSkillCard>
                  );
                  */
                })}
              </SkillGrid>
              {skills.length > visibleSkills.length && (
                <ViewMoreButton $color="var(--neonCyan)" onClick={() => { setActiveAbilityTab('skills'); setListModal('abilities'); }}>
                  Ver mais ({skills.length - visibleSkills.length} itens)
                </ViewMoreButton>
              )}
              </> : <MutedText>Sem skills</MutedText>}
            </HudContentSection>
          </SectionSpacer>
        </ScrollRevealBlock>}

        {magias.length > 0 && <ScrollRevealBlock variant="personagemCard" threshold={0.4}>
          <SectionSpacer>
            <HudContentSection title="MAGIAS" theme={theme} neon={neon} color="var(--neonPurple)" clearColor="var(--clearneonPurple)">
              {magias.length > 0 ? <>
                <SkillGrid>
                  {visibleMagias.map((magia: any, index: number) => <AbilityItem key={magia.id ?? `${magia.nome}-${index}`} ability={magia} index={index} type="magias" color="var(--neonPurple)" onOpenDescription={setSelectedInventoryItem} />)}
                </SkillGrid>
                {magias.length > visibleMagias.length && (
                  <ViewMoreButton $color="var(--neonPurple)" onClick={() => { setActiveAbilityTab('magias'); setListModal('abilities'); }}>
                    Ver mais ({magias.length - visibleMagias.length} itens)
                  </ViewMoreButton>
                )}
              </> : <MutedText>Sem magias</MutedText>}
            </HudContentSection>
          </SectionSpacer>
        </ScrollRevealBlock>}

        </SectionRow>

        {proficiencias.length > 0 && (
          <SectionRow>
            <ScrollRevealBlock variant="personagemCard" threshold={0.4}>
              <SectionSpacer>
                <HudContentSection title="PROFICIÊNCIAS" theme={theme} neon={neon} color="var(--neonRed)" clearColor="var(--clearneonRed)">
                  <SkillGrid>
                    {visibleProficiencias.map((proficiencia: any, index: number) => (
                      <AbilityItem
                        key={proficiencia.idproficiencia ?? `${proficiencia.nome}-${index}`}
                        ability={proficiencia}
                        index={index}
                        type="proficiencias"
                        color="var(--neonRed)"
                        onOpenDescription={setSelectedInventoryItem}
                      />
                    ))}
                  </SkillGrid>
                  {proficiencias.length > visibleProficiencias.length && (
                    <ViewMoreButton $color="var(--neonRed)" onClick={() => setListModal('proficiencies')}>
                      Ver mais ({proficiencias.length - visibleProficiencias.length} itens)
                    </ViewMoreButton>
                  )}
                </HudContentSection>
              </SectionSpacer>
            </ScrollRevealBlock>
          </SectionRow>
        )}

        <AbilityPair>
          {hasPassiva && <ScrollRevealBlock variant="personagemCard" threshold={0.4}>
            <SectionSpacer>
              <HudContentSection title="PASSIVA" theme={theme} neon={neon} color="var(--neonGreen)" clearColor="var(--clearneonGreen)">
                <AbilityCard>
                  <BoldLabel>{passivaNome}</BoldLabel>
                  <AbilityDescription>{typeof passivaDescricao === 'string' ? passivaDescricao : 'Sem descricao registrada.'}</AbilityDescription>
                </AbilityCard>
              </HudContentSection>
            </SectionSpacer>
          </ScrollRevealBlock>}

          {hasUltimate && <ScrollRevealBlock variant="personagemCard" threshold={0.4}>
            <SectionSpacer>
              <HudContentSection title="ULTIMATE" theme={theme} neon={neon} color="var(--neonOrange)" clearColor="var(--clearneonOrange)">
                <AbilityCard>
                  <BoldLabel>{ultimateNome}</BoldLabel>
                  <AbilityDescription>{typeof ultimateDescricao === 'string' ? ultimateDescricao : 'Sem descricao registrada.'}</AbilityDescription>
                  <CooldownBar><CooldownFill $pct={cooldownValue} /></CooldownBar>
                </AbilityCard>
              </HudContentSection>
            </SectionSpacer>
          </ScrollRevealBlock>}
        </AbilityPair>

        </Sections>

        <Lightbox
          isOpen={mainImageOpen}
          images={imagem ? [{ url: normalizeImagePath(imagem), caption: nome }] : []}
          onClose={() => setMainImageOpen(false)}
        />
    </PageContainer>
  );
};

export default PersonagemPage;
