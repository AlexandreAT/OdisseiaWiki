import {
  BadgeOutlined,
  DeleteForeverOutlined,
  EmailOutlined,
  KeyOutlined,
  LockOutlined,
  PersonOutline,
  PhoneOutlined,
  SaveOutlined,
} from '@mui/icons-material';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { CyberButton } from '../../components/Generic/HighlightButton/HighlightButton';
import { DialogActionButton } from '../../components/Generic/ConfirmDialog/ConfirmDialog.style';
import { ImageUploader } from '../../components/Generic/ImageUploader';
import type { CropResult } from '../../components/Generic/ImageUploader/types';
import { InputText } from '../../components/Generic/InputText/InputText';
import { LoadingIndicator } from '../../components/Generic/LoadingIndicator';
import { Modal } from '../../components/Generic/Modal/Modal';
import { ActionButton } from '../Mesas/Mesas.style';
import { UserCharacters } from '../Hub/UserCharacters/UserCharacters';
import { UserTables } from '../Hub/UserTables/UserTables';
import type { MesaThemeState } from '../Mesas/MesaThemeState';
import { saveAsset } from '../../services/assetsService';
import { clearAuthSession, storeAuthSession } from '../../services/authSession';
import {
  deleteCurrentUserAccount,
  getCurrentUserProfile,
  requestCurrentUserPasswordRecovery,
  updateCurrentUserProfile,
  type UsuarioPerfil,
} from '../../services/usuarioService';
import { getApiErrorMessage } from '../../utils/apiError';
import { normalizeImagePath } from '../Wiki/utils/imagePathHelper';
import {
  forgetRememberedManualLogin,
  getRememberedManualLogin,
  rememberManualLogin,
} from '../../utils/rememberedLogin';
import {
  AvatarColumn,
  DangerArea,
  DataRow,
  DeleteModalActions,
  DeleteModalContent,
  DetailsColumn,
  EditableRow,
  EmbeddedContent,
  ProfileActions,
  ProfileError,
  ProfileFrame,
  ProfileGrid,
  ProfileLoading,
  ProfilePage,
  SectionHeading,
} from './Profile.style';

const DELETE_CONFIRMATION = 'DELETAR MINHA CONTA';

export const Profile = () => {
  const { theme, neon } = useSelector((state: MesaThemeState) => state.themesReducer);
  const [profile, setProfile] = useState<UsuarioPerfil | null>(null);
  const [nickname, setNickname] = useState('');
  const [nicknameError, setNicknameError] = useState<string>();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [requestingPassword, setRequestingPassword] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setLoadError(undefined);
    try {
      const data = await getCurrentUserProfile();
      setProfile(data);
      setNickname(data.nickname);
    } catch (error) {
      setLoadError(getApiErrorMessage(error, 'Não foi possível carregar seu perfil.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleAvatarCrop = (result: CropResult) => {
    setAvatarFile(result.file);
    setAvatarRemoved(false);
  };

  const handleSave = async () => {
    if (!profile) return;

    const normalizedNickname = nickname.trim();
    if (normalizedNickname.length < 2) {
      setNicknameError('Nickname deve ter pelo menos 2 caracteres.');
      return;
    }
    if (normalizedNickname.length > 50) {
      setNicknameError('Nickname deve ter no máximo 50 caracteres.');
      return;
    }

    setSaving(true);
    try {
      let imagemUrl = avatarRemoved ? null : profile.imagemUrl;
      if (avatarFile) {
        const uploaded = await saveAsset({
          imageFile: avatarFile,
          type: 'perfil',
          entityName: `usuario-${profile.id}`,
          folderName: 'avatar',
        });
        imagemUrl = uploaded.url ?? uploaded.path;
      }

      const updated = await updateCurrentUserProfile({
        nickname: normalizedNickname,
        imagemUrl,
      });
      const rememberedLogin = getRememberedManualLogin();
      if (rememberedLogin.localeCompare(profile.nickname, 'pt-BR', { sensitivity: 'base' }) === 0) {
        rememberManualLogin(updated.perfil.nickname);
      }
      storeAuthSession(updated.tokenJwt);
      setProfile(updated.perfil);
      setNickname(updated.perfil.nickname);
      setAvatarFile(null);
      setAvatarRemoved(false);
      toast.success('Perfil atualizado.');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível atualizar o perfil.'));
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordRequest = async () => {
    setRequestingPassword(true);
    const result = await requestCurrentUserPasswordRecovery();
    setRequestingPassword(false);
    if (!result.sucesso) {
      toast.error(result.mensagemErro ?? 'Não foi possível enviar o e-mail.');
      return;
    }
    toast.success('Enviamos as instruções para o seu e-mail.');
  };

  const handleDelete = async () => {
    if (deleteConfirmation !== DELETE_CONFIRMATION) return;

    setDeleting(true);
    try {
      await deleteCurrentUserAccount(deleteConfirmation);
      forgetRememberedManualLogin();
      clearAuthSession();
      toast.success('Conta excluída.');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Não foi possível excluir a conta.'));
      setDeleting(false);
    }
  };

  if (loading) {
    return <ProfileLoading><LoadingIndicator label="Carregando perfil" /></ProfileLoading>;
  }

  if (!profile || loadError) {
    return (
      <ProfileError>
        <p>{loadError ?? 'Perfil não encontrado.'}</p>
        <CyberButton
          theme={theme}
          neon={neon}
          text="Tentar novamente"
          onClick={() => void loadProfile()}
          width="190px"
        />
      </ProfileError>
    );
  }

  return (
    <ProfilePage>
      <ProfileFrame neon={neon === 'on'}>
        <SectionHeading>
          <h1>Perfil do usuário</h1>
          <p>Consulte seus dados e mantenha sua foto e seu nickname atualizados.</p>
        </SectionHeading>
        <ProfileGrid>
          <AvatarColumn>
            <ImageUploader
              theme={theme}
              neon={neon}
              cropPreset={{ mode: 'single', aspectRatio: 1, shape: 'circle', displayShape: 'circle' }}
              initialImage={avatarRemoved ? undefined : normalizeImagePath(profile.imagemUrl ?? undefined)}
              onImageCropped={handleAvatarCrop}
              onRemove={() => {
                setAvatarFile(null);
                setAvatarRemoved(true);
              }}
              label="Foto de perfil"
              mobileSize="main"
            />
            <p>Clique na foto para selecionar, recortar ou alterar a imagem.</p>
          </AvatarColumn>
          <DetailsColumn>
            <DataRow>
              <PersonOutline />
              <span className="profile-label">Nome</span>
              <span className="profile-value">{profile.nome}</span>
              <span className="profile-readonly">Somente leitura</span>
            </DataRow>
            <DataRow>
              <EmailOutlined />
              <span className="profile-label">E-mail</span>
              <span className="profile-value">{profile.email}</span>
              <span className="profile-readonly">Somente leitura</span>
            </DataRow>
            <DataRow>
              <PhoneOutlined />
              <span className="profile-label">Celular</span>
              <span className="profile-value">{profile.celular || 'Não informado'}</span>
              <span className="profile-readonly">Somente leitura</span>
            </DataRow>
            <DataRow>
              <LockOutlined />
              <span className="profile-label">Senha</span>
              <span className="profile-value" aria-label="Senha protegida">********</span>
              <ActionButton
                className="profile-action"
                type="button"
                $compact
                $accent="pink"
                disabled={requestingPassword}
                onClick={() => void handlePasswordRequest()}
              >
                <KeyOutlined /> {requestingPassword ? 'Enviando...' : 'Solicitar mudança'}
              </ActionButton>
            </DataRow>
            <EditableRow>
              <BadgeOutlined />
              <span className="profile-label">Nickname</span>
              <div className="profile-field">
                <InputText
                  theme={theme}
                  neon={neon}
                  label="Nickname"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  onFocus={() => setNicknameError(undefined)}
                  error={Boolean(nicknameError)}
                  errorMessage={nicknameError}
                  required
                  width="100%"
                  name="nickname"
                  autoComplete="username"
                />
              </div>
            </EditableRow>
            <ProfileActions>
              <CyberButton
                theme={theme}
                neon={neon}
                text="Salvar alterações"
                onClick={() => void handleSave()}
                loading={saving}
                width="210px"
              >
                <SaveOutlined /> Salvar alterações
              </CyberButton>
            </ProfileActions>
          </DetailsColumn>
        </ProfileGrid>
      </ProfileFrame>

      <ProfileFrame neon={neon === 'on'}>
        <SectionHeading>
          <h2>Mesas</h2>
          <p>Suas Mesas criadas e as campanhas das quais você participa.</p>
        </SectionHeading>
        <EmbeddedContent>
          <UserTables theme={theme} neon={neon} embedded />
        </EmbeddedContent>
      </ProfileFrame>

      <ProfileFrame neon={neon === 'on'}>
        <SectionHeading>
          <h2>Personagens</h2>
          <p>Gerencie seus personagens com os mesmos recursos da área dedicada.</p>
        </SectionHeading>
        <EmbeddedContent>
          <UserCharacters theme={theme} neon={neon} userId={profile.id} />
        </EmbeddedContent>
      </ProfileFrame>

      <ProfileFrame neon={neon === 'on'} color="var(--neonRed)">
        <DangerArea>
          <div>
            <h2>Excluir conta</h2>
            <p>A exclusão é permanente. Suas Mesas compartilhadas permanecem, mas seus dados pessoais, vínculos e personagens serão removidos.</p>
          </div>
          <ActionButton type="button" $accent="red" onClick={() => setDeleteOpen(true)}>
            <DeleteForeverOutlined /> Excluir conta
          </ActionButton>
        </DangerArea>
      </ProfileFrame>

      {deleteOpen && (
        <Modal
          title="Excluir conta permanentemente"
          theme={theme}
          neon={neon}
          width="min(560px, 94vw)"
          onClose={() => {
            if (!deleting) {
              setDeleteOpen(false);
              setDeleteConfirmation('');
            }
          }}
          footer={(
            <DeleteModalActions>
              <DialogActionButton
                disabled={deleting}
                onClick={() => {
                  setDeleteOpen(false);
                  setDeleteConfirmation('');
                }}
              >
                Cancelar
              </DialogActionButton>
              <DialogActionButton
                $danger
                disabled={deleting || deleteConfirmation !== DELETE_CONFIRMATION}
                onClick={() => void handleDelete()}
              >
                {deleting ? 'Excluindo...' : 'Excluir conta'}
              </DialogActionButton>
            </DeleteModalActions>
          )}
        >
          <DeleteModalContent>
            <p>Esta operação não pode ser desfeita. Para confirmar, digite <strong>{DELETE_CONFIRMATION}</strong>.</p>
            <InputText
              theme={theme}
              neon={neon}
              label="Confirmação"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              width="100%"
              autoComplete="off"
            />
          </DeleteModalContent>
        </Modal>
      )}
    </ProfilePage>
  );
};

export default Profile;
