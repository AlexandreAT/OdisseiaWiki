using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Settings;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.Extensions.Options;
using System.Security.Cryptography;

namespace OdisseiaWiki.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly IUsuarioRepository _repository;
        private readonly IUsuarioEmailTokenRepository _emailTokenRepository;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly IAssetService _assetService;
        private readonly IMesaRealtimeNotifier _mesaRealtimeNotifier;
        private readonly GoogleAuthSettings _googleAuthSettings;
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<UsuarioService> _logger;

        public UsuarioService(
            IUsuarioRepository repository,
            IUsuarioEmailTokenRepository emailTokenRepository,
            ITokenService tokenService,
            IEmailService emailService,
            IAssetService assetService,
            IMesaRealtimeNotifier mesaRealtimeNotifier,
            IOptions<GoogleAuthSettings> googleAuthOptions,
            IOptions<EmailSettings> emailOptions,
            ILogger<UsuarioService> logger)
        {
            _repository = repository;
            _emailTokenRepository = emailTokenRepository;
            _tokenService = tokenService;
            _emailService = emailService;
            _assetService = assetService;
            _mesaRealtimeNotifier = mesaRealtimeNotifier;
            _googleAuthSettings = googleAuthOptions.Value;
            _emailSettings = emailOptions.Value;
            _logger = logger;
        }

        public async Task<ResultRegisterUsuario> Register(RegisterUsuarioDto usuarioDto)
        {
            ResultRegisterUsuario validacao = await ValidateRegister(usuarioDto);
            if (!validacao.Sucesso)
                return validacao;

            Usuario usuario = new Usuario
            {
                Nome = usuarioDto.Nome,
                Email = usuarioDto.Email.Trim(),
                Senha = PasswordHasher.Hash(usuarioDto.Senha),
                Nickname = usuarioDto.Nickname.Trim(),
                Celular = string.IsNullOrWhiteSpace(usuarioDto.Celular) ? null : usuarioDto.Celular.Trim(),
                ImagemUrl = usuarioDto.ImagemUrl,
                DataRegistro = DateTime.UtcNow,
                EmailConfirmado = false,
            };

            Usuario criado;
            try
            {
                criado = await _repository.CreateAsync(usuario);
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException exception)
                when (exception.InnerException is MySqlConnector.MySqlException { Number: 1062 })
            {
                return ResultRegisterUsuario.Falha("Nickname já está em uso.");
            }
            ResultAccountAction envio = await CriarEEnviarTokenAsync(
                criado,
                UsuarioEmailTokenTipo.ConfirmacaoEmail);
            if (!envio.Sucesso)
            {
                await RemoverCadastroIncompletoAsync(criado.Idusuario);
                return ResultRegisterUsuario.Falha(envio.MensagemErro!);
            }

            return ResultRegisterUsuario.Ok(criado);
        }

        public async Task<ResultLoginUsuario> LoginGoogleAsync(string tokenJwtGoogle)
        {
            try
            {
                var payload = await GoogleJwtHelper.ValidarTokenAsync(
                    tokenJwtGoogle,
                    _googleAuthSettings.ClientId);
                if (payload == null)
                    return ResultLoginUsuario.Falha("Token inválido.");

                if (!payload.EmailVerified)
                    return ResultLoginUsuario.Falha("O e-mail da conta Google não foi verificado.");

                string? email = payload.Email?.Trim();
                if (string.IsNullOrWhiteSpace(email))
                    return ResultLoginUsuario.Falha("A conta Google não informou um e-mail válido.");

                string nome = string.IsNullOrWhiteSpace(payload.Name)
                    ? email.Split('@', 2)[0]
                    : payload.Name.Trim();
                string? imagem = payload.Picture;

                Usuario? usuario = await _repository.GetByEmailAsync(email);
                if (usuario == null)
                {
                    string? baseNick = nome.Split(" ").FirstOrDefault()?.ToLower() ?? "user";
                    string? nickname = await GenerateNicknameUniqueAsync(baseNick);

                    usuario = new Usuario
                    {
                        Nome = nome,
                        Email = email,
                        Nickname = nickname,
                        ImagemUrl = imagem,
                        DataRegistro = DateTime.UtcNow,
                        Senha = Guid.NewGuid().ToString(),
                        EmailConfirmado = true,
                    };

                    await _repository.CreateAsync(usuario);
                }
                else if (!usuario.EmailConfirmado)
                {
                    usuario.EmailConfirmado = true;
                    await _repository.UpdateAsync(usuario);
                }

                string? token = _tokenService.GerarToken(usuario, emailVerified: usuario.EmailConfirmado);
                return ResultLoginUsuario.Ok(token);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Erro inesperado durante o login com Google.");
                return ResultLoginUsuario.Falha("Não foi possível autenticar com o Google.");
            }
        }

        private async Task<ResultRegisterUsuario> ValidateRegister(RegisterUsuarioDto usuarioDto)
        {
            if (string.IsNullOrWhiteSpace(usuarioDto.Email))
                return ResultRegisterUsuario.Falha("Email é obrigatório.");

            string? passwordError = PasswordValidator.Validate(usuarioDto.Senha);
            if (passwordError != null)
                return ResultRegisterUsuario.Falha(passwordError);

            if (string.IsNullOrWhiteSpace(usuarioDto.Nome))
                return ResultRegisterUsuario.Falha("Nome é obrigatório.");

            if (string.IsNullOrWhiteSpace(usuarioDto.Nickname))
                return ResultRegisterUsuario.Falha("Nickname é obrigatório.");

            string nickname = usuarioDto.Nickname.Trim();
            if (nickname.Length < 2)
                return ResultRegisterUsuario.Falha("Nickname deve ter pelo menos 2 caracteres.");
            if (nickname.Length > 50)
                return ResultRegisterUsuario.Falha("Nickname deve ter no máximo 50 caracteres.");

            Usuario? existente = await _repository.GetByEmailAsync(usuarioDto.Email.Trim());
            if (existente != null)
                return ResultRegisterUsuario.Falha("Email já registrado.");

            if (await _repository.NicknameExistsAsync(nickname))
                return ResultRegisterUsuario.Falha("Nickname já está em uso.");

            return ResultRegisterUsuario.Ok(null!);
        }

        private async Task<string> GenerateNicknameUniqueAsync(string baseNickname)
        {
            const int tamanhoMaximo = 50;
            string nicknameBase = string.IsNullOrWhiteSpace(baseNickname)
                ? "user"
                : baseNickname.Trim();
            nicknameBase = nicknameBase[..Math.Min(nicknameBase.Length, tamanhoMaximo)];

            string nickname = nicknameBase;
            int count = 1;
            while (await _repository.GetByNicknameAsync(nickname) is not null)
            {
                string sufixo = count.ToString();
                int tamanhoDisponivel = tamanhoMaximo - sufixo.Length;
                nickname = $"{nicknameBase[..Math.Min(nicknameBase.Length, tamanhoDisponivel)]}{sufixo}";
                count++;
            }
            return nickname;
        }

        public async Task<ResultLoginUsuario> Login(LoginUsuarioDto usuarioDto)
        {
            string identificador = usuarioDto.Nickname?.Trim() ?? string.Empty;
            Usuario? usuario = await _repository.GetByLoginAsync(identificador);

            if (usuario == null || !PasswordHasher.Verify(usuarioDto.Senha, usuario.Senha))
                return ResultLoginUsuario.Falha("Credenciais inválidas.");

            if (!usuario.EmailConfirmado)
            {
                return ResultLoginUsuario.Falha(
                    "Confirme seu e-mail para entrar. Você pode solicitar um novo link.",
                    emailNaoConfirmado: true,
                    email: usuario.Email);
            }

            string token = _tokenService.GerarToken(usuario, emailVerified: usuario.EmailConfirmado);
            return ResultLoginUsuario.Ok(token);
        }

        public async Task<ResultAccountAction> ConfirmarEmailAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                return ResultAccountAction.Falha("Link de confirmação inválido ou expirado.");

            Usuario? usuario = await _emailTokenRepository.ConsumeEmailConfirmationAsync(
                HashToken(token),
                DateTime.UtcNow);

            return usuario == null
                ? ResultAccountAction.Falha("Link de confirmação inválido ou expirado.")
                : ResultAccountAction.Ok();
        }

        public async Task ReenviarConfirmacaoEmailAsync(string email)
        {
            Usuario? usuario = await FindUnconfirmedUserByEmailAsync(email);
            if (usuario == null)
                return;

            ResultAccountAction envio = await CriarEEnviarTokenAsync(
                usuario,
                UsuarioEmailTokenTipo.ConfirmacaoEmail);
            if (!envio.Sucesso)
                _logger.LogWarning("Não foi possível reenviar a confirmação de e-mail.");
        }

        public async Task SolicitarRedefinicaoSenhaAsync(string email)
        {
            Usuario? usuario = await FindUserByEmailAsync(email);
            if (usuario == null)
                return;

            ResultAccountAction envio = await CriarEEnviarTokenAsync(
                usuario,
                UsuarioEmailTokenTipo.RedefinicaoSenha);
            if (!envio.Sucesso)
                _logger.LogWarning("Não foi possível enviar a recuperação de senha.");
        }

        public async Task<ResultAccountAction> RedefinirSenhaAsync(RedefinirSenhaDto dto)
        {
            string? passwordError = PasswordValidator.Validate(dto.NovaSenha);
            if (passwordError != null)
                return ResultAccountAction.Falha(passwordError);

            if (!string.Equals(dto.NovaSenha, dto.ConfirmacaoSenha, StringComparison.Ordinal))
                return ResultAccountAction.Falha("As senhas não coincidem.");

            if (string.IsNullOrWhiteSpace(dto.Token))
                return ResultAccountAction.Falha("Link de redefinição inválido ou expirado.");

            Usuario? usuario = await _emailTokenRepository.ConsumePasswordResetAsync(
                HashToken(dto.Token),
                PasswordHasher.Hash(dto.NovaSenha),
                DateTime.UtcNow);

            return usuario == null
                ? ResultAccountAction.Falha("Link de redefinição inválido ou expirado.")
                : ResultAccountAction.Ok();
        }

        public async Task<UsuarioPerfilDto?> ObterPerfilAsync(int idUsuario)
        {
            Usuario? usuario = await _repository.GetByIdAsync(idUsuario);
            return usuario is null ? null : MapPerfil(usuario);
        }

        public async Task<ResultUsuarioPerfil> AtualizarPerfilAsync(
            int idUsuario,
            AtualizarUsuarioPerfilDto dto)
        {
            Usuario? usuario = await _repository.GetByIdAsync(idUsuario);
            if (usuario is null)
                return ResultUsuarioPerfil.Falha("Usuário não encontrado.");

            string nickname = dto.Nickname?.Trim() ?? string.Empty;
            if (nickname.Length < 2)
                return ResultUsuarioPerfil.Falha("Nickname deve ter pelo menos 2 caracteres.");
            if (nickname.Length > 50)
                return ResultUsuarioPerfil.Falha("Nickname deve ter no máximo 50 caracteres.");
            if (await _repository.NicknameExistsAsync(nickname, idUsuario))
                return ResultUsuarioPerfil.Falha("Nickname já está em uso.");

            string? imagemAnterior = usuario.ImagemUrl;
            usuario.Nickname = nickname;
            usuario.ImagemUrl = string.IsNullOrWhiteSpace(dto.ImagemUrl)
                ? null
                : dto.ImagemUrl.Trim();

            try
            {
                await _repository.UpdateAsync(usuario);
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException exception)
                when (exception.InnerException is MySqlConnector.MySqlException { Number: 1062 })
            {
                return ResultUsuarioPerfil.Falha("Nickname já está em uso.");
            }

            if (!string.Equals(imagemAnterior, usuario.ImagemUrl, StringComparison.Ordinal))
                await _assetService.DeleteIfUnreferencedAsync(imagemAnterior);

            return ResultUsuarioPerfil.Ok(new UsuarioPerfilAtualizadoDto
            {
                Perfil = MapPerfil(usuario),
                TokenJwt = _tokenService.GerarToken(usuario, usuario.EmailConfirmado),
            });
        }

        public async Task<ResultAccountAction> SolicitarRedefinicaoSenhaDoUsuarioAsync(int idUsuario)
        {
            Usuario? usuario = await _repository.GetByIdAsync(idUsuario);
            return usuario is null
                ? ResultAccountAction.Falha("Usuário não encontrado.")
                : await CriarEEnviarTokenAsync(usuario, UsuarioEmailTokenTipo.RedefinicaoSenha);
        }

        public async Task<ResultAccountAction> ExcluirContaAsync(int idUsuario, string confirmacao)
        {
            if (!string.Equals(confirmacao, "DELETAR MINHA CONTA", StringComparison.Ordinal))
                return ResultAccountAction.Falha("Digite a confirmação exatamente como solicitado.");

            UsuarioExclusaoDados? dados = await _repository.DeleteAccountAsync(idUsuario);
            if (dados is null)
                return ResultAccountAction.Falha("Usuário não encontrado.");

            HashSet<string> assets = AssetReferenceHelper.Extract(dados.ImagemPerfil);
            foreach (PersonagemJogador personagem in dados.Personagens)
            {
                assets.UnionWith(AssetReferenceHelper.Extract(
                    personagem.Imagem,
                    personagem.GaleriaImagem,
                    personagem.InventarioJson,
                    personagem.Skills,
                    personagem.Magia,
                    personagem.Historia,
                    personagem.Implantes,
                    personagem.Ultimate));
            }

            await AssetReferenceHelper.DeleteAllAsync(_assetService, assets);
            foreach (int idMesa in dados.MesasAfetadas)
            {
                try
                {
                    await _mesaRealtimeNotifier.RevogarAcessoUsuarioAsync(idMesa, idUsuario);
                    await _mesaRealtimeNotifier.NotificarMesaAlteradaAsync(idMesa);
                }
                catch (Exception exception)
                {
                    _logger.LogWarning(
                        exception,
                        "A conta foi excluída, mas não foi possível atualizar uma conexão ativa da Mesa {IdMesa}.",
                        idMesa);
                }
            }

            return ResultAccountAction.Ok();
        }

        private static UsuarioPerfilDto MapPerfil(Usuario usuario)
            => new()
            {
                Id = usuario.Idusuario,
                Nome = usuario.Nome,
                Email = usuario.Email,
                Celular = usuario.Celular,
                Nickname = usuario.Nickname,
                ImagemUrl = usuario.ImagemUrl,
            };

        private async Task<Usuario?> FindUnconfirmedUserByEmailAsync(string email)
        {
            Usuario? usuario = await FindUserByEmailAsync(email);
            return usuario is { EmailConfirmado: false } ? usuario : null;
        }

        private async Task<Usuario?> FindUserByEmailAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return null;

            return await _repository.GetByEmailAsync(email.Trim());
        }

        private async Task<ResultAccountAction> CriarEEnviarTokenAsync(
            Usuario usuario,
            UsuarioEmailTokenTipo tipo)
        {
            if (!_emailService.IsConfigured)
                return ResultAccountAction.Falha("O envio de e-mail ainda não está configurado.");

            DateTime agora = DateTime.UtcNow;
            DateTime expiracao = tipo == UsuarioEmailTokenTipo.ConfirmacaoEmail
                ? agora.AddHours(_emailSettings.ConfirmacaoEmailValidadeHoras)
                : agora.AddMinutes(_emailSettings.RedefinicaoSenhaValidadeMinutos);
            string token = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(32));

            bool tokenSalvo = false;
            try
            {
                await _emailTokenRepository.CreateReplacingActiveAsync(new UsuarioEmailToken
                {
                    Idusuario = usuario.Idusuario,
                    Tipo = tipo,
                    HashToken = HashToken(token),
                    DataCriacao = agora,
                    DataExpiracao = expiracao,
                }, agora);
                tokenSalvo = true;

                if (tipo == UsuarioEmailTokenTipo.ConfirmacaoEmail)
                    await _emailService.SendEmailConfirmationAsync(usuario, token, expiracao);
                else
                    await _emailService.SendPasswordResetAsync(usuario, token, expiracao);

                return ResultAccountAction.Ok();
            }
            catch (EmailDeliveryException exception)
            {
                await InvalidarTokenEmCasoDeFalhaAsync(usuario.Idusuario, tipo, tokenSalvo);
                _logger.LogWarning(exception, "Não foi possível enviar um e-mail de conta.");
                return ResultAccountAction.Falha("Não foi possível enviar o e-mail. Tente novamente mais tarde.");
            }
            catch (Exception exception)
            {
                await InvalidarTokenEmCasoDeFalhaAsync(usuario.Idusuario, tipo, tokenSalvo);
                _logger.LogError(exception, "Não foi possível preparar um e-mail de conta.");
                return ResultAccountAction.Falha("Não foi possível preparar o e-mail. Tente novamente.");
            }
        }

        private async Task InvalidarTokenEmCasoDeFalhaAsync(
            int idUsuario,
            UsuarioEmailTokenTipo tipo,
            bool tokenSalvo)
        {
            if (!tokenSalvo)
                return;

            try
            {
                await _emailTokenRepository.InvalidateActiveAsync(idUsuario, tipo, DateTime.UtcNow);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Não foi possível invalidar um token de e-mail após falha no envio.");
            }
        }

        private async Task RemoverCadastroIncompletoAsync(int idUsuario)
        {
            try
            {
                await _repository.DeleteAsync(idUsuario);
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Não foi possível remover um cadastro sem confirmação de e-mail.");
            }
        }

        private static string HashToken(string token)
        {
            byte[] hash = SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(hash);
        }
    }
}
