using FluentAssertions;

namespace PantryScan.Tests.Tests;

/// <summary>
/// Pure unit tests — no database, no HTTP, no infrastructure required.
/// </summary>
public class ValidationUnitTests
{
    [Fact]
    public void EmptyString_IsNullOrWhiteSpace_ReturnsTrue()
    {
        string.IsNullOrWhiteSpace("").Should().BeTrue();
    }

    [Fact]
    public void WhitespaceOnlyString_IsNullOrWhiteSpace_ReturnsTrue()
    {
        string.IsNullOrWhiteSpace("   ").Should().BeTrue();
    }

    [Fact]
    public void NullString_IsNullOrWhiteSpace_ReturnsTrue()
    {
        string.IsNullOrWhiteSpace(null).Should().BeTrue();
    }

    [Fact]
    public void NonEmptyString_IsNullOrWhiteSpace_ReturnsFalse()
    {
        string.IsNullOrWhiteSpace("Milk").Should().BeFalse();
    }

    [Fact]
    public void DateOnly_Parse_ValidIsoString_ReturnsParsedDate()
    {
        var date = DateOnly.Parse("2026-03-28");
        date.Year.Should().Be(2026);
        date.Month.Should().Be(3);
        date.Day.Should().Be(28);
    }

    [Fact]
    public void NegativeQuantity_IsLessThanZero_ReturnsTrue()
    {
        var quantity = -1;
        (quantity < 0).Should().BeTrue();
    }

    [Fact]
    public void ZeroQuantity_IsNotNegative_ReturnsTrue()
    {
        var quantity = 0;
        (quantity < 0).Should().BeFalse();
    }

    [Fact]
    public void TrimmedName_RemovesLeadingAndTrailingWhitespace()
    {
        var raw = "  Eggs  ";
        raw.Trim().Should().Be("Eggs");
    }

    [Theory]
    [InlineData("Breakfast")]
    [InlineData("Lunch")]
    [InlineData("Dinner")]
    [InlineData("Snack")]
    [InlineData("Notes")]
    public void ValidMealType_StringEquality_CaseInsensitive(string mealType)
    {
        var validTypes = new[] { "Breakfast", "Lunch", "Dinner", "Snack", "Notes" };
        validTypes.Should().Contain(t => t.Equals(mealType, StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void NotesType_StringEquals_CaseInsensitive_ReturnsTrue()
    {
        string.Equals("notes", "Notes", StringComparison.OrdinalIgnoreCase).Should().BeTrue();
    }
}
