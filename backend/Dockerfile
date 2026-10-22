# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project file and restore dependencies
COPY src/Malayo.EmployeeHub.Api/Malayo.EmployeeHub.Api.csproj src/Malayo.EmployeeHub.Api/
RUN dotnet restore src/Malayo.EmployeeHub.Api/Malayo.EmployeeHub.Api.csproj

# Copy the rest of the source code and build
COPY src/Malayo.EmployeeHub.Api/ src/Malayo.EmployeeHub.Api/
WORKDIR /src/src/Malayo.EmployeeHub.Api
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000

ENTRYPOINT ["dotnet", "Malayo.EmployeeHub.Api.dll"]
