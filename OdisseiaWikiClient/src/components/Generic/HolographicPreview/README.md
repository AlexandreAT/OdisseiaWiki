# HolographicPreview

Prévia holográfica padrão, independente das regras do jogo. Reutiliza `HudFrame`, `FallbackImage` e a preferência central de movimento. O combate e o histórico usam esta mesma implementação.

Sem opções novas, mantém exatamente o visual anterior: quadrado de até 360px, paleta ciano, fonte especial no título, fundo escuro, traço desenhado desde a origem, scanlines e transições. Neon só acrescenta os efeitos que já existiam; não altera a animação básica. Nenhuma opção muda o tema global.

## Uso isolado

```tsx
import { HolographicPreview } from '.../components/Generic/HolographicPreview';

<HolographicPreview
  media={{
    name: item.nome,
    src: item.imagem,
    icon: <InventoryIcon />,
    description: item.descricaoCurta, // Opcional; texto, não HTML.
  }}
  appearance={{ neon: neon === 'on', color: 'var(--clearneonGreen)' }}
  className="miniatura"
>
  <img src={item.imagem} alt="" />
</HolographicPreview>
```

O conteúdo filho é o gatilho; `className`, `style`, `ref`, `aria-label`, `disabled` e eventos nativos configuram esse botão. O tipo padrão é `button`, sem enviar formulários. O ícone é o fallback da projeção quando a imagem estiver ausente ou falhar. Normalize URLs no consumidor, como já ocorre no combate.

## Listas e páginas com várias imagens

Use **um provider por superfície**, não um provider por linha. Assim só existe uma projeção aberta por vez. Em modais, o portal permanece dentro do diálogo para preservar o escopo de foco.

```tsx
import {
  HolographicPreviewProvider,
  HolographicPreviewTrigger,
} from '.../components/Generic/HolographicPreview';

<HolographicPreviewProvider
  neon={neon === 'on'}
  color="var(--clearneonBlue)"
  onOpenChange={setInspectingImage}
>
  {items.map(item => (
    <HolographicPreviewTrigger
      key={item.id}
      media={{ name: item.nome, src: item.imagem, description: item.resumo }}
      appearance={item.lendario ? { color: 'var(--clearneonYellow)' } : undefined}
      className="miniatura"
    >
      <img src={item.imagem} alt="" />
    </HolographicPreviewTrigger>
  ))}
</HolographicPreviewProvider>
```

## Configuração

`HolographicPreviewAppearance` é aceito diretamente no provider e por `appearance` no componente isolado e nos gatilhos. A opção do gatilho tem precedência sobre a do provider, incluindo `neon: false`.

| Propriedade | Padrão | Uso |
| --- | --- | --- |
| `color` | Ciano do site | Cor CSS para título, linha, origem, cantos, borda, fechamento, fallback e efeitos. Aceita variáveis da paleta. |
| `neon` | `false` | Controla os efeitos neon existentes; o consumidor passa a preferência da página. |
| `size` | `360` | Tamanho máximo do quadrado em pixels, limitado ao viewport. Valores inválidos usam o padrão. |
| `background` | Gradiente escuro atual | Fundo CSS da projeção, sem mudar seu formato. |
| `textColor` | `var(--whitesmoke)` | Cor do texto descritivo; título e bordas continuam na cor de destaque. |
| `imageFit` | `contain` | `contain` preserva a imagem inteira; `cover` preenche sua área. |

`media` contém `name`, `src?`, `icon?` e `description?`. A descrição é escapada como texto, preserva quebras de linha e ganha rolagem quando longa. Sem descrição, não há linha, espaço ou elemento extra no painel.

Para uma lista ou painel informativo somente de leitura, use `media.content?: ReactNode`. Ele substitui apenas a imagem; linha, geometria centralizada, moldura, animação, cor, neon e descrição opcional continuam iguais. A região de conteúdo tem rolagem e recebe foco com Tab quando a projeção é fixada por clique. O fechamento passa a se chamar “Fechar informações”. Evite controles interativos dentro de `content`; essa região foi feita para consultar informações, não para novos formulários. Prefira um gatilho com `aria-label` próprio, como “Modificadores de Resistência: +2”.

O provider e o componente isolado também aceitam `hoverCloseDelay` (350ms por padrão) e `onOpenChange`. O callback informa abertura/fechamento uma vez por transição, inclusive ao desmontar uma prévia aberta; ele não pausa nada sozinho. O combate continua responsável por pausar/retomar sua reprodução.

O gatilho aceita `activation="hover-click"` (padrão) ou `activation="click"` para não abrir no hover/foco. Clique fixa a projeção; outro clique na mesma origem, o botão de fechar, clique fora ou Escape fecham. Eventos nativos são compostos; `preventDefault()` cancela o comportamento correspondente da prévia.

Foco, retorno à origem, Tab/Shift+Tab, Escape, reposicionamento durante scroll/resize, fallback e movimento reduzido permanecem centralizados. A descrição fixada é acessível por teclado. A cor e os estilos do gatilho não vazam para outras projeções.
