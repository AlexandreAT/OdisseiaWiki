import type { FieldHelpContent } from '../components/Generic/FieldHelp/FieldHelp.types';

const entries: Record<string, { title: string; text: string }> = {
  catalogo: { title: 'Catálogo de itens', text: 'Define as opções de itens desta versão do Sistema. Publique a versão para usar as novas regras nas mesas e jogos vinculados a ela.' },
  tipo: { title: 'Tipo de item', text: 'É o grupo principal, como arma ou traje. Suas configurações também valem para as categorias e arquétipos dentro dele.' },
  categoria: { title: 'Categoria', text: 'Agrupa arquétipos parecidos. Use para compartilhar campos e escalas, sem repetir a mesma configuração em cada um.' },
  arquetipo: { title: 'Arquétipo', text: 'É uma opção específica do item, como Colete. Aparece na escolha da subcategoria ao criar ou editar um item.' },
  codigo: { title: 'Código', text: 'Liga esta opção aos itens e regras. Prefira letras sem acento e sublinhado. Trocar um código já usado pode exigir revisar os itens antigos.' },
  ordem: { title: 'Ordem', text: 'Define em que posição esta opção aparece. Números menores aparecem primeiro; não muda a força do item.' },
  ativo: { title: 'Disponível nesta versão', text: 'Desmarque para não oferecer esta opção em novos itens desta versão. Não apaga os itens já existentes.' },
  descricao: { title: 'Descrição', text: 'Explica esta configuração para quem lê. Escrever um efeito aqui não faz o jogo aplicá-lo automaticamente.' },
  compatibilidade: { title: 'Pode usar junto com', text: 'Marque os trajes que podem ser usados juntos. Vale nos dois sentidos. Marque o próprio arquétipo para repetir peças. Nenhuma opção: usar sozinho. Não afeta próteses.' },
  campos: { title: 'Campos', text: 'São os dados que os itens deste grupo podem ter. As categorias e arquétipos abaixo também recebem esses campos.' },
  faixas: { title: 'Faixas e escalas', text: 'Indicam a escala esperada dos valores, usada nas referências e gráficos. Não substituem o valor que foi escrito no item.' },
  referencias: { title: 'Referências', text: 'São opções de escolha, como tipo de dano, material ou parte do corpo. Os grupos abaixo também recebem essas opções.' },
  'campos.tipo': { title: 'Tipo do valor', text: 'Escolhe o que pode ser informado: texto, número, sim/não ou uma lista de valores.' },
  'campos.unidade': { title: 'Unidade', text: 'Diz como ler o valor, por exemplo kg ou %. Não converte nem multiplica o número automaticamente.' },
  'campos.obrigatorio': { title: 'Obrigatório', text: 'Indica que este dado deve ser preenchido nos itens que usam este grupo.' },
  'faixas.codigoCampo': { title: 'Código do campo', text: 'É o código de um campo deste grupo ou dos grupos acima. Liga a escala ao valor certo, como PROTECAO_BASE.' },
  'faixas.valorMinimo': { title: 'Mínimo', text: 'É o início da escala esperada. Vazio significa que não há um mínimo definido nesta escala.' },
  'faixas.valorMaximo': { title: 'Máximo', text: 'É o fim da escala esperada. Vazio significa que não há um máximo definido nesta escala.' },
  'faixas.valorReferencia': { title: 'Referência', text: 'É um valor típico para comparar itens. Ele deve ficar entre o mínimo e o máximo, quando esses limites existirem.' },
  'faixas.unidade': { title: 'Unidade da escala', text: 'Mostra como ler os números da escala, por exemplo kg ou %. Não muda o valor do item.' },
  'referencias.tipo': { title: 'Tipo da referência', text: 'Define onde a opção será usada, como na escolha de dano, defesa, alcance ou material.' },
  'referencias.valor': { title: 'Valor da referência', text: 'É o valor que a opção entrega ao item. Quando vazio, o próprio código da opção é usado.' },
};

export const itemCatalogHelp: Record<string, FieldHelpContent> = Object.fromEntries(Object.entries(entries).map(([key, entry]) =>
  [key, { id: `system.itemCatalog.${key}`, ...entry, presentation: { density: 'compact' as const } }]));

export function resolveItemCatalogHelp(target: string): FieldHelpContent | undefined {
  const tableField = target.match(/(campos|faixas|referencias)\.([^.]*)$/);
  const key = target.split('.').at(-1) ?? target;
  return (tableField ? itemCatalogHelp[`${tableField[1]}.${tableField[2]}`] : undefined) ?? itemCatalogHelp[key];
}
