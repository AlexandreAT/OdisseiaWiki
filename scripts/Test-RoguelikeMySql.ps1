param(
    [string]$Image = 'mysql:8.0',
    [string]$Filter = 'FullyQualifiedName~GameplayMariaDbIntegrationTests'
)

$ErrorActionPreference = 'Stop'
$repositoryRoot = Split-Path -Parent $PSScriptRoot
$testProject = Join-Path $repositoryRoot 'OdisseiaWiki.Tests/OdisseiaWiki.Tests.csproj'
$containerName = 'odisseia-rogue-check-' + [guid]::NewGuid().ToString('N').Substring(0, 10)
$artifactsPath = Join-Path ([System.IO.Path]::GetTempPath()) $containerName
$temporaryPassword = 'rogue_test_' + [guid]::NewGuid().ToString('N')
$previousFlag = [Environment]::GetEnvironmentVariable('RUN_GAMEPLAY_MARIADB_TESTS')
$previousConnection = [Environment]::GetEnvironmentVariable('ODISSEIA_TEST_MYSQL_CONNECTION')
$containerId = $null

try {
    $containerId = docker run -d --rm --name $containerName `
        -e "MYSQL_ROOT_PASSWORD=$temporaryPassword" -p '127.0.0.1::3306' $Image
    if ($LASTEXITCODE -ne 0) { throw 'Não foi possível iniciar o MySQL descartável.' }

    $publishedPort = (docker port $containerName '3306/tcp').Split(':')[-1]
    if ($LASTEXITCODE -ne 0 -or -not ($publishedPort -match '^\d+$')) {
        throw 'Não foi possível descobrir a porta do MySQL descartável.'
    }

    $ready = $false
    for ($attempt = 0; $attempt -lt 90; $attempt++) {
        docker exec -e "MYSQL_PWD=$temporaryPassword" $containerName `
            mysqladmin ping -h '127.0.0.1' -u root --silent 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 1
    }
    if (-not $ready) { throw 'O MySQL descartável não ficou pronto.' }

    $env:RUN_GAMEPLAY_MARIADB_TESTS = '1'
    $env:ODISSEIA_TEST_MYSQL_CONNECTION = "Server=127.0.0.1;Port=$publishedPort;User=root;Password=$temporaryPassword;SslMode=None;AllowPublicKeyRetrieval=True"

    dotnet test $testProject `
        --filter $Filter `
        --verbosity minimal `
        --artifacts-path $artifactsPath `
        '-p:UseAppHost=false'
    if ($LASTEXITCODE -ne 0) { throw 'Os testes de integração com MySQL falharam.' }
}
finally {
    if ($null -eq $previousFlag) {
        Remove-Item Env:RUN_GAMEPLAY_MARIADB_TESTS -ErrorAction SilentlyContinue
    } else { $env:RUN_GAMEPLAY_MARIADB_TESTS = $previousFlag }
    if ($null -eq $previousConnection) {
        Remove-Item Env:ODISSEIA_TEST_MYSQL_CONNECTION -ErrorAction SilentlyContinue
    } else { $env:ODISSEIA_TEST_MYSQL_CONNECTION = $previousConnection }
    if ($containerId) { docker stop $containerName | Out-Null }
}
