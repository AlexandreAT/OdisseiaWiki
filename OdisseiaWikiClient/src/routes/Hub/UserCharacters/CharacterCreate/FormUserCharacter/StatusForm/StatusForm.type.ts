import { RacaPayload } from '../../../../../../services/racasService';
import { Principais, Secundarios } from '../FormUserCharacter.type';

export interface StatusFormProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  allowMaxStatusEditing?: boolean;
  userName: string;
  selectedRace: RacaPayload | undefined;
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
  avatarUrl: string;
  setAvatarUrl: (value: string) => void;
  raceImageUrl: string;
}
