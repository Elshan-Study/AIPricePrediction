namespace AI_10._Price_Prediction_WEB_API.DTOs;

// Ответ на добавление одной квартиры и на импорт CSV
public class ApartmentsOut
{
    public string Message { get; set; } = string.Empty;
    public int Added { get; set; }
    public int TotalRecords { get; set; }
}
