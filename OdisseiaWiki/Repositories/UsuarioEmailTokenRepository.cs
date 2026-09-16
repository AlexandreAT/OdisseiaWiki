using Microsoft.EntityFrameworkCore;
using OdisseiaWiki.Data;
using OdisseiaWiki.Enums;
using OdisseiaWiki.Models;
using OdisseiaWiki.Repositories.Interfaces;

namespace OdisseiaWiki.Repositories;

public class UsuarioEmailTokenRepository : IUsuarioEmailTokenRepository
{
    private readonly OdisseiaContext _context;

    public UsuarioEmailTokenRepository(OdisseiaContext context)
    {
        _context = context;
    }

    public async Task CreateReplacingActiveAsync(UsuarioEmailToken token, DateTime agora)
    {
        List<UsuarioEmailToken> tokensAtivos = await _context.UsuariosEmailTokens
            .Where(item => item.Idusuario == token.Idusuario
                && item.Tipo == token.Tipo
                && item.DataUso == null
                && item.DataInvalidacao == null)
            .ToListAsync();

        foreach (UsuarioEmailToken tokenAtivo in tokensAtivos)
            tokenAtivo.DataInvalidacao = agora;

        _context.UsuariosEmailTokens.Add(token);
        await _context.SaveChangesAsync();
    }

    public Task InvalidateActiveAsync(int idUsuario, UsuarioEmailTokenTipo tipo, DateTime agora)
    {
        return _context.UsuariosEmailTokens
            .Where(token => token.Idusuario == idUsuario
                && token.Tipo == tipo
                && token.DataUso == null
                && token.DataInvalidacao == null)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(token => token.DataInvalidacao, agora));
    }

    public Task<Usuario?> ConsumeEmailConfirmationAsync(string hashToken, DateTime agora)
    {
        return ConsumeAsync(
            hashToken,
            UsuarioEmailTokenTipo.ConfirmacaoEmail,
            agora,
            usuario => usuario.EmailConfirmado = true);
    }

    public Task<Usuario?> ConsumePasswordResetAsync(string hashToken, string senhaHash, DateTime agora)
    {
        return ConsumeAsync(
            hashToken,
            UsuarioEmailTokenTipo.RedefinicaoSenha,
            agora,
            usuario => usuario.Senha = senhaHash);
    }

    private async Task<Usuario?> ConsumeAsync(
        string hashToken,
        UsuarioEmailTokenTipo tipo,
        DateTime agora,
        Action<Usuario> atualizarUsuario)
    {
        UsuarioEmailToken? token = await _context.UsuariosEmailTokens
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.HashToken == hashToken
                && item.Tipo == tipo
                && item.DataUso == null
                && item.DataInvalidacao == null
                && item.DataExpiracao > agora);

        if (token == null)
            return null;

        int consumido = await _context.UsuariosEmailTokens
            .Where(item => item.IdusuarioEmailToken == token.IdusuarioEmailToken
                && item.DataUso == null
                && item.DataInvalidacao == null
                && item.DataExpiracao > agora)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(item => item.DataUso, agora));

        if (consumido != 1)
            return null;

        Usuario? usuario = await _context.Usuarios.FindAsync(token.Idusuario);
        if (usuario == null)
            return null;

        atualizarUsuario(usuario);
        await _context.SaveChangesAsync();
        return usuario;
    }
}
