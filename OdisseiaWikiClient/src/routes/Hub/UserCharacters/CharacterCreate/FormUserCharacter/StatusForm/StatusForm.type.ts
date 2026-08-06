import { RacaPayload } from '../../../../../../services/racasService';
import { Principais, Secundarios } from '../FormUserCharacter.type';
import { Defesas, StatusBase } from '../../../../../../models/Characters';
import { SistemaRuntimeContexto } from '../../../../../../models/SistemaRpg';

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
  statusBasico: StatusBase;
  setStatusBasico: React.Dispatch<React.SetStateAction<StatusBase>>;
  atributosPrincipais: Principais;
  setAtributosPrincipais: (value: Principais) => void;
  atributosSecundarios: Secundarios;
  setAtributosSecundarios: (value: Secundarios) => void;
  defesas: Defesas;
  setDefesas: (value: Defesas) => void;
  avatarUrl: string;
  setAvatarUrl: (value: string) => void;
  raceImageUrl: string;
  runtimeContext?: SistemaRuntimeContexto | null;
}
