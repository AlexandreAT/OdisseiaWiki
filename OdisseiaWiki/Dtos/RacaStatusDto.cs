namespace OdisseiaWiki.Dtos
{
    namespace OdisseiaWiki.Dtos
    {
        public class RacaStatusDto
        {
            public StatusBaseDto status { get; set; } = new();
            public string? atributoInicial { get; set; }
            public List<string>? passivas { get; set; }
        }

        public class StatusBaseDto
        {
            public int vida { get; set; }
            public int estamina { get; set; }
            public int mana { get; set; }
            public int capacidadeCarga { get; set; }
        }
    }
}
