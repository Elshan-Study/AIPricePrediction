using AI_10._Price_Prediction_WEB_API.DTOs;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Headers;

namespace AI_10._Price_Prediction_WEB_API.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AIController : ControllerBase
{
    private readonly HttpClient _httpClient;
    private readonly HttpClient _retrainClient;

    public AIController(IHttpClientFactory factory)
    {
        _httpClient = factory.CreateClient("ai");
        _retrainClient = factory.CreateClient("ai-retrain");
    }

    [HttpPost("predict")]
    public async Task<IActionResult> Predict([FromBody] PredictIn predict)
    {
        var res = await _httpClient.PostAsJsonAsync("/predict", predict);

        if (!res.IsSuccessStatusCode)
        {
            return StatusCode((int)res.StatusCode, await res.Content.ReadAsStringAsync());
        }

        var prediction = await res.Content.ReadFromJsonAsync<PredictOut>();
        return Ok(prediction);
    }

    [HttpPost("apartments")]
    public Task<IActionResult> AddApartment([FromBody] ApartmentIn apartment) =>
        Forward<ApartmentsOut>(() => _httpClient.PostAsJsonAsync("/apartments", apartment));

    [HttpPost("apartments/import")]
    public async Task<IActionResult> ImportApartments(IFormFile? file)
    {
        if (file is null || file.Length == 0)
        {
            return BadRequest(new { detail = "Выберите непустой CSV-файл" });
        }

        await using var stream = file.OpenReadStream();
        using var content = new MultipartFormDataContent();
        var fileContent = new StreamContent(stream);
        fileContent.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        content.Add(fileContent, "file", file.FileName);

        return await Forward<ApartmentsOut>(() => _httpClient.PostAsync("/apartments/import", content));
    }

    [HttpPost("retrain")]
    public Task<IActionResult> Retrain() =>
        Forward<RetrainOut>(() => _retrainClient.PostAsync("/retrain", null));

    // Отправляет запрос в FastAPI и превращает сетевые ошибки в понятные ответы клиенту
    private async Task<IActionResult> Forward<T>(Func<Task<HttpResponseMessage>> send)
    {
        HttpResponseMessage res;
        try
        {
            res = await send();
        }
        catch (HttpRequestException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new { detail = "AI-сервис (FastAPI) недоступен. Проверьте, что он запущен." });
        }
        catch (TaskCanceledException) when (!HttpContext.RequestAborted.IsCancellationRequested)
        {
            return StatusCode(StatusCodes.Status504GatewayTimeout,
                new { detail = "AI-сервис не ответил вовремя (тайм-аут)." });
        }

        using (res)
        {
            if (!res.IsSuccessStatusCode)
            {
                // ошибку FastAPI ({"detail": ...}) передаём клиенту как есть, с тем же статусом
                return new ContentResult
                {
                    StatusCode = (int)res.StatusCode,
                    Content = await res.Content.ReadAsStringAsync(),
                    ContentType = "application/json"
                };
            }

            return Ok(await res.Content.ReadFromJsonAsync<T>());
        }
    }
}
