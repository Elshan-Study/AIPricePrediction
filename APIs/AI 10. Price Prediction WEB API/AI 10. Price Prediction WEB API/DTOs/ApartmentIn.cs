using System.ComponentModel.DataAnnotations;

namespace AI_10._Price_Prediction_WEB_API.DTOs;

public class ApartmentIn
{
    [Range(1, int.MaxValue, ErrorMessage = "Bedrooms: должно быть положительным целым числом")]
    public int Bedrooms { get; set; }

    [Range(1, int.MaxValue, ErrorMessage = "Bathrooms: должно быть положительным целым числом")]
    public int Bathrooms { get; set; }

    [Range(double.Epsilon, double.MaxValue, ErrorMessage = "Sqm: должно быть положительным числом")]
    public double Sqm { get; set; }

    [Required(AllowEmptyStrings = false, ErrorMessage = "City: город не может быть пустым")]
    public string City { get; set; } = string.Empty;

    [Range(double.Epsilon, double.MaxValue, ErrorMessage = "PriceAZN: должно быть положительным числом")]
    public double PriceAZN { get; set; }
}
