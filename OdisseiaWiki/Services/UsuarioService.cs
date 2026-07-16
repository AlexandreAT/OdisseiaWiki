using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Settings;
using Microsoft.Extensions.Options;

namespace OdisseiaWiki.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly IUsuarioRepository _repository;
        private readonly ITokenService _tokenService;
        private readonly GoogleAuthSettings _googleAuthSettings;
        private readonly ILogger<UsuarioService> _logger;

        public UsuarioService(
            IUsuarioRepository repository,
            ITokenService tokenService,
            IOptions<GoogleAuthSettings> googleAuthOptions,
            ILogger<UsuarioService> logger)
        {
            _repository = repository;
            _tokenService = tokenService;
            _googleAuthSettings = googleAuthOptions.Value;
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
                Email = usuarioDto.Email,
                Senha = PasswordHasher.Hash(usuarioDto.Senha),
                Nickname = usuarioDto.Nickname,
                ImagemUrl = usuarioDto.ImagemUrl,
                DataRegistro = DateTime.UtcNow
            };

            Usuario criado = await _repository.CreateAsync(usuario);
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

                string? email = payload.Email;
                string? nome = payload.Name;
                string? imagem = payload.Picture;

                Usuario? usuario = await _repository.GetByEmailAsync(payload.Email);
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
                        Senha = Guid.NewGuid().ToString()
                    };

                    await _repository.CreateAsync(usuario);
                }

                string? token = _tokenService.GerarToken(usuario, emailVerified: true);
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

            if (string.IsNullOrWhiteSpace(usuarioDto.Senha) || usuarioDto.Senha.Length < 6)
                return ResultRegisterUsuario.Falha("A senha deve ter pelo menos 6 caracteres.");

            if (string.IsNullOrWhiteSpace(usuarioDto.Nome))
                return ResultRegisterUsuario.Falha("Nome é obrigatório.");

            if (string.IsNullOrWhiteSpace(usuarioDto.Nickname))
                return ResultRegisterUsuario.Falha("Nickname é obrigatório.");

            Usuario? existente = await _repository.GetByEmailAsync(usuarioDto.Email);
            if (existente != null)
                return ResultRegisterUsuario.Falha("Email já registrado.");

            return ResultRegisterUsuario.Ok(null!);
        }

        private async Task<string> GenerateNicknameUniqueAsync(string baseNickname)
        {
            string? nickname = baseNickname;
            int count = 1;
            while (await _repository.GetByNicknameAsync(nickname) is not null)
            {
                nickname = $"{baseNickname}{count}";
                count++;
            }
            return nickname;
        }

        public async Task<ResultLoginUsuario> Login(LoginUsuarioDto usuarioDto)
        {
            Usuario? usuario = await _repository.GetByNicknameAsync(usuarioDto.Nickname);

            if (usuario == null || !PasswordHasher.Verify(usuarioDto.Senha, usuario.Senha))
                return ResultLoginUsuario.Falha("Credenciais inválidas.");

            string token = _tokenService.GerarToken(usuario);
            return ResultLoginUsuario.Ok(token);
        }
    }
}
