using System.ComponentModel.DataAnnotations;

namespace OdisseiaWiki.Dtos;

public sealed class UsuarioPerfilDto
{
    public int Id { get; init; }
    public string Nome { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? Celular { get; init; }
    public string Nickname { get; init; } = string.Empty;
    public string? ImagemUrl { get; init; }
}

public sealed class AtualizarUsuarioPerfilDto
{
    [Required(ErrorMessage = "Nickname é obrigatório.")]
    [MinLength(2, ErrorMessage = "Nickname deve ter pelo menos 2 caracteres.")]
    [MaxLength(50, ErrorMessage = "Nickname deve ter no máximo 50 caracteres.")]
    public string Nickname { get; set; } = string.Empty;

    [MaxLength(255, ErrorMessage = "A URL da imagem deve ter no máximo 255 caracteres.")]
    public string? ImagemUrl { get; set; }
}

public sealed class UsuarioPerfilAtualizadoDto
{
    public UsuarioPerfilDto Perfil { get; init; } = null!;
    public string TokenJwt { get; init; } = string.Empty;
}

public sealed class ResultUsuarioPerfil
{
    public bool Sucesso { get; init; }
    public string? MensagemErro { get; init; }
    public UsuarioPerfilAtualizadoDto? Dados { get; init; }

    public static ResultUsuarioPerfil Ok(UsuarioPerfilAtualizadoDto dados)
        => new() { Sucesso = true, Dados = dados };

    public static ResultUsuarioPerfil Falha(string mensagem)
        => new() { Sucesso = false, MensagemErro = mensagem };
}

public sealed class ExcluirContaDto
{
    [Required]
    public string Confirmacao { get; set; } = string.Empty;
}
