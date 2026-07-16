# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS restore
WORKDIR /src
COPY ["OdisseiaWiki/OdisseiaWiki.csproj", "OdisseiaWiki/"]
RUN dotnet restore "OdisseiaWiki/OdisseiaWiki.csproj"

FROM restore AS publish
COPY ["OdisseiaWiki/", "OdisseiaWiki/"]
WORKDIR /src/OdisseiaWiki
RUN dotnet publish "OdisseiaWiki.csproj" \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_EnableDiagnostics=0
COPY --from=publish /app/publish .
USER $APP_UID
ENTRYPOINT ["dotnet", "OdisseiaWiki.dll"]
