import type { FieldHelpContent } from '../components/Generic/FieldHelp/FieldHelp.types';

type Explanation = { title: string; text: string; labels?: string[] };
// Plain, contextual source of truth. Only explicitly listed fields get help;
// user-created attribute/condition names never receive guessed definitions.
export const wikiContentHelpCatalogue = {
  item: {
    space: { title: 'Espaço ocupado', text: 'Peso de uma unidade do item. Ao levar várias unidades, a carga aumenta com a quantidade.', labels: ['Espaço ocupado'] },
    price: { title: 'Valor de compra', text: 'Preço de referência de uma unidade. Também serve de base para a venda ao mercador; a loja pode configurar outro preço. Sem valor, a referência é zero.', labels: ['Valor de compra (opcional)'] },
    stealth: { title: 'Discrição', text: 'Modificador de discrição registrado neste item. Use um valor negativo para penalidade, positivo para bônus e zero para nenhum ajuste.', labels: ['Discrição (-/+)'] },
    category: { title: 'Categoria do Sistema', text: 'Liga o item a uma categoria criada no Sistema. As opções disponíveis dependem da versão escolhida.', labels: ['Categoria do Sistema'] },
    archetype: { title: 'Arquétipo do Sistema', text: 'Modelo do Sistema usado como referência para este item. Confira também os valores do item; escolher o modelo não substitui toda a configuração.', labels: ['Arquétipo do Sistema'] },
  },
  equipment: {
    weaponType: { title: 'Tipo de ataque', text: 'Define a família do ataque e as regras compatíveis, como combate corpo a corpo ou à distância.', labels: ['Tipo de arma', 'Tipo de ataque'] },
    damageType: { title: 'Tipo de dano', text: 'Classifica o dano, por exemplo corte ou impacto. Pode ser usado por regras e gatilhos do Sistema.', labels: ['Tipo de dano'] },
    baseDamage: { title: 'Dano base', text: 'Dano antes dos modificadores do ataque. Para ataques à distância, configure também o dano de cada alcance.', labels: ['Dano Base', 'Dano corpo a corpo'] },
    areaDamage: { title: 'Dano em área', text: 'Valor de dano para a modalidade em área. Para uma condição atingir todos os inimigos, configure também quem recebe a condição.', labels: ['Dano em Área'] },
    preciseDamage: { title: 'Dano preciso', text: 'Valor de dano da modalidade precisa. Não é um bônus somado automaticamente a todo ataque.', labels: ['Dano Preciso'] },
    cadence: { title: 'Cadência da arma', text: 'Na rolagem manual da ficha, limita a quantidade em uma rolagem. No roguelike, não é o teto de tiros por turno: use os limites do Sistema ou da arma. Também define as balas por rajada quando esse consumo não foi preenchido.', labels: ['Cadência por turno'] },
    uses: { title: 'Usos até a pausa', text: 'Quantidade de usos antes de precisar de uma pausa para voltar a usar. Não é a quantidade de unidades do inventário.', labels: ['Usos até a pausa'] },
    stamina: { title: 'Estamina por ação', text: 'Custo de estamina do ataque. Quando aparece “2ª+”, o gasto começa no segundo ataque, conforme o tipo da arma.', labels: ['Estamina por ação', 'Estamina por ação (2ª+)'] },
    ammunition: { title: 'Controle de munição', text: 'Mostra os campos de munição e ativa seu controle nas rolagens. No roguelike, armas com carregador também consomem munição mesmo se esta opção antiga estiver desmarcada. O gasto é por tiro ou rajada, não por ficar um turno sem atacar.', labels: ['Controlar munição pela engine'] },
    magazine: { title: 'Capacidade do carregador', text: 'Quantidade de balas que cabem no carregador. Não define o limite de tiros por turno; apenas impede disparar mais do que o carregador comporta.', labels: ['Capacidade de munição'] },
    currentAmmo: { title: 'Munição atual', text: 'Balas carregadas na ficha, usadas nas rolagens manuais. No roguelike, cada combate começa com o carregador cheio, sem alterar a ficha original.', labels: ['Munição atual'] },
    ammoPerShot: { title: 'Munição por tiro', text: 'Balas gastas a cada tiro, mesmo se errar. Com valor 1, três tiros no turno gastam três balas. Isso não limita quantos tiros podem ser escolhidos.', labels: ['Munição por tiro'] },
    ammoPerBurst: { title: 'Munição por rajada', text: 'Balas gastas por rajada completa, mesmo se errar. Com valor 5, duas rajadas gastam dez balas. Vazio ou zero usa a cadência como consumo da rajada.', labels: ['Munição por rajada'] },
    attackLimit: { title: 'Limite desta arma', text: 'Teto extra de ataques agrupados no turno desta arma. Zero não impõe limite próprio; os limites do Sistema, do carregador e dos recursos continuam valendo. Vale o menor limite aplicável.', labels: ['Limite de ataques por turno (0 = livre)'] },
    shotLimit: { title: 'Tiros por turno desta arma', text: 'Teto extra de tiros individuais desta arma no roguelike. Zero deixa o limite para o Sistema e os recursos. Se o Sistema permite 5 e esta arma permite 3, o máximo é 3.', labels: ['Limite de tiros por turno (0 = livre)'] },
    burstLimit: { title: 'Rajadas por turno desta arma', text: 'Teto extra de rajadas completas, não de balas. Zero não impõe limite próprio. O teto do Sistema e a munição ainda podem reduzir a quantidade disponível.', labels: ['Limite de rajadas por turno (0 = livre)'] },
    modifiers: { title: 'Modificadores de combate', text: 'Escolhe quais ajustes de combate configurar. No automático, eles seguem o tipo de arma.', labels: ['Modificadores de combate'] },
    accuracy: { title: 'Acerto', text: 'Dado de acerto registrado neste conteúdo. O teste publicado define as regras da rolagem quando uma especificação de teste está configurada.', labels: ['Acerto'] },
    weaponTest: { title: 'Teste da arma', text: 'Indica se a arma exige uma rolagem para agir. A especificação abaixo permite escolher o teste publicado usado por ela.', labels: ['Esta arma aplica teste'] },
    protection: { title: 'Proteção', text: 'Barra que absorve dano antes da vida. O valor gasto continua gasto ao desequipar; é preciso reparar para recuperar.', labels: ['Proteção Base', 'Proteção'] },
    armor: { title: 'Armadura', text: 'Defesa fixa que reduz o dano recebido. Não é uma barra e não é consumida a cada golpe.', labels: ['Armadura Base', 'Armadura', 'Defesa'] },
    shield: { title: 'Escudo', text: 'Absorve dano de um único impacto e acaba nesse impacto, mesmo que sobre valor. O dano que ultrapassar o escudo segue para as outras defesas.', labels: ['Escudo Base', 'Escudo'] },
    vitalBonus: { title: 'Bônus vitais', text: 'Ajustam os limites de vida, mana ou estamina enquanto a prótese estiver equipada. Aumentar o limite não cura o valor atual.', labels: ['Bônus vitais'] },
    attributeBonus: { title: 'Bônus de atributos', text: 'Ajustam os atributos enquanto a prótese estiver equipada. Valores positivos aumentam e negativos diminuem.', labels: ['Bônus de atributos'] },
    installation: { title: 'Instalação da prótese', text: 'Indica onde a prótese é instalada. Com teste configurado, ela também pode atacar; sem teste, funciona como equipamento passivo.', labels: ['Instalação'] },
    modificationSlots: { title: 'Slots de modificação', text: 'Quantidade de espaços de modificação registrada na prótese. Descrever uma melhoria não cria um efeito automático.', labels: ['Slots de modificação'] },
    lacrimaSlots: { title: 'Slots de lácrima', text: 'Quantidade de espaços para lácrimas registrada na prótese. Os efeitos precisam estar configurados nos campos próprios para funcionar no jogo.', labels: ['Slots de lácrima'] },
    enhancements: { title: 'Aprimoramentos', text: 'Registra efeitos especiais, modificações e lácrimas. Estes textos explicam a prótese; bônus e condições automáticos são configurados nos campos próprios.', labels: ['Aprimoramentos'] },
    restore: { title: 'Recuperação imediata', text: 'Quantidade recuperada ao consumir uma unidade, até o limite atual do recurso. Para recuperar a cada turno, adicione uma condição de regeneração.', labels: ['Restaura Vida', 'Restaura Mana', 'Restaura Estamina', 'Recuperação de vida', 'Recuperação de mana', 'Recuperação de estamina'] },
    narrativeEffect: { title: 'Descrição do efeito', text: 'Texto para explicar o efeito. Ele não é lido como regra automática: use bônus, dano, recuperação ou condições para configurar o que o jogo aplica.', labels: ['Efeito', 'Especial', 'Bonûs'] },
    narrativeDuration: { title: 'Duração descritiva', text: 'Texto livre para consulta. Para o jogo contar a duração de uma condição, preencha a duração em turnos ou horas dentro de Condições aplicadas.', labels: ['Duração', 'Duração do efeito'] },
    cooldownText: { title: 'Intervalo descritivo', text: 'Descrição do intervalo entre usos. Para o combate contar esse intervalo, use o campo numérico Cooldown (turnos).', labels: ['Cooldown'] },
    cooldown: { title: 'Cooldown em turnos', text: 'Intervalo de turnos entre usos desta ação. Zero significa sem intervalo adicional.', labels: ['Cooldown (turnos)'] },
    slot: { title: 'Slot do acessório', text: 'Nome do encaixe onde o acessório é instalado na arma.', labels: ['Slot'] },
    compatibility: { title: 'Compatibilidade', text: 'Limita os tipos de armas em que o acessório pode ser instalado.', labels: ['Compatibilidade com armas'] },
    weaponModifiers: { title: 'Modificadores', text: 'Valores positivos dão bônus e negativos aplicam penalidades. Em Gasto de estamina, um valor negativo reduz o custo. Efeitos escritos em texto servem para consulta.', labels: ['Modificadores'] },
    accessories: { title: 'Acessórios da arma', text: 'Instale acessórios já cadastrados. Seus modificadores se somam aos da arma quando forem compatíveis; confira os totais em Resultado com acessórios.', labels: ['Acessórios'] },
    removeConditions: { title: 'Remover condições com magia', text: 'Escolha as condições que esta magia pode remover ao acertar. A condição também precisa permitir recuperação por magia no Sistema.', labels: ['Remover condições ao acertar (magia)'] },
  },
  test: {
    section: { title: 'Teste da ação', text: 'Escolha uma regra de rolagem publicada no Sistema. Ela define o dado e como o resultado é interpretado.', labels: ['Teste na engine', 'Esta ação exige teste', 'Usar especificação de teste desta arma', 'Teste publicado', 'Código do teste'] },
    attribute: { title: 'Atributo do teste', text: 'Atributo da ficha que entra no cálculo desta rolagem. Deixe vazio para não indicar um atributo adicional aqui.', labels: ['Atributo (opcional)'] },
    mode: { title: 'Modo fixo', text: 'Fixa a rolagem em normal, vantagem ou desvantagem. Sem modo fixo, ele pode ser escolhido na rolagem.', labels: ['Modo fixo'] },
    group: { title: 'Grupo do atributo', text: 'Indica em qual grupo da ficha buscar o atributo. Use Detectar na ficha se não precisar fixar o grupo.', labels: ['Grupo do atributo'] },
    total: { title: 'Faixas de resultado', text: 'Marcado: compara o total, com os modificadores, às faixas do teste. Desmarcado: usa o número natural do dado.', labels: ['Usar o total nas faixas de resultado'] },
  },
  condition: {
    section: { title: 'Condições aplicadas', text: 'Escolha uma condição criada no Sistema. Os ajustes feitos aqui valem só para este item ou poder; campos vazios mantêm o padrão do Sistema.', labels: ['Condições aplicadas', 'Condição'] },
    value: { title: 'Valor do efeito', text: 'Substitui o valor padrão apenas nesta origem. Respeite o tipo de efeito: ajustes de atributo aceitam sinais; recuperação usa valor positivo. Vazio mantém o padrão.', labels: ['Valor do primeiro efeito (opcional)'] },
    duration: { title: 'Duração da condição', text: 'Substitui a duração padrão para esta aplicação. As formas de encerrar a condição, como descanso ou cura, continuam definidas no Sistema.', labels: ['Duração (opcional)'] },
    unit: { title: 'Contagem da duração', text: 'Turnos avançam no combate. Horas avançam somente pelo tempo de jogo de eventos e descansos, não pelo relógio real.', labels: ['Duração em'] },
    trigger: { title: 'Quando aplicar', text: 'Escolha o que faz este conteúdo aplicar a condição: uso, acerto, resultado do dado ou equipamento, conforme as opções disponíveis.', labels: ['Quando aplicar'] },
    target: { title: 'Quem recebe a condição', text: 'Escolha se o efeito vai para quem usa, para o alvo da ação ou para todos os inimigos.', labels: ['Quem recebe a condição'] },
    natural: { title: 'Resultado natural', text: 'Número mostrado no dado, antes de somar atributos ou bônus. Separe números por vírgula ou use os limites do intervalo.', labels: ['Números naturais (ex.: 18, 19, 20)', 'Do resultado natural (inclusive)', 'Até o resultado natural (inclusive)'] },
    result: { title: 'Resultado do Sistema', text: 'Aplica quando o teste recebe esta classificação, como crítico. As classificações vêm da versão do Sistema.', labels: ['Qual resultado do Sistema?'] },
    reaction: { title: 'Teste de reação', text: 'Cada afetado rola os dados e soma o atributo escolhido. Se atingir o total mínimo, evita a condição. A reação não gasta o turno dele.', labels: ['Passa com total ≥', 'Atributo do afetado'] },
  },
  binding: {
    section: { title: 'Sistema de RPG', text: 'Define quais regras este conteúdo usa como referência. Mudar o vínculo não reescreve os valores já cadastrados.', labels: ['Sistema de RPG', 'Sistema'] },
    fixed: { title: 'Versão fixa', text: 'Mantém a referência nesta versão publicada, mesmo depois de o Sistema receber novas versões.', labels: ['Versão fixa publicada'] },
    follow: { title: 'Acompanhar publicação atual', text: 'Usa a publicação mais recente como referência. Isso não atualiza automaticamente os números já salvos neste conteúdo.', labels: ['Acompanhar publicação atual'] },
  },
  race: {
    status: { title: 'Status base da raça', text: 'Valores iniciais usados como base na ficha. Se vierem da versão do Sistema, ficam somente leitura aqui.', labels: ['Status base'] },
    initialAttribute: { title: 'Atributo inicial', text: 'Atributo de referência inicial desta raça. Quando a raça é gerenciada pelo Sistema, esta escolha também é feita por lá.', labels: ['Atributo Inicial'] },
    capacity: { title: 'Capacidade de carga', text: 'Carga inicial que um personagem desta raça pode carregar antes de exceder o limite.', labels: ['Capacidade de Carga'] },
    passives: { title: 'Habilidades passivas', text: 'Registre o nome e a explicação de cada passiva racial. Texto livre não é convertido em efeito automático pelo jogo.', labels: ['Habilidades passivas'] },
    variations: { title: 'Variações da raça', text: 'Descreva variações desta raça e seus efeitos para consulta. A imagem é opcional e tem recorte quadrado.', labels: ['Variações'] },
  },
  character: {
    race: { title: 'Raça do personagem', text: 'Escolher uma raça preenche os status iniciais a partir dela. Confira esses valores antes de salvar, especialmente ao trocar a raça.', labels: ['Raça'] },
    alignment: { title: 'Alinhamento', text: 'Resume a postura moral do personagem. É uma informação de interpretação, não uma regra automática de combate.', labels: ['Alinhamento'] },
    related: { title: 'Personagens relacionados', text: 'Pesquise e selecione personagens para criar vínculos na wiki. Isso não adiciona aliados à batalha.', labels: ['Personagens relacionados'] },
    nanites: { title: 'Nanites', text: 'Quantidade de moeda registrada na ficha. O saldo de uma run é uma cópia e não altera a ficha original.', labels: ['Nanites'] },
    passive: { title: 'Passiva antiga', text: 'Campo legado, sem aplicação na criação atual. Ele não cria uma passiva nem configura um efeito automático.', labels: ['Idpassiva'] },
    ultimate: { title: 'Ultimate', text: 'Campo legado, sem aplicação na criação atual. Poderes executáveis precisam de configuração própria; este texto não os cria.', labels: ['Ultimate'] },
    variants: { title: 'Personagem genérico', text: 'Permite várias fichas do mesmo personagem, como versões de um inimigo. Cada variante pode ter status e equipamentos próprios. Ao voltar para único, só a ficha atual é mantida.', labels: ['Personagem genérico (com variantes)'] },
    inventory: { title: 'Inventário do personagem', text: 'Adicione itens existentes e ajuste a cópia desta ficha. Editar os valores desta cópia não muda o cadastro original do item.', labels: ['Inventário'] },
    prostheses: { title: 'Próteses do personagem', text: 'Próteses com teste podem atacar e manter seus bônus. Sem teste, funcionam como equipamento passivo. Configure os valores na edição da prótese.', labels: ['Próteses'] },
    spells: { title: 'Magias do personagem', text: 'Cadastre o custo e edite os atributos da magia para configurar dano, teste e condições. A descrição sozinha não executa efeitos.', labels: ['Magias'] },
    skills: { title: 'Skills do personagem', text: 'Configure os atributos da skill, seu teste e condições. Texto livre de bônus ou efeito serve para consulta, não substitui esses campos.', labels: ['Skills'] },
    capacity: { title: 'Capacidade de carga', text: 'Limite de carga deste personagem, não o peso que ele está carregando agora.', labels: ['Carga'] },
    defenses: { title: 'Defesas', text: 'Proteção é uma barra que absorve dano; armadura reduz o dano sem se gastar; escudo absorve um único impacto e acaba. Estes são os valores próprios do personagem, além dos equipamentos.', labels: ['Defesas'] },
  },
  page: {
    description: { title: 'Descrição da página', text: 'Resumo curto da página. O conteúdo completo é montado nos blocos abaixo.', labels: ['Descrição (opcional)'] },
    blocks: { title: 'Blocos da página', text: 'Monte a página com texto, imagens, galeria e referências. A ordem dos blocos é a ordem de leitura; arraste para reorganizar.', labels: ['Blocos da Página'] },
    lore: { title: 'InfoLore', text: 'Vincula um InfoLore já cadastrado a esta página. Pesquise e selecione o conteúdo que deseja mostrar.', labels: ['Buscar InfoLore'] },
    references: { title: 'Referências da página', text: 'Conecta a página a conteúdos já cadastrados. Você pode escolher conteúdo oculto que administra; leitores verão um card censurado.', labels: ['Referências da página'] },
  },
  city: {
    places: { title: 'Pontos de interesse', text: 'Locais importantes dentro desta cidade. Adicione nome, descrição curta e, se quiser, uma imagem para cada um.', labels: ['Pontos de interesse'] },
  },
} satisfies Record<string, Record<string, Explanation>>;

export type WikiContentHelpScope = keyof typeof wikiContentHelpCatalogue;
const normalize = (label: string) => label.trim().replace(/\s*\*$/, '').toLocaleLowerCase('pt-BR');
const indexes = new Map(Object.entries(wikiContentHelpCatalogue).map(([scope, entries]) => {
  const exact = new Map<string, FieldHelpContent>();
  const labels = new Map<string, FieldHelpContent>();
  for (const [key, entry] of Object.entries(entries)) {
    const content: FieldHelpContent = { id: `wiki.content.${scope}.${key}`, title: entry.title,
      text: entry.text, presentation: { density: 'compact' } };
    exact.set(key, content);
    for (const label of entry.labels) labels.set(normalize(label), content);
  }
  return [scope, { exact, labels }];
}));

// Indexed once, with stable references: typing never rebuilds the help catalogue.
export const wikiContentHelpResolvers = Object.fromEntries([...indexes].map(([scope, index]) =>
  [scope, (target: string) => index.exact.get(target) ?? index.labels.get(normalize(target))],
)) as Record<WikiContentHelpScope, (target: string) => FieldHelpContent | undefined>;

export const getWikiContentHelp = (scope: WikiContentHelpScope, target: string) =>
  wikiContentHelpResolvers[scope](target);
