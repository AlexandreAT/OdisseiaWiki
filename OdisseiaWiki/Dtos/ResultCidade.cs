using OdisseiaWiki.Models;
using System.Collections.Generic;

namespace OdisseiaWiki.Dtos
{
    public class ResultCidade
    {
        public bool Sucesso { get; set; }
        public string? MensagemErro { get; set; }
        public Cidade? Cidade { get; set; }
        public List<CidadeDto>? Cidades { get; set; }

        public static ResultCidade Ok(Cidade cidade) => new() { Sucesso = true, Cidade = cidade };
        public static ResultCidade Ok(List<CidadeDto> cidades) => new() { Sucesso = true, Cidades = cidades };
        public static ResultCidade Fail(string mensagemErro) => new() { Sucesso = false, MensagemErro = mensagemErro };
    }
}
