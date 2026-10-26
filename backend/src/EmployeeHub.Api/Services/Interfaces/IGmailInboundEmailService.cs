namespace EmployeeHub.Api.Services.Interfaces;

public interface IGmailInboundEmailService
{
    Task<int> SyncInboxAsync(CancellationToken cancellationToken = default);
}
