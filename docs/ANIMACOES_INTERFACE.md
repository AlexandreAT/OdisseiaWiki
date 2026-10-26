# Animações da interface

A preferência é única para páginas, modais (inclusive portais), wiki e jogo. O botão ao lado do neon alterna **completas → reduzidas → seguir o dispositivo** e salva a escolha no navegador (`odisseia:motion`). O padrão é completas, conforme a restauração solicitada: desativar animações no Windows não deve desligar silenciosamente os efeitos do site. A opção de seguir o dispositivo continua disponível.

- Inicializar `initializeMotionPreference()` antes de renderizar a aplicação.
- Em componentes React, usar `useMotionReduced()`; em cálculos pontuais, `isMotionReduced()`. Para acompanhar alterações fora do React, usar `subscribeMotionPreference()` e remover a assinatura no cleanup.
- Em styled-components, colocar a alternativa reduzida em `:root[data-motion='reduced'] & { ... }`. Não consultar `prefers-reduced-motion` diretamente em cada componente: apenas `motionPreference.ts` interpreta essa preferência, quando o modo escolhido é dispositivo.
- O neon controla iluminação; a preferência de animações controla movimento. Não vincular feedback de dano, XP ou entrada de loot ao neon ou à largura da tela.
- Manter o conteúdo final legível no modo reduzido, sem ocultar resultados, atrasar o combate ou alterar regras/valores do jogo.

`ScrollRevealBlock` mantém as animações existentes de contêiner, títulos, textos e imagens. A entrada ocorre na primeira exibição e ao retornar depois de sair completamente da tela. Oscilar no limiar não reinicia o efeito. `ResizeObserver` recalcula o limiar quando imagens/conteúdo mudam de tamanho; observadores antigos são ignorados e limpos ao desmontar. Sem IntersectionObserver, o conteúdo fica visível.

Testes: `motionPreference.test.mjs` cobre desktop/mobile, armazenamento, mudança entre abas e preferência do dispositivo; `motionStyles.test.mjs` verifica o CSS gerado de scroll, XP, level up e loot; `visualStability.test.mjs` cobre o ciclo de entrada, retorno, redimensionamento e redução de movimento.
