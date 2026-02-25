import { Item } from '../../../../models/Itens';
import { Magia } from '../../../../models/Magias';
import { Skills } from '../../../../models/Skills';
import { Principais, Secundarios } from '../../../Hub/UserCharacters/CharacterCreate/FormUserCharacter/FormUserCharacter.type';
import { RacaPayload } from '../../../../services/racasService';

export interface CharacterSystemFormProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  allowMaxStatusEditing?: boolean;
  userName: string;
  selectedRace?: RacaPayload;
  raceImageUrl: string;
  avatarUrl: string;
  xp: number;
  setXp: (value: number) => void;
  level: number;
  setLevel: (value: number) => void;
  statusBasico: {
    vida: number;
    vidaMaxima: number;
    estamina: number;
    estaminaMaxima: number;
    mana: number;
    manaMaxima: number;
    capacidadeCarga: number;
  };
  setStatusBasico: React.Dispatch<React.SetStateAction<{
    vida: number;
    vidaMaxima: number;
    estamina: number;
    estaminaMaxima: number;
    mana: number;
    manaMaxima: number;
    capacidadeCarga: number;
  }>>;
  atributosPrincipais: Principais;
  setAtributosPrincipais: (value: Principais) => void;
  atributosSecundarios: Secundarios;
  setAtributosSecundarios: (value: Secundarios) => void;
  defesas: {
    armadura: number;
    protecao: number;
    escudo: number;
    outras: number;
  };
  setDefesas: (value: {
    armadura: number;
    protecao: number;
    escudo: number;
    outras: number;
  }) => void;
  itens: Item[];
  setItens: (value: Item[]) => void;
  skills: Skills[];
  setSkills: (value: Skills[]) => void;
  magias: Magia[];
  setMagias: (value: Magia[]) => void;
  listItens: Item[];
  handleSelectItem: (item: Item) => void;
  itemColumns: any;
  skillsColumns: any;
  magiasColumns: any;
}
