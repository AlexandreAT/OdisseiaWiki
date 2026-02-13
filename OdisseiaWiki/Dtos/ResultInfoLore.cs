using System.Collections.Generic;

namespace OdisseiaWiki.Dtos
{
    public class ResultInfoLore
    {
        public bool Sucesso { get; set; }
        public string? MensagemErro { get; set; }
        public InfoLoreDto? InfoLore { get; set; }
        public List<InfoLoreDto>? InfoLores { get; set; }

        public static ResultInfoLore Ok(InfoLoreDto infoLore) => new() { Sucesso = true, InfoLore = infoLore };
        public static ResultInfoLore Ok(List<InfoLoreDto> infoLores) => new() { Sucesso = true, InfoLores = infoLores };
        public static ResultInfoLore Fail(string mensagemErro) => new() { Sucesso = false, MensagemErro = mensagemErro };
    }
}