import type { GameCharacterOption } from '../../../models/GameRun';

export const getGameCharacterWarnings = (character: GameCharacterOption): string[] => {
  const warnings: string[] = [];

  if (character.atualizacaoDisponivel || (character.idSistemaVersaoAtual && character.idSistemaVersao &&
      character.idSistemaVersao !== character.idSistemaVersaoAtual)) {
    const version = character.numeroVersaoSistema ?? 'anterior';
    const currentVersion = character.numeroVersaoSistemaAtual ?? 'atual';
    warnings.push(`Esta ficha usa a versão ${version} do Sistema, mas sua Mesa usa ${currentVersion}. Para jogar com as regras novas, atualize este personagem em Mesas e Personagens > Personagens. Se iniciar agora, a run usará a versão ${version}.`);
  }
  if (character.lootConfigurado === false) {
    warnings.push('O jogo desta ficha não tem loot configurado; combates não concederão itens. Para receber itens, peça ao responsável pelo jogo para configurar o loot dos encontros.');
  }
  if (character.influenciasAtributosConfiguradas === false) {
    warnings.push('Esta versão do Sistema não configura o aumento de vida, mana ou estamina ao evoluir atributos. Para habilitar esse efeito, peça ao responsável pelo Sistema para configurar as influências dos atributos.');
  }

  return warnings;
};
