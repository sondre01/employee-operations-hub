# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY src/EmployeeHub.Api/EmployeeHub.Api.csproj src/EmployeeHub.Api/
RUN dotnet restore src/EmployeeHub.Api/EmployeeHub.Api.csproj

# Copy the rest of the source code and build
COPY src/EmployeeHub.Api/ src/EmployeeHub.Api/
WORKDIR /src/src/EmployeeHub.Api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "EmployeeHub.Api.dll"]
