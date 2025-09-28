import React, { useState } from 'react'
import { Form, InputsController, ContainerInputs, ContainerAvatar, ContainerButtons } from './RegisterField.style';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { InputText } from '../../../components/Generic/InputText/InputText';
import toast from 'react-hot-toast';
import TitleGlitch from '../../../components/Generic/TitleGlitch/TitleGlitch';
import { RegisterFormErrors, validateRegisterForm } from './useRegisterField';
import { formatPhone } from '../../../utils/formatPhone';
import { registerUsuario } from '../../../services/usuarioService';
import { AvatarIcon } from '../../../components/Generic/AvatarIcon/AvatarIcon';

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
    onBackToLogin?: () => void;
}

const RegisterField = ({ theme, neon, onBackToLogin }: Props) => {
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string>('');

    const [userError, setUserError] = useState(false);
    const [emailError, setEmailError] = useState(false);
    const [phoneError, setPhoneError] = useState(false);
    const [passError, setPassError] = useState(false);
    const [nicknameError, setNicknameError] = useState(false);

    const [errors, setErrors] = useState<RegisterFormErrors>({});

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const validationErrors = validateRegisterForm({
            userName,
            email,
            phone,
            password,
            nickname
        });
        
        setErrors(validationErrors);

        if (Object.keys(validationErrors).length > 0) {
            setUserError(!!validationErrors.userName);
            setEmailError(!!validationErrors.email);
            setPhoneError(!!validationErrors.phone);
            setPassError(!!validationErrors.password);
            setNicknameError(!!validationErrors.nickname);

            return;
        }
        try {
            const payload = {
                nome: userName,
                email,
                senha: password,
                nickname,
                imagemUrl: avatarUrl
            };

            await registerUsuario(payload).then(() => {
                toast.success('Usuário cadastrado com sucesso!');
                if (onBackToLogin) onBackToLogin();
            });
        } catch (error: any) {
            toast.error(error?.response?.data || 'Erro ao registrar');
        }
    };

    return (
        <Form onSubmit={handleSubmit} neon={neon} theme={theme}>
            <TitleGlitch theme={theme} neon={neon} text='registro' />
            <InputsController>
                <ContainerInputs>
                    <InputText
                        theme={theme}
                        neon={neon}
                        label="Nome de usuário"
                        value={userName}
                        onChange={e => setUserName(e.target.value)}
                        onFocus={() => setUserError(false)}
                        error={userError}
                        errorMessage={errors.userName}
                        required
                        width='100%'
                    />
                    <InputText
                        theme={theme}
                        neon={neon}
                        label="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onFocus={() => setEmailError(false)}
                        error={emailError}
                        errorMessage={errors.email}
                        required
                        width='100%'
                    />
                    <InputText
                        theme={theme}
                        neon={neon}
                        label="Celular"
                        value={phone}
                        onChange={e => setPhone(formatPhone(e.target.value))}
                        onFocus={() => setPhoneError(false)}
                        error={phoneError}
                        errorMessage={errors.phone}
                        width='100%'
                    />
                    <InputText
                        theme={theme}
                        neon={neon}
                        label="Senha"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onFocus={() => setPassError(false)}
                        error={passError}
                        errorMessage={errors.password}
                        required
                        width='100%'
                        type="password"
                    />
                </ContainerInputs>
                <ContainerAvatar>
                    <AvatarIcon
                        theme={theme}
                        neon={neon}
                        onFileSelect={(file) => {
                            if (file) {
                                const url = URL.createObjectURL(file);
                                setAvatarUrl(url);
                            }
                        }}
                        initialImage={avatarUrl}
                    />
                    <InputText
                        theme={theme}
                        neon={neon}
                        label="Nickname"
                        value={nickname}
                        onChange={e => setNickname(e.target.value)}
                        onFocus={() => setNicknameError(false)}
                        error={nicknameError}
                        errorMessage={errors.nickname}
                        required
                        width='100%'
                    />
                </ContainerAvatar>
            </InputsController>
            <ContainerButtons>
                <CyberButton
                    colorType="primary"
                    text="Cadastrar"
                    theme={theme}
                    neon={neon}
                    type='submit'
                    width='150px'
                />
                <CyberButton
                    colorType="secondary"
                    text="Voltar"
                    theme={theme}
                    neon={neon}
                    type="button"
                    onClick={onBackToLogin}
                    width='150px'
                />
            </ContainerButtons>
        </Form>
    )
}

export default RegisterField