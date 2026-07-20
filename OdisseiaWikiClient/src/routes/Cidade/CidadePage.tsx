import { useSelector } from 'react-redux';
import {
  BiBookOpen,
  BiImage,
  BiImages,
  BiMapPin,
  BiRightArrowAlt,
  BiUserCircle,
} from 'react-icons/bi';
import { OdisseiaAnimatedTitle } from '../../components/Generic/OdisseiaAnimatedTitle';
import { RichTextDisplay } from '../../components/Generic/RichTextDisplay/RichTextDisplay';
import { ListModal } from '../../components/Generic/ListModal';
import { Modal } from '../../components/Generic/Modal/Modal';
import { WikiSearchLoading } from '../Wiki/components/WikiSearchLoading/WikiSearchLoading';
import { Lightbox } from '../Wiki/components/blocks/shared/Lightbox/Lightbox';
import { normalizeImagePath } from '../Wiki/utils/imagePathHelper';
import { PersonagemPayload } from '../../services/personagensService';
import { CidadePoint } from './CidadePage.types';
import { useCidadePage } from './useCidadePage';
import {
  BackToWikiLink,
  BannerImage,
  BannerContent,
  BannerTag,
  BannerTagList,
  CardDescription,
  CardName,
  CharacterAvatar,
  CharacterCard,
  CharacterName,
  CityBanner,
  CityGrid,
  CityPageContainer,
  CityPageContent,
  CompactCardGrid,
  DescriptionButton,
  DescriptionPreview,
  EmptyCityContent,
  GalleryButton,
  GalleryGrid,
  GalleryImage,
  GalleryModalButton,
  GalleryModalImage,
  GalleryModalTrack,
  GalleryModalViewport,
  HudPanel,
  HudCornerAccent,
  MiddleColumn,
  ModalCharacterCard,
  ModalDescription,
  CityModalTitle,
  ModalPointCard,
  PageState,
  PanelHeader,
  PanelTitle,
  PointCard,
  PointContent,
  PointImage,
  PointImageButton,
  RelatedPageLink,
  RelatedPages,
  RelatedPagesTitle,
  ViewAllButton,
} from './CidadePage.style';
import { isContentCategoryTag } from '../../utils/contentCategoryTag';

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
  const Card = modal ? ModalCharacterCard : CharacterCard;

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

interface PointCardContentProps {
  point: CidadePoint;
  onOpenImage: (point: CidadePoint) => void;
  modal?: boolean;
}

const PointCardContent = ({ point, onOpenImage, modal = false }: PointCardContentProps) => {
  const Card = modal ? ModalPointCard : PointCard;

  return (
    <Card>
      {point.imagem && (
        <PointImageButton
          type="button"
          $modal={modal}
          onClick={() => onOpenImage(point)}
          aria-label={`Ampliar imagem de ${point.nome}`}
        >
          <PointImage
            src={normalizeImagePath(point.imagem)}
            alt={`Imagem de ${point.nome}`}
            fallbackIcon={<BiImage aria-hidden="true" />}
          />
        </PointImageButton>
      )}
      <PointContent>
        <CardName title={point.nome}>{point.nome}</CardName>
        {point.descricao && (
          <CardDescription>{point.descricao}</CardDescription>
        )}
      </PointContent>
    </Card>
  );
};

const CidadePage = () => {
  const { theme, neon } = useSelector<RootThemeState, ThemeReducerState>(
    (state) => state.themesReducer
  );
  const {
    city,
    characters,
    points,
    relatedPages,
    galleryImages,
    galleryShapes,
    loading,
    error,
    activeModal,
    galleryIndex,
    selectedPointImage,
    hasDescription,
    hasPoints,
    hasCharacters,
    hasCenter,
    hasGallery,
    pointPreviewLimit,
    characterPreviewLimit,
    setActiveModal,
    closeModal,
    setGalleryIndex,
    closeGallery,
    openPointImage,
    closePointImage,
    previousGalleryImage,
    nextGalleryImage,
    selectCharacter,
  } = useCidadePage();

  if (loading) {
    return (
      <CityPageContainer $theme={theme}>
        <PageState>
          <WikiSearchLoading label="Carregando cidade" />
        </PageState>
      </CityPageContainer>
    );
  }

  if (error || !city) {
    return (
      <CityPageContainer $theme={theme}>
        <PageState>
          <h1>Cidade não encontrada</h1>
          <p>{error ?? 'Não foi possível encontrar os dados desta cidade.'}</p>
          <BackToWikiLink to="/wiki/search?type=cities">Voltar para cidades</BackToWikiLink>
        </PageState>
      </CityPageContainer>
    );
  }

  const sectionCount = Number(hasDescription) + Number(hasCenter) + Number(hasGallery);
  const hasOnlyGallery = hasGallery && sectionCount === 1;
  const isNeonActive = neon === 'on';
  const visibleTags = (city.tags ?? []).filter((tag) => !isContentCategoryTag(tag, 'Cidade'));
  const previewPoints = points.slice(0, pointPreviewLimit);
  const previewCharacters = characters.slice(0, characterPreviewLimit);
  const previewGallery = hasOnlyGallery ? galleryImages : galleryImages.slice(0, 6);
  const lightboxImages = galleryImages.map((image) => ({
    ...image,
    url: normalizeImagePath(image.url),
  }));

  return (
    <CityPageContainer $theme={theme} $backgroundImage={normalizeImagePath(city.imagem)}>
      <CityPageContent>
        <CityBanner $neon={isNeonActive}>
          <BannerImage src={normalizeImagePath(city.imagem)} alt="" aria-hidden="true" />
          <HudCorners neon={isNeonActive} />
          <BannerContent>
            <OdisseiaAnimatedTitle key={city.nome} theme={theme} neon={neon} text={city.nome} />
            {visibleTags.length > 0 && (
              <BannerTagList aria-label="Categorias da cidade">
                {visibleTags.map((tag) => <BannerTag key={tag}>{tag}</BannerTag>)}
              </BannerTagList>
            )}
          </BannerContent>
        </CityBanner>

        {sectionCount > 0 ? (
          <CityGrid $sectionCount={sectionCount}>
            {hasDescription && (
              <HudPanel $neon={isNeonActive}>
                <HudCorners neon={isNeonActive} />
                <PanelHeader>
                  <PanelTitle $neon={isNeonActive}><BiBookOpen aria-hidden="true" />Descrição</PanelTitle>
                </PanelHeader>
                <DescriptionButton
                  type="button"
                  onClick={() => setActiveModal('description')}
                  aria-label={`Abrir descrição completa de ${city.nome}`}
                >
                  <DescriptionPreview>
                    <RichTextDisplay content={city.descricao} />
                  </DescriptionPreview>
                </DescriptionButton>
              </HudPanel>
            )}

            {hasCenter && (
              <MiddleColumn $single={!hasPoints || !hasCharacters}>
                {hasPoints && (
                  <HudPanel $neon={isNeonActive}>
                    <HudCorners neon={isNeonActive} />
                    <PanelHeader>
                      <PanelTitle $neon={isNeonActive}><BiMapPin aria-hidden="true" />Pontos de interesse</PanelTitle>
                      {points.length > pointPreviewLimit && (
                        <ViewAllButton type="button" onClick={() => setActiveModal('points')}>
                          Ver todos ({points.length})
                        </ViewAllButton>
                      )}
                    </PanelHeader>
                    <CompactCardGrid>
                      {previewPoints.map((point) => (
                        <PointCardContent key={point.id} point={point} onOpenImage={openPointImage} />
                      ))}
                    </CompactCardGrid>
                  </HudPanel>
                )}

                {hasCharacters && (
                  <HudPanel $neon={isNeonActive}>
                    <HudCorners neon={isNeonActive} />
                    <PanelHeader>
                      <PanelTitle $neon={isNeonActive}><BiUserCircle aria-hidden="true" />Personagens relacionados</PanelTitle>
                      {characters.length > characterPreviewLimit && (
                        <ViewAllButton type="button" onClick={() => setActiveModal('characters')}>
                          Ver todos ({characters.length})
                        </ViewAllButton>
                      )}
                    </PanelHeader>
                    <CompactCardGrid $columns={4}>
                      {previewCharacters.map((character) => (
                        <CharacterCardContent
                          key={character.idpersonagem}
                          character={character}
                          onSelect={selectCharacter}
                        />
                      ))}
                    </CompactCardGrid>
                  </HudPanel>
                )}
              </MiddleColumn>
            )}

            {hasGallery && (
              <HudPanel $gallery $standalone={hasOnlyGallery} $neon={isNeonActive}>
                <HudCorners neon={isNeonActive} />
                <PanelHeader>
                  <PanelTitle $neon={isNeonActive}><BiImages aria-hidden="true" />Galeria</PanelTitle>
                  {!hasOnlyGallery && galleryImages.length > 6 && (
                    <ViewAllButton type="button" onClick={() => setActiveModal('gallery')}>
                      Abrir galeria ({galleryImages.length})
                    </ViewAllButton>
                  )}
                </PanelHeader>
                <GalleryGrid $standalone={hasOnlyGallery}>
                  {previewGallery.map((image, index) => (
                    <GalleryButton
                      key={`${image.url}-${index}`}
                      $shape={galleryShapes[index] ?? 'square'}
                      $standalone={hasOnlyGallery}
                      type="button"
                      onClick={() => setGalleryIndex(index)}
                      aria-label={`Ampliar imagem ${index + 1} da galeria`}
                    >
                      <GalleryImage
                        $shape={galleryShapes[index] ?? 'square'}
                        src={normalizeImagePath(image.url)}
                        alt={image.caption || `Imagem ${index + 1} da galeria de ${city.nome}`}
                        fallbackIcon={<BiImage aria-hidden="true" />}
                      />
                    </GalleryButton>
                  ))}
                </GalleryGrid>
              </HudPanel>
            )}
          </CityGrid>
        ) : (
          <EmptyCityContent>Nenhuma informação complementar foi publicada para esta cidade.</EmptyCityContent>
        )}
      </CityPageContent>

      {activeModal === 'description' && (
        <Modal
          title={(
            <CityModalTitle $theme={theme}>
              {formatCyberpunkTitle(`Descrição — ${city.nome}`)}
            </CityModalTitle>
          )}
          theme={theme}
          neon={neon}
          showFooter={false}
          onClose={closeModal}
          width="980px"
          mobileInset
        >
          <ModalDescription>
            <RichTextDisplay content={city.descricao} />
            {relatedPages.length > 0 && (
              <RelatedPages>
                <RelatedPagesTitle>Páginas que fazem referência a esta cidade</RelatedPagesTitle>
                {relatedPages.map((page) => (
                  <RelatedPageLink key={page.idPage} to={`/wiki/${encodeURIComponent(page.slug)}`}>
                    <span>{page.titulo}</span>
                    <BiRightArrowAlt aria-hidden="true" />
                  </RelatedPageLink>
                ))}
              </RelatedPages>
            )}
          </ModalDescription>
        </Modal>
      )}

      {activeModal === 'characters' && (
        <ListModal
          title={`Personagens de ${city.nome}`}
          items={characters}
          color="var(--clearneonPurple)"
          emptyMessage="Nenhum personagem visível relacionado."
          onClose={closeModal}
          columns={5}
          width="min(1500px, calc(100vw - 40px))"
          maxVisibleRows={3}
          itemHeight={138}
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

      {activeModal === 'points' && (
        <ListModal
          title={`Pontos de interesse — ${city.nome}`}
          items={points}
          color="var(--clearneonBlue)"
          emptyMessage="Nenhum ponto de interesse publicado."
          onClose={closeModal}
          theme={theme}
          neon={neon}
          renderItem={(point) => (
            <PointCardContent
              key={point.id}
              point={point}
              onOpenImage={openPointImage}
              modal
            />
          )}
        />
      )}

      {activeModal === 'gallery' && (
        <Modal
          title={(
            <CityModalTitle $theme={theme}>
              {formatCyberpunkTitle(`Galeria — ${city.nome}`)}
            </CityModalTitle>
          )}
          theme={theme}
          neon={neon}
          showFooter={false}
          onClose={closeModal}
          width="min(1500px, calc(100vw - 40px))"
        >
          <GalleryModalViewport>
            <GalleryModalTrack>
              {galleryImages.map((image, index) => (
                <GalleryModalButton
                  key={`${image.url}-modal-${index}`}
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
                    alt={image.caption || `Imagem ${index + 1} da galeria de ${city.nome}`}
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
        isOpen={selectedPointImage !== null}
        images={selectedPointImage?.imagem ? [{
          url: normalizeImagePath(selectedPointImage.imagem),
          caption: selectedPointImage.nome,
        }] : []}
        onClose={closePointImage}
      />
    </CityPageContainer>
  );
};

export default CidadePage;
