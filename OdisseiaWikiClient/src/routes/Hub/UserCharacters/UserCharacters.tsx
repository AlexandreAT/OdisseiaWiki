import { useEffect, useState } from 'react';
import { getPersonagensPorUsuario } from '../../../services/personagemJogadorService';
import { PersonagemJogador } from '../../../models/PersonagemJogador';
import { 
  ListController, 
  Main, 
  CharacterCard, 
  CharacterImage, 
  CharacterName, 
  Title, 
  ButtonDiv, 
  BackButtonDiv,
  StyledIconButton, 
  CardRight,
  CardLeft,
  CharacterLabel,
  CharacterInfos
} from './UserCharacters.style';
import { Add, ArrowBack } from "@mui/icons-material";
import { CharacterCreate } from './CharacterCreate/CharacterCreate';
import { CharacterEdit } from './CharacterEdit/CharacterEdit';
import { useFormUserCharacter } from './CharacterCreate/useFormUserCharacter';
import { StatusBar } from '../../../components/Generic/StatusBar/StatusBar';

interface UserCharactersProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  userId: number;
  onViewModeChange?: (mode: ViewMode) => void;
  onPersonagensChange?: (hasPersonagens: boolean) => void;
  onLoadingChange?: (isLoading: boolean) => void;
}

interface PersonagemComStatus extends PersonagemJogador {
  status: {
    vida: number;
    vidaMaxima: number;
    estamina: number;
    estaminaMaxima: number;
    mana: number;
    manaMaxima: number;
    capacidadeCarga: number;
  };
}

export type ViewMode = 'list' | 'create' | 'edit';

export const UserCharacters = ({ theme, neon, userId, onViewModeChange, onPersonagensChange, onLoadingChange }: UserCharactersProps) => {
  const [personagens, setPersonagens] = useState<PersonagemComStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { listRaces, listCities, listMesas } = useFormUserCharacter(userId);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCharacter, setSelectedCharacter] = useState<PersonagemJogador | null>(null);

  useEffect(() => {
    onViewModeChange?.(viewMode);
  }, [viewMode, onViewModeChange]);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  useEffect(() => {
    if (!loading) {
      onPersonagensChange?.(personagens.length > 0);
    }
  }, [personagens, loading, onPersonagensChange]);

  useEffect(() => {
    const fetchPersonagens = async () => {
      try {
        const data = await getPersonagensPorUsuario(userId);
        console.log("🚀 ~ fetchPersonagens ~ data:", data)
        console.log("🚀 ~ fetchPersonagens ~ userId:", userId)

        const parsed: PersonagemComStatus[] = data.map((p) => {
          let status = { vida: 0, vidaMaxima: 0, estamina: 0, estaminaMaxima: 0, mana: 0, manaMaxima: 0, capacidadeCarga: 0 };

          try {
            const parsedStatusJson = typeof p.statusJson === 'string' ? JSON.parse(p.statusJson) : p.statusJson;
            const rawStatus = parsedStatusJson?.status ?? status;
            status = {
              vida: rawStatus?.vida ?? 0,
              vidaMaxima: rawStatus?.vidaMaxima ?? rawStatus?.vida ?? 0,
              estamina: rawStatus?.estamina ?? 0,
              estaminaMaxima: rawStatus?.estaminaMaxima ?? rawStatus?.estamina ?? 0,
              mana: rawStatus?.mana ?? 0,
              manaMaxima: rawStatus?.manaMaxima ?? rawStatus?.mana ?? 0,
              capacidadeCarga: rawStatus?.capacidadeCarga ?? 0,
            };
          } catch (err) {
            console.warn("Erro ao parsear statusJson:", err);
          }

          return {
            ...p,
            status,
          };
        });

        setPersonagens(parsed);
      } catch (err: any) {
        console.error(err);
        setError(err.response?.data || "Erro ao carregar personagens");
      } finally {
        setLoading(false);
      }
    };

    fetchPersonagens();
  }, [userId]);

  const parsePersonagens = (data: PersonagemJogador[]): PersonagemComStatus[] => {
    return data.map((p) => {
      let status = { vida: 0, vidaMaxima: 0, estamina: 0, estaminaMaxima: 0, mana: 0, manaMaxima: 0, capacidadeCarga: 0 };

      try {
        const parsedStatusJson = typeof p.statusJson === 'string' ? JSON.parse(p.statusJson) : p.statusJson;
        const rawStatus = parsedStatusJson?.status ?? status;
        status = {
          vida: rawStatus?.vida ?? 0,
          vidaMaxima: rawStatus?.vidaMaxima ?? rawStatus?.vida ?? 0,
          estamina: rawStatus?.estamina ?? 0,
          estaminaMaxima: rawStatus?.estaminaMaxima ?? rawStatus?.estamina ?? 0,
          mana: rawStatus?.mana ?? 0,
          manaMaxima: rawStatus?.manaMaxima ?? rawStatus?.mana ?? 0,
          capacidadeCarga: rawStatus?.capacidadeCarga ?? 0,
        };
      } catch (err) {
        console.warn("Erro ao parsear statusJson:", err);
      }

      return {
        ...p,
        status,
      };
    });
  };

  const onSaveBackGetAll = async () => {
    setViewMode("list");
    const data = await getPersonagensPorUsuario(userId);
    setPersonagens(parsePersonagens(data));
  };

  const onSaveGetAll = async () => {
    const data = await getPersonagensPorUsuario(userId);
    setPersonagens(parsePersonagens(data));
  };

  if (loading) return <div>Carregando personagens...</div>;

  const renderContent = () => {
    switch (viewMode) {
      case 'create':
        return (
          <>
            <BackButtonDiv theme={theme} neon={neon}>
              <StyledIconButton theme={theme} neon={neon} onClick={() => setViewMode('list')}>
                <ArrowBack className="icon" />
              </StyledIconButton>
            </BackButtonDiv>
            <Title theme={theme} neon={neon}>Criar Personagem</Title>
            <CharacterCreate 
              theme={theme} 
              neon={neon} 
              userId={userId} 
              onSave={onSaveBackGetAll} 
            />
          </>
        );

      case 'edit':
        return (
          <>
            <BackButtonDiv theme={theme} neon={neon}>
              <StyledIconButton theme={theme} neon={neon} onClick={() => setViewMode('list')}>
                <ArrowBack className="icon" />
              </StyledIconButton>
            </BackButtonDiv>
            <Title theme={theme} neon={neon}>Editar Personagem</Title>
            {selectedCharacter && (
              <CharacterEdit 
                theme={theme}
                neon={neon}
                personagem={selectedCharacter}
                userId={userId}
                onSave={onSaveGetAll}
              />
            )}
          </>
        );

      default:
        return (
          <>
            <Title theme={theme} neon={neon}>Seus Personagens</Title>
            <ButtonDiv theme={theme} neon={neon}>
              <StyledIconButton theme={theme} neon={neon} onClick={() => setViewMode('create')}>
                <Add className="icon" />
              </StyledIconButton>
            </ButtonDiv>
            {error ? (
              <>{error}</>
            ) : (
              <ListController>
                {personagens.map((p) => (
                  <CharacterCard key={p.idpersonagemJogador}>
                    <CardRight>
                      <CharacterImage 
                        theme={theme} 
                        neon={neon} 
                        src={p.imagem || '/assets/default-character.png'} 
                        alt={p.nome} 
                        onClick={() => {
                          setSelectedCharacter(p);
                          setViewMode('edit');
                        }}
                      />
                      <CharacterName>{p.nome}</CharacterName>
                      <CharacterInfos>
                        <CharacterLabel>Raça: {listRaces.find(x => x.idraca === p.idraca)?.nome}</CharacterLabel>
                        <CharacterLabel>Cidade: {listCities.find(x => x.idcidade === p.idcidade)?.nome ?? "nenhuma"}</CharacterLabel>
                        <CharacterLabel>Mesa: {listMesas.find(x => x.idmesa === p.idmesa)?.nome}</CharacterLabel>
                      </CharacterInfos>
                    </CardRight>
                    <CardLeft>
                      <StatusBar 
                        theme={theme}
                        neon={neon}
                        type="vida"
                        value={p.status.vida}
                        maxValue={p.status.vidaMaxima || undefined}
                        height="20px"
                        width="100%"
                      />
                      <StatusBar 
                        theme={theme}
                        neon={neon}
                        type="mana"
                        value={p.status.mana}
                        maxValue={p.status.manaMaxima || undefined}
                        height="20px"
                        width="100%"
                      />
                      <StatusBar 
                        theme={theme}
                        neon={neon}
                        type="estamina"
                        value={p.status.estamina}
                        maxValue={p.status.estaminaMaxima || undefined}
                        height="20px"
                        width="100%"
                      />
                    </CardLeft>
                  </CharacterCard>
                ))}
              </ListController>
            )}
          </>
        );
    }
  };

  return <Main>{renderContent()}</Main>;
};