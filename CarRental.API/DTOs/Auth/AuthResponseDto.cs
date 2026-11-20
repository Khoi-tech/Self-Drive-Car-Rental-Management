namespace CarRental.API.DTOs.Auth
{
    public class AuthResponseDto
    {
        public string Token { get; set; } = null!;
        public string? RefreshToken { get; set; }
        public UserDto User { get; set; } = null!;
    }
}
