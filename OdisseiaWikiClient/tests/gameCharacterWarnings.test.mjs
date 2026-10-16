import { test } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const bundle = await build({
  entryPoints: ['src/routes/Game/GameLanding/gameCharacterWarnings.ts'],
  bundle: true, write: false, format: 'esm', platform: 'node',
});
const { getGameCharacterWarnings } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`
);

test('ficha atual e modo publicado não exibem alerta', () => {
  assert.deepEqual(getGameCharacterWarnings({
    idSistemaVersao: 4, idSistemaVersaoAtual: 4, numeroVersaoModo: '0.4.1',
    lootConfigurado: true, influenciasAtributosConfiguradas: true,
  }), []);
});

test('avisos orientam a atualização da ficha pela Mesa sem encaminhar jogadores ao Gerenciamento', () => {
  const warnings = getGameCharacterWarnings({
    idSistemaVersao: 3, idSistemaVersaoAtual: 4,
    numeroVersaoSistema: '1.1', numeroVersaoSistemaAtual: '1.2', numeroVersaoModo: null,
    lootConfigurado: false, influenciasAtributosConfiguradas: false,
  });
  assert.equal(warnings.length, 3);
  assert.match(warnings[0], /versão 1\.1.*Mesa usa 1\.2/);
  assert.match(warnings[0], /Mesas e Personagens > Personagens/);
  assert.doesNotMatch(warnings[0], /Gerenciamento|não há.*jogo publicado/i);
  assert.match(warnings[1], /loot/);
  assert.match(warnings[1], /peça ao responsável pelo jogo/i);
  assert.match(warnings[2], /vida, mana ou estamina/);
  assert.match(warnings[2], /peça ao responsável pelo Sistema/i);
});

test('ausência de modo listado não significa que a ficha esteja sem Sistema', () => {
  assert.deepEqual(getGameCharacterWarnings({
    idSistemaVersao: 4, idSistemaVersaoAtual: 4, numeroVersaoModo: null,
    lootConfigurado: null, influenciasAtributosConfiguradas: null,
  }), []);
});
