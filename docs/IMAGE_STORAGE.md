# Armazenamento de imagens

## Fluxo ativo

Em produção, todo novo upload autenticado passa pela validação do `AssetService` e é enviado ao Cloudinary por stream. A API mantém `path` por compatibilidade e também retorna `url`, `provider` e `publicId`. Os formulários continuam persistindo a URL pública no mesmo campo que antes armazenava caminhos locais ou URLs do ImgBB.

No desenvolvimento, `Cloudinary:UseLocalStorageInDevelopment=true` (o padrão seguro sem credenciais locais) usa `wwwroot/assets_dynamic`. Defina como `false` para testar localmente o mesmo fluxo da produção. Arquivos locais continuam sendo servidos apenas em desenvolvimento; o backend de produção não precisa de disco persistente nem de `/assets_dynamic`.

Configurações obrigatórias no ambiente do backend:

```text
Cloudinary__CloudName
Cloudinary__ApiKey
Cloudinary__ApiSecret
Cloudinary__RootFolder=odisseia
Cloudinary__UseLocalStorageInDevelopment=false
```

O secret nunca deve ser colocado no frontend, no Git, em logs ou em variáveis `VITE_*`.

## Metadados e compatibilidade

O schema atual persiste apenas a URL da imagem. Para evitar uma reforma ampla do banco nesta fase:

- novos uploads retornam `provider`, `publicId` e `url` na resposta;
- a URL absoluta é o valor persistido pelas entidades;
- assets novos usam public IDs sob `odisseia/<tipo>/<entidade>/...`;
- na exclusão, o public ID é extraído somente de URLs HTTPS do cloud configurado e somente quando pertence à raiz gerenciada;
- caminhos locais antigos continuam funcionando no desenvolvimento;
- URLs antigas do ImgBB e de outros providers permanecem inalteradas e nunca são excluídas sem um identificador/token confiável.

Antes de excluir um asset, o backend procura a URL nas entidades, galerias e JSONs que podem conter imagens. A remoção remota só acontece depois da atualização/exclusão no banco e quando nenhuma referência restante é encontrada. Falha no Cloudinary deixa no máximo um asset órfão; não deixa o banco apontando para algo apagado.

Limitação atual: como `provider` e `public_id` não têm colunas próprias, não é possível excluir com segurança uma URL Cloudinary criada fora da raiz/padrão desta aplicação. Uma tabela de assets pode ser adicionada no futuro se houver compartilhamento ou versionamento mais complexo.

## Migração opcional dos arquivos locais

A ferramenta em `Tools/AssetMigration` não roda no startup, não altera o banco e nunca apaga originais. O modo padrão é dry-run:

```powershell
dotnet run --project Tools/AssetMigration/AssetMigration.csproj
```

Para executar uploads explicitamente, configure as variáveis do Cloudinary no processo e use:

```powershell
dotnet run --project Tools/AssetMigration/AssetMigration.csproj -- --execute
```

Opções:

```text
--source <diretório>
--output <arquivo-json>
```

O JSON de saída contém caminho antigo, provider, public ID determinístico (com hash do caminho para evitar colisões), URL, status, erro controlado e data. Reexecuções reutilizam o mesmo public ID e ignoram entradas concluídas, evitando duplicatas. A pasta `migration-output` é ignorada pelo Git.

Como o banco de produção começará vazio, essa migração não faz parte do primeiro deploy. O mapeamento serve apenas se algum arquivo legado for escolhido para reaproveitamento.

## Backup

Cloudinary não é o único backup. Manter separadamente:

1. cópia versionada por data de `wwwroot/assets_dynamic` em armazenamento externo;
2. dump do MySQL, que preserva URLs usadas pelas entidades;
3. arquivo de mapeamento da migração e export periódico de `url`/`public_id` dos assets do Cloudinary;
4. export das URLs legadas do ImgBB presentes no banco.

Uma restauração deve começar pelo banco e pelo inventário de URLs/public IDs. Os arquivos locais não devem ser apagados após uma migração sem validação visual e um backup independente.
