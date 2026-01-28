using OdisseiaWiki.Dtos;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;

namespace OdisseiaWiki.Services
{
    public class UsuarioService : IUsuarioService
    {
        private readonly IUsuarioRepository _repository;
        private readonly ITokenService _tokenService;

        public UsuarioService(IUsuarioRepository repository, ITokenService tokenService)
        {
            _repository = repository;
            _tokenService = tokenService;
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
            var payload = await GoogleJwtHelper.ValidarTokenAsync(tokenJwtGoogle);
            if (payload == null)
                return ResultLoginUsuario.Falha("Token inválido.");

            string? email = payload.Email;
            string? nome = payload.Name;
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
                    Senha = Guid.NewGuid().ToString()
                };

                await _repository.CreateAsync(usuario);
            }

            string? token = _tokenService.GerarToken(usuario);
            return ResultLoginUsuario.Ok(token);
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