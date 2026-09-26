import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import type { GameplayFavoriteRoll } from '../../../models/Gameplay';
import type { GameplayFavoriteGroup } from '../../../hooks/useGameplayFavorites';
import { MesaHudDecor } from '../components/MesaHudDecor/MesaHudDecor';
import {
  FavoriteCharacterGroup,
  FavoriteCharacterName,
  FavoriteRollShortcut,
  FavoriteRollsContent,
  FavoriteRollsList,
  FavoriteRollsPanel,
} from './GameplayLiveHistory.style';

interface GameplayFavoriteRollsProps {
  groups: GameplayFavoriteGroup[];
  loading: boolean;
  rolling: boolean;
  neon: boolean;
  onRoll: (favorite: GameplayFavoriteRoll) => void | Promise<void>;
}

export const GameplayFavoriteRolls = ({
  groups,
  loading,
  rolling,
  neon,
  onRoll,
}: GameplayFavoriteRollsProps) => {
  const hasMultipleCharacters = groups.length > 1;
  const hasFavorites = groups.some((group) => group.favorites.length > 0);

  return (
    <FavoriteRollsPanel $neon={neon}>
      <MesaHudDecor neon={neon} />
      <h2><StarOutlinedIcon aria-hidden="true" /> Favoritos</h2>
      <FavoriteRollsContent>
        {loading ? (
          <p>Carregando favoritos…</p>
        ) : groups.length === 0 ? (
          <p>Favorite uma rolagem na ficha para usá-la aqui.</p>
        ) : !hasFavorites && !hasMultipleCharacters ? (
          <p>{groups[0].nome} ainda não possui rolagens favoritas.</p>
        ) : (
          groups.map((group) => (
            <FavoriteCharacterGroup key={group.idPersonagemJogador}>
              {hasMultipleCharacters && <FavoriteCharacterName>{group.nome}</FavoriteCharacterName>}
              {group.favorites.length > 0 ? (
                <FavoriteRollsList>
                  {group.favorites.map((favorite) => (
                    <FavoriteRollShortcut
                      key={favorite.idFavorito}
                      type="button"
                      disabled={rolling}
                      title={`Rolar ${favorite.nome} com ${group.nome}`}
                      onClick={() => void onRoll(favorite)}
                    >
                      {favorite.nome}
                    </FavoriteRollShortcut>
                  ))}
                </FavoriteRollsList>
              ) : (
                <p>Nenhuma rolagem favorita.</p>
              )}
            </FavoriteCharacterGroup>
          ))
        )}
      </FavoriteRollsContent>
    </FavoriteRollsPanel>
  );
};
