import React from 'react';
import TuneIcon from '@mui/icons-material/Tune';
import { CheckBox } from '../Generic/CheckBox/CheckBox';
import { CyberButton } from '../Generic/HighlightButton/HighlightButton';
import { LoadingIndicator } from '../Generic/LoadingIndicator';
import { Modal } from '../Generic/Modal/Modal';
import {
  CAMPOS_PERSONAGEM_VISIBILIDADE,
  criarVisibilidadePadrao,
  definirTodosCamposVisiveis,
  GRUPOS_PERSONAGEM_VISIBILIDADE,
  visibilidadesSaoIguais,
  type CampoPersonagemVisibilidade,
  type PersonagemVisibilidade,
} from '../../models/PersonagemVisibilidade';
import {
  atualizarVisibilidadePersonagem,
  obterVisibilidadePersonagem,
} from '../../services/personagemVisibilidadeService';
import { getApiErrorMessage } from '../../utils/apiError';
import {
  BulkAction,
  ErrorState,
  Intro,
  LoadingState,
  ModalFooter,
  Toolbar,
  ToolbarActions,
  ToolbarLabel,
  VisibilityGroup,
  VisibilityModalTitle,
  VisibilityOption,
  VisibilityOptionDescription,
  VisibilityOptions,
  VisibilityRoot,
} from './CharacterVisibilityModal.style';
import type { CharacterVisibilityModalProps } from './CharacterVisibilityModal.types';

const isValidCharacterId = (id: number | null | undefined): id is number => (
  typeof id === 'number' && Number.isInteger(id) && id > 0
);

export const CharacterVisibilityModal = ({
  open,
  characterId,
  characterType,
  characterName,
  theme,
  neon,
  onClose,
  onSaved,
}: CharacterVisibilityModalProps) => {
  const [visibilidade, setVisibilidade] = React.useState<PersonagemVisibilidade | null>(null);
  const [visibilidadeSalva, setVisibilidadeSalva] = React.useState<PersonagemVisibilidade | null>(null);
  const [carregando, setCarregando] = React.useState(false);
  const [salvando, setSalvando] = React.useState(false);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open) {
      setVisibilidade(null);
      setVisibilidadeSalva(null);
      setCarregando(false);
      setErro(null);
      return undefined;
    }

    if (!isValidCharacterId(characterId)) {
      setVisibilidade(null);
      setVisibilidadeSalva(null);
      setCarregando(false);
      setErro('Não foi possível identificar o personagem para configurar a visibilidade.');
      return undefined;
    }

    let ativo = true;
    setCarregando(true);
    setErro(null);
    const configuracaoInicial = criarVisibilidadePadrao(characterType);
    setVisibilidade(configuracaoInicial);
    setVisibilidadeSalva(configuracaoInicial);

    void obterVisibilidadePersonagem(characterType, characterId)
      .then((configuracao) => {
        if (!ativo) return;
        setVisibilidade(configuracao);
        setVisibilidadeSalva(configuracao);
      })
      .catch((requestError: unknown) => {
        if (!ativo) return;
        setVisibilidade(null);
        setVisibilidadeSalva(null);
        setErro(getApiErrorMessage(
          requestError,
          'Não foi possível carregar a configuração de visibilidade.',
        ));
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });

    return () => {
      ativo = false;
    };
  }, [characterId, characterType, open]);

  const atualizarCampo = React.useCallback((campo: CampoPersonagemVisibilidade, valor: boolean) => {
    if (salvando) return;

    setVisibilidade((configuracaoAtual) => (
      configuracaoAtual ? { ...configuracaoAtual, [campo]: valor } : configuracaoAtual
    ));
  }, [salvando]);

  const definirTodos = React.useCallback((valor: boolean) => {
    if (salvando) return;

    setVisibilidade((configuracaoAtual) => (
      configuracaoAtual ? definirTodosCamposVisiveis(configuracaoAtual, valor) : configuracaoAtual
    ));
  }, [salvando]);

  const salvar = React.useCallback(async () => {
    if (!visibilidade || !isValidCharacterId(characterId) || salvando) return;

    setSalvando(true);
    setErro(null);

    try {
      const configuracaoSalva = await atualizarVisibilidadePersonagem(
        characterType,
        characterId,
        visibilidade,
      );
      setVisibilidade(configuracaoSalva);
      setVisibilidadeSalva(configuracaoSalva);
      onSaved?.(configuracaoSalva);
      onClose();
    } catch (requestError: unknown) {
      setErro(getApiErrorMessage(
        requestError,
        'Não foi possível salvar a configuração de visibilidade.',
      ));
    } finally {
      setSalvando(false);
    }
  }, [characterId, characterType, onClose, onSaved, salvando, visibilidade]);

  const temAlteracoes = Boolean(
    visibilidade
    && visibilidadeSalva
    && !visibilidadesSaoIguais(visibilidade, visibilidadeSalva),
  );
  const todosVisiveis = Boolean(
    visibilidade
    && Object.values(visibilidade).every((valor) => valor),
  );
  const todosOcultos = Boolean(
    visibilidade
    && Object.values(visibilidade).every((valor) => !valor),
  );

  if (!open) return null;

  return (
    <Modal
      title={(
        <VisibilityModalTitle $theme={theme} $neon={neon === 'on'}>
          <TuneIcon aria-hidden="true" />
          <strong>
            Dados visíveis{characterName ? ` — ${characterName}` : ''}
          </strong>
        </VisibilityModalTitle>
      )}
      theme={theme}
      neon={neon}
      width="1120px"
      mobileInset
      onClose={salvando ? undefined : onClose}
      footer={(
        <ModalFooter>
          <CyberButton
            theme={theme}
            neon={neon}
            colorType="secondary"
            text="Cancelar"
            onClick={onClose}
            disabled={salvando}
            width="120px"
          />
          <CyberButton
            theme={theme}
            neon={neon}
            colorType="primary"
            text="Salvar"
            onClick={() => void salvar()}
            disabled={!temAlteracoes || carregando || salvando}
            loading={salvando}
            width="120px"
          />
        </ModalFooter>
      )}
    >
      <VisibilityRoot $theme={theme} $neon={neon === 'on'}>
        <Intro $theme={theme}>
          Escolha quais dados da ficha podem ser exibidos. A visibilidade geral do personagem é configurada separadamente.
        </Intro>

        {erro && <ErrorState role="alert">{erro}</ErrorState>}

        {carregando && (
          <LoadingState $theme={theme}>
            <LoadingIndicator label="Carregando configuração" />
          </LoadingState>
        )}

        {visibilidade && !carregando && (
          <>
            <Toolbar $theme={theme} $neon={neon === 'on'}>
              <ToolbarLabel $theme={theme}>Ações rápidas</ToolbarLabel>
              <ToolbarActions>
                <BulkAction
                  type="button"
                  $primary
                  $theme={theme}
                  $neon={neon === 'on'}
                  onClick={() => definirTodos(true)}
                  disabled={salvando || todosVisiveis}
                >
                  Mostrar todos
                </BulkAction>
                <BulkAction
                  type="button"
                  $theme={theme}
                  $neon={neon === 'on'}
                  onClick={() => definirTodos(false)}
                  disabled={salvando || todosOcultos}
                >
                  Ocultar todos
                </BulkAction>
              </ToolbarActions>
            </Toolbar>

            {GRUPOS_PERSONAGEM_VISIBILIDADE.map((grupo) => (
              <VisibilityGroup key={grupo.id} $theme={theme} $neon={neon === 'on'}>
                <legend>{grupo.titulo}</legend>
                <VisibilityOptions $saving={salvando} aria-busy={salvando}>
                  {grupo.campos.map((campo) => {
                    const definicao = CAMPOS_PERSONAGEM_VISIBILIDADE[campo];
                    const campoVisivel = visibilidade[campo];

                    return (
                      <VisibilityOption
                        key={campo}
                        $theme={theme}
                        $neon={neon === 'on'}
                        $visible={campoVisivel}
                      >
                        <CheckBox
                          neon={neon}
                          checked={campoVisivel}
                          onChange={(valor) => atualizarCampo(campo, valor)}
                          label={definicao.rotulo}
                          disabled={salvando}
                        />
                        <VisibilityOptionDescription $theme={theme}>
                          {definicao.descricao}
                        </VisibilityOptionDescription>
                      </VisibilityOption>
                    );
                  })}
                </VisibilityOptions>
              </VisibilityGroup>
            ))}
          </>
        )}
      </VisibilityRoot>
    </Modal>
  );
};
