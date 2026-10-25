namespace AI_10._Price_Prediction_WEB_API.DTOs;

public class RetrainOut
{
    public string Message { get; set; } = string.Empty;
    public int RecordsUsed { get; set; }
    public MetricsOut Metrics { get; set; } = new();
    public DateTimeOffset FinishedAt { get; set; }
}

public class MetricsOut
{
    public double Mae { get; set; }
    public double Mse { get; set; }
    public double Rmse { get; set; }
    public double R2 { get; set; }
}
