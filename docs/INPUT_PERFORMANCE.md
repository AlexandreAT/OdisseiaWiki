# Digitação e desempenho dos formulários

Os controles compartilhados mantêm o contrato síncrono: cada `onChange` recebe o evento original durante a digitação. Não há debounce, cópia atrasada do evento nem estado local pendente de salvar. Transformações, rejeições de valor e validações do formulário continuam responsáveis pelo valor exibido.

## Otimizações compartilhadas

- InputText, TextArea, Search, StatusInput, Select, CheckSelect, CheckBox e RichTextEditor separam callbacks de identidade instável da renderização memoizada do controle.
- `useEventCallback` mantém a identidade do handler e chama a implementação do último commit. Não substitua isso por um comparador que simplesmente ignore callbacks: isso faria campos usarem valores antigos do formulário.
- Selects com opções equivalentes reaproveitam a lista. Mudanças de valor, rótulo e descrição continuam invalidando a apresentação. Listas/objetos do formulário devem ser atualizados imutavelmente, como o restante do estado React.
- O valor vazio padrão de CheckSelect é estável. Uma nova lista vazia a cada render provocava sincronizações de estado repetidas quando `value` não era informado.
- As ajudas usam índices estáticos por chave/alias e referências estáveis. O provider da aba não muda a função de resolução a cada tecla.
- As tabelas do Sistema reaproveitam linhas não alteradas, mas continuam reagindo a erros, ordem, opções, funções de renderização e modo somente leitura. Callbacks de edição operam sobre as linhas atuais.
- A busca só classifica sugestões quando elas podem ser mostradas. O editor rich text não relê/serializa uma transação que ele acabou de entregar ao pai quando recebe a mesma referência de volta; substituições externas continuam normalizadas.
- Os snapshots usados para detectar alterações no jogo e no Sistema são memorizados por seus dados reais, evitando serializar a configuração durante buscas, abertura de modais e outras alterações independentes. A trava de alterações não salvas permanece ativa.

## Testes

`node --test tests/inputPerformance.test.mjs tests/systemHelp.test.mjs`

O teste compara o mesmo controle antes/depois da memoização: em um formulário de 100 campos com callbacks inline, uma tecla recriava as propriedades nativas dos 100 controles; agora somente o alterado é recriado. Isso mede trabalho de renderização, não latência em milissegundos em um aparelho real.

Também verifica callback atualizado e síncrono, evento de composição, limpeza/substituição de valor, salvar imediatamente, ref, seleção numérica, limites, validação nativa, sugestões, calculadora, rolagem da textarea, opções dinâmicas e ações/validação das tabelas. `react-test-renderer` é dependência apenas de desenvolvimento; os ícones decorativos são substituídos no teste, não no código do site.

Na conferência manual, digite rapidamente em nomes, números e descrições no gerenciamento e nas fichas; alterne campos, cole texto com acentos, apague valores, use o salvamento rápido, teste limites/erros, calculadora e autocomplete. Confira também os avisos ao sair sem salvar. Não introduza atraso de propagação para mascarar um formulário pesado.
