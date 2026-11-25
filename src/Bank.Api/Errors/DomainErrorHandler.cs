using Bank.Kernel;
using Microsoft.AspNetCore.Diagnostics;

namespace Bank.Api.Errors;

/// <summary>Answers a <see cref="DomainError"/> as problem details carrying its code.</summary>
internal sealed class DomainErrorHandler(IProblemDetailsService problems) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext context, Exception exception, CancellationToken cancellationToken)
    {
        if (exception is not DomainError error) return false;

        var status = error.Kind switch
        {
            ErrorKind.Invalid => StatusCodes.Status400BadRequest,
            ErrorKind.NotFound => StatusCodes.Status404NotFound,
            _ => StatusCodes.Status422UnprocessableEntity,
        };
        context.Response.StatusCode = status;
        return await problems.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = context,
            Exception = exception,
            ProblemDetails = { Status = status, Title = error.Message, Extensions = { ["code"] = error.Code } },
        });
    }
}
