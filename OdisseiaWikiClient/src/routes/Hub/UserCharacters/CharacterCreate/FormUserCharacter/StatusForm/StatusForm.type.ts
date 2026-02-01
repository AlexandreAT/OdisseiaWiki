import { RacaPayload } from '../../../../../../services/racasService';
import { Principais, Secundarios } from '../FormUserCharacter.type';

export interface StatusFormProps {
  theme: 'dark' | 'light';
  neon: 'on' | 'off';
  userName: string;
  selectedRace: RacaPayload | undefined;
  xp: number;
  setXp: (value: number) => void;
  level: number;
  setLevel: (value: number) => void;
  statusBasico: {
    vida: number;
    estamina: number;
    mana: number;
    capacidadeCarga: number;
  };
  setStatusBasico: React.Dispatch<React.SetStateAction<{
    vida: number;
    estamina: number;
    mana: number;
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
