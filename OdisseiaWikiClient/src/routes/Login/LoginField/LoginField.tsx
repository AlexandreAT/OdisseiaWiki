import { useState } from 'react';
import { Form, InputContainer, ButtonContainer, GoogleLoginContainer, CheckboxContainer, LinkContainer } from './LoginField.style';
import { CyberButton } from '../../../components/Generic/HighlightButton/HighlightButton';
import { InputText } from '../../../components/Generic/InputText/InputText';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode  } from 'jwt-decode';
import toast from 'react-hot-toast';
import { SpanLink } from '../../../components/Generic/SpanLink/SpanLink';
import { CheckBox } from '../../../components/Generic/CheckBox/CheckBox';
import TitleGlitch from '../../../components/Generic/TitleGlitch/TitleGlitch';
import { loginComGoogle, LoginGoogleDto, login } from '../../../services/usuarioService';
import { useNavigate } from 'react-router-dom';

interface Props {
    theme: 'dark' | 'light';
    neon: 'on' | 'off';
    onRegisterClick?: () => void;
}

export const LoginField = ({ theme, neon, onRegisterClick }: Props) => {
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [userError, setUserError] = useState(false);
    const [passError, setPassError] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        let hasError = false;

        if (!userName.trim() || userName.length < 3) {
            setUserError(true);
            hasError = true;
            toast.error('Nome de usuário incorreto!');
        } else {
            setUserError(false);
        }

        if (!password.trim() || password.length < 6) {
            setPassError(true);
            hasError = true;
            toast.error('Senha incorreta!');
        } else {
            setPassError(false);
        }

        if (hasError) return;

        try {
            const result = await login({ nickname: userName, senha: password });

            if (result.sucesso && result.tokenJwt) {
                localStorage.setItem('token', result.tokenJwt);

                const payload: any = jwtDecode(result.tokenJwt);
                localStorage.setItem('usuario', JSON.stringify({
                    nickname: payload.nickname,
                    imagemUrl: payload.imagemUrl,
                    email: payload.email,
                    id: payload.id
                }));

                toast.success('Login realizado com sucesso!');
                navigate('/');
            } else {
                toast.error(result.mensagemErro ?? 'Credenciais inválidas.');
            }
        } catch (error) {
            console.error('Erro ao fazer login:', error);
            toast.error('Erro ao tentar logar. Tente novamente.');
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (credentialResponse.credential) {
            const dto: LoginGoogleDto = {
            tokenGoogle: credentialResponse.credential,
            };

            try {
                const result = await loginComGoogle(dto);

                if (result.sucesso && result.tokenJwt) {
                    localStorage.setItem('token', result.tokenJwt);

                    const payload: any = jwtDecode(result.tokenJwt);
                    localStorage.setItem('usuario', JSON.stringify({
                        nickname: payload.nickname,
                        imagemUrl: payload.imagemUrl,
                        email: payload.email,
                        id: payload.id
                    }));

                    toast.success('Login realizado com sucesso!');
                    navigate('/');
                } else {
                    toast.error(result.mensagemErro ?? 'Erro inesperado no login com Google');
                }
            } catch (error) {
                toast.error('Falha ao autenticar com o Google');
            }
        }
    };

    const handleGoogleError = () => {
        toast.error('O login com o Google falhou!');
        console.log('Google Login Falhou');
    };

    return (
        <Form onSubmit={handleSubmit}>
            <TitleGlitch theme={theme} neon={neon} text='Login'></TitleGlitch>
            <InputContainer>
                <InputText
                    theme={theme}
                    neon={neon}
                    label="Nome de usuário"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    onFocus={() => setUserError(false)}
                    error={userError}
                    required
                    width='100%'
                />
                <InputText
                    theme={theme}
                    neon={neon}
                    label="Senha"
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setPassError(false)}
                    error={passError}
                    required
                    typeStyle="secondary"
                    width='100%'
                />
            </InputContainer>
            <ButtonContainer>
                <CyberButton colorType="secondary" width='160px' text="Registrar-se" theme={theme} neon={neon} onClick={onRegisterClick}/>
                <CyberButton colorType="primary" text="Logar" theme={theme} neon={neon} type='submit' width='160px'/>
            </ButtonContainer>
            <GoogleLoginContainer>
                <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    theme={theme === 'dark' ? "filled_black" : "outline"}
                />
            </GoogleLoginContainer>
            <CheckboxContainer>
                <CheckBox neon={neon} label='Manter login' />
            </CheckboxContainer>
            <LinkContainer>
                <SpanLink theme={theme} neon={neon} link='/' colorScheme='pinkBlue'>Não consegue iniciar a sessão?</SpanLink>
            </LinkContainer>
        </Form>
    )
}