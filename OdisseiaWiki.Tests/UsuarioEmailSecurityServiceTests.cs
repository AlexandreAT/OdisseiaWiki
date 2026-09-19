using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Moq;
using OdisseiaWiki.Dtos;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;
using OdisseiaWiki.Services;
using OdisseiaWiki.Services.Helpers;
using OdisseiaWiki.Services.Interfaces;
using OdisseiaWiki.Settings;
using Xunit;

namespace OdisseiaWiki.Tests;

public sealed class UsuarioEmailSecurityServiceTests
{
    [Fact]
    public async Task Register_CriaContaPendenteEEnviaConfirmacaoComTokenNaoPersistidoEmTexto()
    {
        Mock<IUsuarioRepository> usuarioRepository = new();
        Mock<IUsuarioEmailTokenRepository> tokenRepository = new();
        Mock<IEmailService> emailService = new();
        Usuario? persistedUser = null;
        UsuarioEmailToken? persistedToken = null;
        string? sentToken = null;

        usuarioRepository.Setup(repository => repository.GetByEmailAsync("novo@teste.com"))
            .ReturnsAsync((Usuario?)null);
        usuarioRepository.Setup(repository => repository.CreateAsync(It.IsAny<Usuario>()))
            .ReturnsAsync((Usuario usuario) =>
            {
                usuario.Idusuario = 42;
                persistedUser = usuario;
                return usuario;
            });
        tokenRepository.Setup(repository => repository.CreateReplacingActiveAsync(
                It.IsAny<UsuarioEmailToken>(),
                It.IsAny<DateTime>()))
            .Callback<UsuarioEmailToken, DateTime>((token, _) => persistedToken = token)
            .Returns(Task.CompletedTask);
        emailService.SetupGet(service => service.IsConfigured).Returns(true);
        emailService.Setup(service => service.SendEmailConfirmationAsync(
                It.IsAny<Usuario>(),
                It.IsAny<string>(),
                It.IsAny<DateTime>()))
            .Callback<Usuario, string, DateTime>((_, token, _) => sentToken = token)
            .Returns(Task.CompletedTask);

        UsuarioService service = CreateService(
            usuarioRepository.Object,
            tokenRepository.Object,
            emailService.Object);

        ResultRegisterUsuario result = await service.Register(new RegisterUsuarioDto
        {
            Nome = "Novo usuário",
            Email = "novo@teste.com",
            Senha = "senha-segura",
            Nickname = "novo",
        });

        Assert.True(result.Sucesso);
        Assert.NotNull(persistedUser);
        Assert.False(persistedUser!.EmailConfirmado);
        Assert.NotNull(persistedToken);
        Assert.Equal(UsuarioEmailTokenTipo.ConfirmacaoEmail, persistedToken!.Tipo);
        Assert.NotNull(sentToken);
        Assert.NotEqual(sentToken, persistedToken.HashToken);
        Assert.Equal(64, persistedToken.HashToken.Length);
    }

    [Fact]
    public async Task Login_DeContaPendenteNaoGeraJwtEOrientaConfirmacao()
    {
        Mock<IUsuarioRepository> usuarioRepository = new();
        Mock<ITokenService> tokenService = new();
        Usuario usuario = new()
        {
            Idusuario = 9,
            Nome = "Pendente",
            Email = "pendente@teste.com",
            Nickname = "pendente",
            Senha = PasswordHasher.Hash("senha-segura"),
            EmailConfirmado = false,
        };
        usuarioRepository.Setup(repository => repository.GetByLoginAsync("pendente"))
            .ReturnsAsync(usuario);

        UsuarioService service = CreateService(
            usuarioRepository.Object,
            Mock.Of<IUsuarioEmailTokenRepository>(),
            Mock.Of<IEmailService>(),
            tokenService.Object);

        ResultLoginUsuario result = await service.Login(new LoginUsuarioDto
        {
            Nickname = "pendente",
            Senha = "senha-segura",
        });

        Assert.False(result.Sucesso);
        Assert.True(result.EmailNaoConfirmado);
        Assert.Equal(usuario.Email, result.Email);
        tokenService.Verify(service => service.GerarToken(It.IsAny<Usuario>(), It.IsAny<bool>()), Times.Never);
    }

    [Fact]
    public async Task Login_ComEmailGeraTokenParaContaConfirmada()
    {
        Mock<IUsuarioRepository> usuarioRepository = new();
        Mock<ITokenService> tokenService = new();
        Usuario usuario = new()
        {
            Idusuario = 10,
            Nome = "Conta",
            Email = "conta@teste.com",
            Nickname = "conta",
            Senha = PasswordHasher.Hash("senha-segura"),
            EmailConfirmado = true,
        };
        usuarioRepository.Setup(repository => repository.GetByLoginAsync(usuario.Email))
            .ReturnsAsync(usuario);
        tokenService.Setup(service => service.GerarToken(usuario, true)).Returns("token-jwt");

        UsuarioService service = CreateService(
            usuarioRepository.Object,
            Mock.Of<IUsuarioEmailTokenRepository>(),
            Mock.Of<IEmailService>(),
            tokenService.Object);

        ResultLoginUsuario result = await service.Login(new LoginUsuarioDto
        {
            Nickname = usuario.Email,
            Senha = "senha-segura",
        });

        Assert.True(result.Sucesso);
        Assert.Equal("token-jwt", result.TokenJwt);
        usuarioRepository.Verify(repository => repository.GetByLoginAsync(usuario.Email), Times.Once);
    }

    [Fact]
    public async Task Register_QuandoNaoConsegueCriarToken_RemoveCadastroEInformaErroControlado()
    {
        Mock<IUsuarioRepository> usuarioRepository = new();
        Mock<IUsuarioEmailTokenRepository> tokenRepository = new();
        Mock<IEmailService> emailService = new();

        usuarioRepository.Setup(repository => repository.GetByEmailAsync("novo@teste.com"))
            .ReturnsAsync((Usuario?)null);
        usuarioRepository.Setup(repository => repository.CreateAsync(It.IsAny<Usuario>()))
            .ReturnsAsync((Usuario usuario) =>
            {
                usuario.Idusuario = 42;
                return usuario;
            });
        usuarioRepository.Setup(repository => repository.DeleteAsync(42)).ReturnsAsync(true);
        tokenRepository.Setup(repository => repository.CreateReplacingActiveAsync(
                It.IsAny<UsuarioEmailToken>(),
                It.IsAny<DateTime>()))
            .ThrowsAsync(new InvalidOperationException("Falha no banco."));
        emailService.SetupGet(service => service.IsConfigured).Returns(true);

        UsuarioService service = CreateService(
            usuarioRepository.Object,
            tokenRepository.Object,
            emailService.Object);

        ResultRegisterUsuario result = await service.Register(new RegisterUsuarioDto
        {
            Nome = "Novo usuário",
            Email = "novo@teste.com",
            Senha = "senha-segura",
            Nickname = "novo",
        });

        Assert.False(result.Sucesso);
        Assert.Equal("Não foi possível preparar o e-mail. Tente novamente.", result.MensagemErro);
        usuarioRepository.Verify(repository => repository.DeleteAsync(42), Times.Once);
        emailService.Verify(service => service.SendEmailConfirmationAsync(
            It.IsAny<Usuario>(),
            It.IsAny<string>(),
            It.IsAny<DateTime>()), Times.Never);
    }

    [Fact]
    public async Task RedefinirSenha_ValidaConfirmacaoEConsomeTokenUmaUnicaVez()
    {
        Mock<IUsuarioEmailTokenRepository> tokenRepository = new();
        string? passwordHash = null;
        int tokenUseCount = 0;
        Usuario usuario = new()
        {
            Idusuario = 11,
            Nome = "Conta",
            Email = "conta@teste.com",
            Nickname = "conta",
            Senha = PasswordHasher.Hash("senha-antiga"),
        };
        tokenRepository.Setup(repository => repository.ConsumePasswordResetAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<DateTime>()))
            .ReturnsAsync((string _, string hash, DateTime _) =>
            {
                passwordHash = hash;
                return tokenUseCount++ == 0 ? usuario : null;
            });

        UsuarioService service = CreateService(
            Mock.Of<IUsuarioRepository>(),
            tokenRepository.Object,
            Mock.Of<IEmailService>());
        RedefinirSenhaDto request = new()
        {
            Token = "token-de-teste",
            NovaSenha = "senha-nova",
            ConfirmacaoSenha = "senha-nova",
        };

        ResultAccountAction firstResult = await service.RedefinirSenhaAsync(request);
        ResultAccountAction secondResult = await service.RedefinirSenhaAsync(request);

        Assert.True(firstResult.Sucesso);
        Assert.False(secondResult.Sucesso);
        Assert.NotNull(passwordHash);
        Assert.True(PasswordHasher.Verify("senha-nova", passwordHash));
    }

    [Fact]
    public async Task RedefinirSenha_NaoConsultaTokenQuandoAConfirmacaoDiverge()
    {
        Mock<IUsuarioEmailTokenRepository> tokenRepository = new();
        UsuarioService service = CreateService(
            Mock.Of<IUsuarioRepository>(),
            tokenRepository.Object,
            Mock.Of<IEmailService>());

        ResultAccountAction result = await service.RedefinirSenhaAsync(new RedefinirSenhaDto
        {
            Token = "token",
            NovaSenha = "senha-nova",
            ConfirmacaoSenha = "outra-senha",
        });

        Assert.False(result.Sucesso);
        tokenRepository.Verify(repository => repository.ConsumePasswordResetAsync(
            It.IsAny<string>(),
            It.IsAny<string>(),
            It.IsAny<DateTime>()), Times.Never);
    }

    [Fact]
    public async Task ObterPerfil_NuncaExpoeSenha()
    {
        Mock<IUsuarioRepository> usuarioRepository = new();
        usuarioRepository.Setup(repository => repository.GetByIdAsync(7)).ReturnsAsync(new Usuario
        {
            Idusuario = 7,
            Nome = "Perfil",
            Email = "perfil@teste.com",
            Celular = "11999999999",
            Nickname = "perfil",
            Senha = "hash-que-nao-pode-sair",
        });
        UsuarioService service = CreateService(
            usuarioRepository.Object,
            Mock.Of<IUsuarioEmailTokenRepository>(),
            Mock.Of<IEmailService>());

        UsuarioPerfilDto? perfil = await service.ObterPerfilAsync(7);

        Assert.NotNull(perfil);
        Assert.Equal("perfil", perfil!.Nickname);
        Assert.Null(typeof(UsuarioPerfilDto).GetProperty("Senha"));
    }

    [Fact]
    public async Task AtualizarPerfil_AtualizaSomenteCamposPermitidosERenovaToken()
    {
        Mock<IUsuarioRepository> usuarioRepository = new();
        Mock<ITokenService> tokenService = new();
        Mock<IAssetService> assetService = new();
        Usuario usuario = new()
        {
            Idusuario = 8,
            Nome = "Nome imutável",
            Email = "conta@teste.com",
            Nickname = "antigo",
            ImagemUrl = "https://cdn.teste/avatar-antigo.png",
            Senha = "hash",
            EmailConfirmado = true,
        };
        usuarioRepository.Setup(repository => repository.GetByIdAsync(8)).ReturnsAsync(usuario);
        usuarioRepository.Setup(repository => repository.NicknameExistsAsync("novo", 8)).ReturnsAsync(false);
        usuarioRepository.Setup(repository => repository.UpdateAsync(usuario)).ReturnsAsync(usuario);
        tokenService.Setup(service => service.GerarToken(usuario, true)).Returns("jwt-renovado");
        assetService.Setup(service => service.DeleteIfUnreferencedAsync(
                "https://cdn.teste/avatar-antigo.png",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        UsuarioService service = CreateService(
            usuarioRepository.Object,
            Mock.Of<IUsuarioEmailTokenRepository>(),
            Mock.Of<IEmailService>(),
            tokenService.Object,
            assetService.Object);

        ResultUsuarioPerfil result = await service.AtualizarPerfilAsync(8, new AtualizarUsuarioPerfilDto
        {
            Nickname = " novo ",
            ImagemUrl = "https://cdn.teste/avatar-novo.png",
        });

        Assert.True(result.Sucesso);
        Assert.Equal("jwt-renovado", result.Dados!.TokenJwt);
        Assert.Equal("novo", usuario.Nickname);
        Assert.Equal("Nome imutável", usuario.Nome);
        Assert.Equal("conta@teste.com", usuario.Email);
        assetService.VerifyAll();
    }

    [Fact]
    public async Task AtualizarPerfil_BloqueiaNicknameDuplicado()
    {
        Mock<IUsuarioRepository> usuarioRepository = new();
        usuarioRepository.Setup(repository => repository.GetByIdAsync(9)).ReturnsAsync(new Usuario
        {
            Idusuario = 9,
            Nome = "Conta",
            Email = "conta@teste.com",
            Nickname = "atual",
            Senha = "hash",
        });
        usuarioRepository.Setup(repository => repository.NicknameExistsAsync("ocupado", 9)).ReturnsAsync(true);
        UsuarioService service = CreateService(
            usuarioRepository.Object,
            Mock.Of<IUsuarioEmailTokenRepository>(),
            Mock.Of<IEmailService>());

        ResultUsuarioPerfil result = await service.AtualizarPerfilAsync(9, new AtualizarUsuarioPerfilDto
        {
            Nickname = "ocupado",
        });

        Assert.False(result.Sucesso);
        Assert.Equal("Nickname já está em uso.", result.MensagemErro);
        usuarioRepository.Verify(repository => repository.UpdateAsync(It.IsAny<Usuario>()), Times.Never);
    }

    [Fact]
    public async Task ExcluirConta_ExigeFraseERevogaAcessoDasMesas()
    {
        Mock<IUsuarioRepository> usuarioRepository = new();
        Mock<IAssetService> assetService = new();
        Mock<IMesaRealtimeNotifier> notifier = new();
        usuarioRepository.Setup(repository => repository.DeleteAccountAsync(12))
            .ReturnsAsync(new UsuarioExclusaoDados
            {
                ImagemPerfil = "https://cdn.teste/perfil.png",
                Personagens = new[]
                {
                    new PersonagemJogador
                    {
                        IdpersonagemJogador = 4,
                        Idusuario = 12,
                        Idmesa = 30,
                        Imagem = "https://cdn.teste/personagem.png",
                        Nome = "Personagem",
                        StatusJson = "{}",
                    },
                },
                MesasAfetadas = new[] { 30 },
            });
        assetService.Setup(service => service.DeleteIfUnreferencedAsync(
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        UsuarioService service = CreateService(
            usuarioRepository.Object,
            Mock.Of<IUsuarioEmailTokenRepository>(),
            Mock.Of<IEmailService>(),
            assetService: assetService.Object,
            notifier: notifier.Object);

        ResultAccountAction invalid = await service.ExcluirContaAsync(12, "deletar");
        ResultAccountAction valid = await service.ExcluirContaAsync(12, "DELETAR MINHA CONTA");

        Assert.False(invalid.Sucesso);
        Assert.True(valid.Sucesso);
        usuarioRepository.Verify(repository => repository.DeleteAccountAsync(12), Times.Once);
        assetService.Verify(service => service.DeleteIfUnreferencedAsync(
            It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Exactly(2));
        notifier.Verify(service => service.RevogarAcessoUsuarioAsync(
            30, 12, It.IsAny<CancellationToken>()), Times.Once);
        notifier.Verify(service => service.NotificarMesaAlteradaAsync(
            30, It.IsAny<CancellationToken>()), Times.Once);
    }

    private static UsuarioService CreateService(
        IUsuarioRepository usuarioRepository,
        IUsuarioEmailTokenRepository tokenRepository,
        IEmailService emailService,
        ITokenService? tokenService = null,
        IAssetService? assetService = null,
        IMesaRealtimeNotifier? notifier = null)
    {
        return new UsuarioService(
            usuarioRepository,
            tokenRepository,
            tokenService ?? Mock.Of<ITokenService>(),
            emailService,
            assetService ?? Mock.Of<IAssetService>(),
            notifier ?? Mock.Of<IMesaRealtimeNotifier>(),
            Options.Create(new GoogleAuthSettings { ClientId = "google-client" }),
            Options.Create(new EmailSettings
            {
                BrevoApiKey = "chave-da-api-brevo",
                From = "OdisseiaWiki <contato@teste.com>",
                FrontendUrl = "https://teste.com",
            }),
            NullLogger<UsuarioService>.Instance);
    }
}
