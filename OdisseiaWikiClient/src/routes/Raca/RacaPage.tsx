import { createPortal } from 'react-dom';
import CloseIcon from '@mui/icons-material/Close';
import {
  BiGitBranch,
  BiImage,
  BiImages,
  BiPackage,
  BiShield,
  BiTargetLock,
  BiUserCircle,
} from 'react-icons/bi';
import { useSelector } from 'react-redux';
import backgroundVideo from '../../assets/backgroundLinesScifiAnimation.mp4';
import electric from '../../assets/svg/electric.svg';
import glassHeart from '../../assets/svg/glass-heart.svg';
import rollingEnergy from '../../assets/svg/rolling-energy.svg';
import { ListModal } from '../../components/Generic/ListModal';
import { Modal } from '../../components/Generic/Modal/Modal';
import { OdisseiaAnimatedTitle } from '../../components/Generic/OdisseiaAnimatedTitle';
import { RichTextDisplay } from '../../components/Generic/RichTextDisplay/RichTextDisplay';
import { PersonagemPayload } from '../../services/personagensService';
import { RacaPassiva, RacaVariacao } from '../../services/racasService';
import {
  BackgroundOverlay,
  BackgroundVideo,
  BackgroundVideoContainer,
  HistoryModalClose,
  HistoryModalContent,
  HistoryModalHeader,
  HistoryModalOverlay,
  HistoryModalSheet,
  HistoryModalTitle,
  MaskIcon,
} from '../Personagem/PersonagemPage.style';
import { WikiSearchLoading } from '../Wiki/components/WikiSearchLoading/WikiSearchLoading';
import { Lightbox } from '../Wiki/components/blocks/shared/Lightbox/Lightbox';
import { normalizeImagePath } from '../Wiki/utils/imagePathHelper';
import {
  BackToWikiLink,
  CharacterAvatar,
  CharacterName,
  CityModalTitle,
  DescriptionButton,
  DetailCard,
  DetailCardBody,
  DetailCardDescription,
  DetailCardName,
  DetailList,
  EmptyDescription,
  EmptyPanel,
  GalleryButton,
  GalleryGrid,
  GalleryImage,
  GalleryModalButton,
  GalleryModalImage,
  GalleryModalTrack,
  GalleryModalViewport,
  HeroGrid,
  HeroPanel,
  HudCornerAccent,
  MiddleGrid,
  MiddlePanel,
  ModalCharacterCard,
  ModalDescription,
  ModalDetailCard,
  PageState,
  PanelHeader,
  PanelTitle,
  PassiveGlyph,
  PrimaryStats,
  RaceCharacterCard,
  RaceCharacterGrid,
  RaceIdentity,
  RaceImage,
  RaceImageButton,
  RacePageContent,
  RacePageRoot,
  RaceRevealBlock,
  RaceTag,
  RaceTagList,
  RaceTitleSlot,
  RelatedPanel,
  RelatedPageLink,
  RelatedPages,
  RelatedPagesTitle,
  RelatedSection,
  SecondaryStats,
  StatCard,
  StatHint,
  StatLabel,
  StatusArea,
  StatusHeading,
  StatValue,
  SummaryContent,
  SummaryImage,
  SummaryLayout,
  SummaryText,
  VariationThumb,
  ViewAllButton,
} from './RacaPage.style';
import { useRacaPage } from './useRacaPage';

interface ThemeReducerState {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
}

interface RootThemeState {
  themesReducer: ThemeReducerState;
}

const formatCyberpunkTitle = (value: string) => (
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
);

const HudCorners = ({ neon }: { neon: boolean }) => (
  <>
    <HudCornerAccent $position="top-right" $neon={neon} aria-hidden="true" />
    <HudCornerAccent $position="bottom-left" $neon={neon} aria-hidden="true" />
  </>
);

interface CharacterCardContentProps {
  character: PersonagemPayload;
  onSelect: (character: PersonagemPayload) => void;
  modal?: boolean;
}

const CharacterCardContent = ({ character, onSelect, modal = false }: CharacterCardContentProps) => {
  const Card = modal ? ModalCharacterCard : RaceCharacterCard;

  return (
    <Card type="button" onClick={() => onSelect(character)}>
      <CharacterAvatar
        src={normalizeImagePath(character.imagem)}
        alt={`Retrato de ${character.nome}`}
        fallbackIcon={<BiUserCircle aria-hidden="true" />}
      />
      <CharacterName>{character.nome}</CharacterName>
    </Card>
  );
};

interface PassiveCardProps {
  passive: RacaPassiva;
  onClick: () => void;
  modal?: boolean;
}

const PassiveCard = ({ passive, onClick, modal = false }: PassiveCardProps) => {
  const Card = modal ? ModalDetailCard : DetailCard;
  return (
    <Card type="button" onClick={onClick}>
      <PassiveGlyph><BiShield aria-hidden="true" /></PassiveGlyph>
      <DetailCardBody>
        <DetailCardName title={passive.nome}>{passive.nome}</DetailCardName>
        <DetailCardDescription>{passive.efeito || 'Clique para visualizar os detalhes.'}</DetailCardDescription>
      </DetailCardBody>
    </Card>
  );
};

interface VariationCardProps {
  variation: RacaVariacao;
  onClick: () => void;
  modal?: boolean;
}

const VariationCard = ({ variation, onClick, modal = false }: VariationCardProps) => {
  const Card = modal ? ModalDetailCard : DetailCard;
  return (
    <Card type="button" onClick={onClick}>
      <VariationThumb
        src={normalizeImagePath(variation.imagem)}
        alt={`Imagem da variação ${variation.nome}`}
        fallbackIcon={<BiGitBranch aria-hidden="true" />}
      />
      <DetailCardBody>
        <DetailCardName title={variation.nome}>{variation.nome}</DetailCardName>
        <DetailCardDescription>{variation.descricao || variation.efeito || 'Clique para visualizar os detalhes.'}</DetailCardDescription>
      </DetailCardBody>
    </Card>
  );
};

const RacaPage = () => {
  const { theme, neon } = useSelector<RootThemeState, ThemeReducerState>(
    (state) => state.themesReducer
  );
  const {
    race,
    status,
    passives,
    variations,
    characters,
    relatedPages,
    galleryImages,
    galleryShapes,
    loading,
    error,
    activeModal,
    selectedDetail,
    galleryIndex,
    heroImageOpen,
    hasDescription,
    setActiveModal,
    closeModal,
    setSelectedDetail,
    closeDetail,
    setGalleryIndex,
    closeGallery,
    setHeroImageOpen,
    previousGalleryImage,
    nextGalleryImage,
    selectCharacter,
  } = useRacaPage();

  const isNeonActive = neon === 'on';
  const renderBackground = () => (
    <BackgroundVideoContainer>
      <BackgroundVideo src={backgroundVideo} autoPlay loop muted playsInline />
      <BackgroundOverlay />
    </BackgroundVideoContainer>
  );

  if (loading) {
    return (
      <RacePageRoot>
        {renderBackground()}
        <PageState><WikiSearchLoading label="Carregando raça" /></PageState>
      </RacePageRoot>
    );
  }

  if (error || !race) {
    return (
      <RacePageRoot>
        {renderBackground()}
        <PageState>
          <h1>Raça não encontrada</h1>
          <p>{error ?? 'Não foi possível encontrar os dados desta raça.'}</p>
          <BackToWikiLink to="/wiki/search?type=races">Voltar para raças</BackToWikiLink>
        </PageState>
      </RacePageRoot>
    );
  }

  const visibleTags = ['Ra\u00e7a', ...(race.tags ?? [])]
    .filter((tag, index, tags) => (
      tags.findIndex((candidate) => candidate.localeCompare(tag, 'pt-BR', { sensitivity: 'base' }) === 0) === index
    ));
  const previewPassives = passives.slice(0, 3);
  const previewVariations = variations.slice(0, 3);
  const previewGallery = galleryImages.slice(0, 6);
  const previewCharacters = characters.slice(0, 8);
  const baseStatus = status?.status;
  const lightboxImages = galleryImages.map((image) => ({
    ...image,
    url: normalizeImagePath(image.url),
  }));
  const heroLightboxImage = race.imagem ? [{
    url: normalizeImagePath(race.imagem),
    caption: race.nome,
  }] : [];

  const openPassive = (passive: RacaPassiva) => {
    closeModal();
    setSelectedDetail({ type: 'passive', value: passive });
  };
  const openVariation = (variation: RacaVariacao) => {
    closeModal();
    setSelectedDetail({ type: 'variation', value: variation });
  };

  return (
    <RacePageRoot>
      {renderBackground()}
      <RacePageContent>
        <RaceRevealBlock variant="infoBlock" threshold={0.16}>
          <HeroPanel $neon={isNeonActive}>
            <HudCorners neon={isNeonActive} />
            <HeroGrid>
              <RaceImageButton
                type="button"
                onClick={() => race.imagem && setHeroImageOpen(true)}
                aria-label={`Ampliar imagem de ${race.nome}`}
              >
                <RaceImage
                  src={normalizeImagePath(race.imagem)}
                  alt={`Imagem da raça ${race.nome}`}
                  fallbackIcon={<BiImage aria-hidden="true" />}
                />
              </RaceImageButton>

              <RaceIdentity>
                <RaceTitleSlot>
                  <OdisseiaAnimatedTitle key={race.nome} theme={theme} neon={neon} text={race.nome} />
                </RaceTitleSlot>
                {visibleTags.length > 0 && (
                  <RaceTagList aria-label="Categorias da raça">
                    {visibleTags.map((tag) => <RaceTag key={tag}>{tag}</RaceTag>)}
                  </RaceTagList>
                )}
                <DescriptionButton
                  type="button"
                  $clickable={hasDescription}
                  disabled={!hasDescription}
                  onClick={() => hasDescription && setActiveModal('description')}
                >
                  {hasDescription
                    ? <RichTextDisplay content={race.descricao} />
                    : <EmptyDescription>Descrição ainda não cadastrada.</EmptyDescription>}
                </DescriptionButton>
              </RaceIdentity>

              <StatusArea>
                <StatusHeading>Valores raciais</StatusHeading>
                <PrimaryStats>
                  <StatCard>
                    <MaskIcon src={glassHeart} color="var(--clearneonRed)" size={27} />
                    <StatLabel>Vida</StatLabel>
                    <StatValue>{baseStatus?.vida ?? '—'}</StatValue>
                  </StatCard>
                  <StatCard>
                    <MaskIcon src={electric} color="var(--clearneonGreen)" size={27} />
                    <StatLabel>Estamina</StatLabel>
                    <StatValue>{baseStatus?.estamina ?? '—'}</StatValue>
                  </StatCard>
                  <StatCard>
                    <MaskIcon src={rollingEnergy} color="var(--clearneonBlue)" size={27} />
                    <StatLabel>Mana</StatLabel>
                    <StatValue>{baseStatus?.mana ?? '—'}</StatValue>
                  </StatCard>
                </PrimaryStats>
                <SecondaryStats>
                  <StatCard $accent="purple">
                    <BiPackage aria-hidden="true" />
                    <StatLabel>Capacidade de carga</StatLabel>
                    <StatValue>{baseStatus?.capacidadeCarga ?? '—'}</StatValue>
                  </StatCard>
                  <StatCard $accent="gold">
                    <BiTargetLock aria-hidden="true" />
                    <StatLabel>Atributo inicial</StatLabel>
                    <StatValue>{status?.atributoInicial || '—'}</StatValue>
                    {status?.atributoInicial && <StatHint>+1 inicial</StatHint>}
                  </StatCard>
                </SecondaryStats>
              </StatusArea>
            </HeroGrid>
          </HeroPanel>
        </RaceRevealBlock>

        <MiddleGrid>
          <RaceRevealBlock variant="infoBlock" threshold={0.2}>
            <MiddlePanel $neon={isNeonActive}>
              <HudCorners neon={isNeonActive} />
              <PanelHeader>
                <PanelTitle $neon={isNeonActive}><BiShield aria-hidden="true" />Habilidades passivas</PanelTitle>
                {passives.length > 3 && (
                  <ViewAllButton type="button" onClick={() => setActiveModal('passives')}>Ver todas ({passives.length})</ViewAllButton>
                )}
              </PanelHeader>
              {previewPassives.length > 0 ? (
                <DetailList>
                  {previewPassives.map((passive, index) => (
                    <PassiveCard key={`${passive.nome}-${index}`} passive={passive} onClick={() => openPassive(passive)} />
                  ))}
                </DetailList>
              ) : <EmptyPanel>Nenhuma habilidade passiva cadastrada.</EmptyPanel>}
            </MiddlePanel>
          </RaceRevealBlock>

          <RaceRevealBlock variant="infoBlock" threshold={0.2}>
            <MiddlePanel $neon={isNeonActive}>
              <HudCorners neon={isNeonActive} />
              <PanelHeader>
                <PanelTitle $neon={isNeonActive}><BiGitBranch aria-hidden="true" />Variações</PanelTitle>
                {variations.length > 3 && (
                  <ViewAllButton type="button" onClick={() => setActiveModal('variations')}>Ver todas ({variations.length})</ViewAllButton>
                )}
              </PanelHeader>
              {previewVariations.length > 0 ? (
                <DetailList>
                  {previewVariations.map((variation, index) => (
                    <VariationCard key={`${variation.nome}-${index}`} variation={variation} onClick={() => openVariation(variation)} />
                  ))}
                </DetailList>
              ) : <EmptyPanel>Nenhuma variação cadastrada.</EmptyPanel>}
            </MiddlePanel>
          </RaceRevealBlock>

          <RaceRevealBlock variant="infoCarousel" threshold={0.2}>
            <MiddlePanel $neon={isNeonActive}>
              <HudCorners neon={isNeonActive} />
              <PanelHeader>
                <PanelTitle $neon={isNeonActive}><BiImages aria-hidden="true" />Galeria</PanelTitle>
                {galleryImages.length > 6 && (
                  <ViewAllButton type="button" onClick={() => setActiveModal('gallery')}>Abrir galeria ({galleryImages.length})</ViewAllButton>
                )}
              </PanelHeader>
              {previewGallery.length > 0 ? (
                <GalleryGrid>
                  {previewGallery.map((image, index) => (
                    <GalleryButton
                      key={`${image.url}-${index}`}
                      $shape={galleryShapes[index] ?? 'square'}
                      type="button"
                      onClick={() => setGalleryIndex(index)}
                      aria-label={`Ampliar imagem ${index + 1} da galeria`}
                    >
                      <GalleryImage
                        $shape={galleryShapes[index] ?? 'square'}
                        src={normalizeImagePath(image.url)}
                        alt={image.caption || `Imagem ${index + 1} da galeria de ${race.nome}`}
                        fallbackIcon={<BiImage aria-hidden="true" />}
                      />
                    </GalleryButton>
                  ))}
                </GalleryGrid>
              ) : <EmptyPanel>Nenhuma imagem cadastrada na galeria.</EmptyPanel>}
            </MiddlePanel>
          </RaceRevealBlock>
        </MiddleGrid>

        <RelatedSection>
          <RaceRevealBlock variant="infoBlock" threshold={0.18}>
            <RelatedPanel $neon={isNeonActive}>
              <HudCorners neon={isNeonActive} />
              <PanelHeader>
                <PanelTitle $neon={isNeonActive}><BiUserCircle aria-hidden="true" />Personagens relacionados</PanelTitle>
                {characters.length > 8 && (
                  <ViewAllButton type="button" onClick={() => setActiveModal('characters')}>Ver todos ({characters.length})</ViewAllButton>
                )}
              </PanelHeader>
              {previewCharacters.length > 0 ? (
                <RaceCharacterGrid>
                  {previewCharacters.map((character) => (
                    <CharacterCardContent
                      key={character.idpersonagem}
                      character={character}
                      onSelect={selectCharacter}
                    />
                  ))}
                </RaceCharacterGrid>
              ) : <EmptyPanel>Nenhum personagem visível relacionado a esta raça.</EmptyPanel>}
            </RelatedPanel>
          </RaceRevealBlock>
        </RelatedSection>
      </RacePageContent>

      {activeModal === 'description' && (
        <Modal
          title={<CityModalTitle $theme={theme}>{formatCyberpunkTitle(`Descrição — ${race.nome}`)}</CityModalTitle>}
          theme={theme}
          neon={neon}
          showFooter={false}
          onClose={closeModal}
          width="980px"
          mobileInset
        >
          <ModalDescription>
            <RichTextDisplay content={race.descricao} />
            {relatedPages.length > 0 && (
              <RelatedPages>
                <RelatedPagesTitle>PÃ¡ginas que fazem referÃªncia a esta raÃ§a</RelatedPagesTitle>
                {relatedPages.map((page) => (
                  <RelatedPageLink key={page.idPage ?? page.slug} to={`/wiki/${encodeURIComponent(page.slug)}`}>
                    <span>{page.titulo}</span>
                  </RelatedPageLink>
                ))}
              </RelatedPages>
            )}
          </ModalDescription>
        </Modal>
      )}

      {activeModal === 'passives' && (
        <ListModal
          title={`Passivas de ${race.nome}`}
          items={passives}
          color="var(--clearneonBlue)"
          emptyMessage="Nenhuma passiva cadastrada."
          onClose={closeModal}
          columns={3}
          width="1100px"
          maxVisibleRows={3}
          itemHeight={112}
          theme={theme}
          neon={neon}
          renderItem={(passive, index) => (
            <PassiveCard key={`${passive.nome}-${index}`} passive={passive} modal onClick={() => openPassive(passive)} />
          )}
        />
      )}

      {activeModal === 'variations' && (
        <ListModal
          title={`Variações de ${race.nome}`}
          items={variations}
          color="var(--clearneonBlue)"
          emptyMessage="Nenhuma variação cadastrada."
          onClose={closeModal}
          columns={3}
          width="1100px"
          maxVisibleRows={3}
          itemHeight={112}
          theme={theme}
          neon={neon}
          renderItem={(variation, index) => (
            <VariationCard key={`${variation.nome}-${index}`} variation={variation} modal onClick={() => openVariation(variation)} />
          )}
        />
      )}

      {activeModal === 'characters' && (
        <ListModal
          title={`Personagens da raça ${race.nome}`}
          items={characters}
          color="var(--clearneonPurple)"
          emptyMessage="Nenhum personagem visível relacionado."
          onClose={closeModal}
          columns={5}
          width="1200px"
          maxVisibleRows={3}
          itemHeight={146}
          theme={theme}
          neon={neon}
          renderItem={(character) => (
            <CharacterCardContent
              key={character.idpersonagem}
              character={character}
              onSelect={selectCharacter}
              modal
            />
          )}
        />
      )}

      {activeModal === 'gallery' && (
        <Modal
          title={<CityModalTitle $theme={theme}>{formatCyberpunkTitle(`Galeria — ${race.nome}`)}</CityModalTitle>}
          theme={theme}
          neon={neon}
          showFooter={false}
          onClose={closeModal}
          width="1280px"
        >
          <GalleryModalViewport>
            <GalleryModalTrack>
              {galleryImages.map((image, index) => (
                <GalleryModalButton
                  key={`${image.url}-${index}`}
                  $shape={galleryShapes[index] ?? 'square'}
                  type="button"
                  onClick={() => {
                    closeModal();
                    setGalleryIndex(index);
                  }}
                  aria-label={`Ampliar imagem ${index + 1} da galeria`}
                >
                  <GalleryModalImage
                    src={normalizeImagePath(image.url)}
                    alt={image.caption || `Imagem ${index + 1} da galeria de ${race.nome}`}
                    fallbackIcon={<BiImage aria-hidden="true" />}
                  />
                </GalleryModalButton>
              ))}
            </GalleryModalTrack>
          </GalleryModalViewport>
        </Modal>
      )}

      <Lightbox
        isOpen={galleryIndex !== null}
        images={lightboxImages}
        selectedIndex={galleryIndex ?? 0}
        onPrevious={previousGalleryImage}
        onNext={nextGalleryImage}
        onClose={closeGallery}
      />

      <Lightbox
        isOpen={heroImageOpen}
        images={heroLightboxImage}
        onClose={() => setHeroImageOpen(false)}
      />

      {selectedDetail && createPortal(
        <HistoryModalOverlay onClick={(event) => { if (event.target === event.currentTarget) closeDetail(); }}>
          <HistoryModalSheet theme={theme} neon={neon}>
            <HistoryModalHeader theme={theme} neon={neon}>
              <HistoryModalTitle theme={theme} neon={neon}>
                {selectedDetail.value.nome}
              </HistoryModalTitle>
              <HistoryModalClose
                theme={theme}
                neon={neon}
                onClick={closeDetail}
                title="Fechar"
                aria-label="Fechar resumo"
                autoFocus
              >
                <CloseIcon />
              </HistoryModalClose>
            </HistoryModalHeader>
            <HistoryModalContent theme={theme} neon={neon}>
              <SummaryLayout $hasImage={selectedDetail.type === 'variation' && Boolean(selectedDetail.value.imagem)}>
                {selectedDetail.type === 'variation' && selectedDetail.value.imagem && (
                  <SummaryImage
                    src={normalizeImagePath(selectedDetail.value.imagem)}
                    alt={`Imagem de ${selectedDetail.value.nome}`}
                    fallbackIcon={<BiGitBranch aria-hidden="true" />}
                  />
                )}
                <SummaryContent>
                  {selectedDetail.type === 'variation' && (
                    <SummaryText>
                      <strong>Descrição</strong>
                      <p>{selectedDetail.value.descricao || 'Sem descrição registrada.'}</p>
                    </SummaryText>
                  )}
                  <SummaryText>
                    <strong>{selectedDetail.type === 'passive' ? 'Efeito' : 'Especial'}</strong>
                    <p>{selectedDetail.value.efeito || 'Nenhum efeito adicional registrado.'}</p>
                  </SummaryText>
                </SummaryContent>
              </SummaryLayout>
            </HistoryModalContent>
          </HistoryModalSheet>
        </HistoryModalOverlay>,
        document.getElementById('modal-root') || document.body
      )}
    </RacePageRoot>
  );
};

export default RacaPage;
