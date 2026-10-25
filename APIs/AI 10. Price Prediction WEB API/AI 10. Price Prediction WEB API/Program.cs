var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddSwaggerGen();

var aiBasedUrl = builder.Configuration["AI_BASE"] ?? "http://localhost:8000";
builder.Services.AddHttpClient("ai", client =>
{
    client.BaseAddress = new Uri(aiBasedUrl);
});

builder.Services.AddCors(
    opt=>
    {
        opt.AddPolicy("ReactApp", policy =>
        {
            policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
        });
    }
    );

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.MapOpenApi();
}
app.UseCors("ReactApp");
app.UseAuthorization();

app.MapControllers();

app.Run();
