using System.Collections.Generic;

namespace OdisseiaWiki.Dtos
{
    public class RacaStatusDto
    {
        public StatusBaseDto status { get; set; } = new();
        public string? atributoInicial { get; set; }
        public List<RacaPassivaDto>? passivas { get; set; }
    }
}
