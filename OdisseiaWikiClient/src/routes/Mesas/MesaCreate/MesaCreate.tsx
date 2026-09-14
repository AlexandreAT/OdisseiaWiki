import AutorenewOutlinedIcon from '@mui/icons-material/AutorenewOutlined';
import { useSelector } from 'react-redux';
import { AnimatedBackground } from '../../../components/Generic/AnimatedBackground/AnimatedBackground';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { ImageUploader } from '../../../components/Generic/ImageUploader/ImageUploader';
import { InputText } from '../../../components/Generic/InputText/InputText';
import { Select } from '../../../components/Generic/Select/Select';
import { MesaHudDecor } from '../components/MesaHudDecor/MesaHudDecor';
import { ActionButton, CheckFilter, FieldLabel, FormColumn, FormFooter, FormFrame, FormGrid, MesaPage, PageHeader } from '../Mesas.style';
import { useMesaCreate } from './useMesaCreate';
import type { MesaThemeState } from '../MesaThemeState';

const MesaCreate = () => {
  const { theme, neon } = useSelector((state: MesaThemeState) => state.themesReducer);
  const state = useMesaCreate();
  const isNeonActive = neon === 'on';

  return (
    <>
      <AnimatedBackground type="distant" skipIntro />
      <MesaPage $neon={isNeonActive}>
        <PageHeader $neon={isNeonActive}>
          <MesaHudDecor neon={isNeonActive} />
          <div><h1>Criar nova Mesa</h1><p>Prepare sua campanha e escolha o Sistema que regerá os personagens.</p></div>
        </PageHeader>
        <FormFrame $neon={isNeonActive}>
          <MesaHudDecor neon={isNeonActive} />
          <FormGrid onSubmit={(event) => { event.preventDefault(); void state.submit(); }}>
            <FormColumn>
              <ImageUploader
                theme={theme}
                neon={neon}
                cropPreset={{ mode: 'single', aspectRatio: 16 / 9, shape: 'rectangle', displayShape: 'rectangle' }}
                initialImage={state.bannerPreview}
                onImageCropped={(result) => state.setBanner(result.file, result.preview)}
                onRemove={state.removeBanner}
                label="Banner da Mesa"
                mobileSize="full"
              />
              <InputText theme={theme} neon={neon} label="Nome da Mesa" value={state.form.nome} onChange={(event) => state.update('nome', event.target.value)} required width="100%" height="52px" />
              <FieldLabel><span>Descrição</span><textarea maxLength={500} value={state.form.descricao} onChange={(event) => state.update('descricao', event.target.value)} /><small>{state.form.descricao.length} / 500</small></FieldLabel>
            </FormColumn>
            <FormColumn>
              <Select theme={theme} neon={neon} label="Sistema" value={state.form.idSistemaRpg ?? ''} onChange={(event) => state.update('idSistemaRpg', Number(event.target.value))} options={state.systems.map((system) => ({ value: system.idSistemaRpg, label: system.nome }))} required width="100%" height="52px" portal />
              <Select theme={theme} neon={neon} label="Versão do Sistema" value={state.form.idSistemaVersao ?? ''} onChange={(event) => state.update('idSistemaVersao', Number(event.target.value))} options={state.versions.map((version) => ({ value: version.idSistemaVersao, label: version.numeroVersao }))} required width="100%" height="52px" portal />
              <ActionButton type="button" onClick={state.useLatest}><AutorenewOutlinedIcon /> Usar versão mais recente</ActionButton>
              <CheckFilter><input type="checkbox" checked={state.form.acompanharVersaoAtual} onChange={(event) => state.update('acompanharVersaoAtual', event.target.checked)} /> Acompanhar publicação atual do Sistema</CheckFilter>
              <InputText theme={theme} neon={neon} type="number" label="Limite de jogadores" value={state.form.limiteJogadores} onChange={(event) => state.update('limiteJogadores', Number(event.target.value))} required width="100%" height="52px" />
              <InputText theme={theme} neon={neon} label="Tags (separadas por vírgula)" value={state.form.tags} onChange={(event) => state.update('tags', event.target.value)} width="100%" height="52px" />
            </FormColumn>
            <FormFooter>
              <CyberButton theme={theme} neon={neon} colorType="primary" text={state.saving ? 'Criando Mesa...' : 'Criar Mesa'} onClick={() => void state.submit()} width="min(460px, 100%)" disabled={state.saving} />
            </FormFooter>
          </FormGrid>
        </FormFrame>
      </MesaPage>
    </>
  );
};

export default MesaCreate;
