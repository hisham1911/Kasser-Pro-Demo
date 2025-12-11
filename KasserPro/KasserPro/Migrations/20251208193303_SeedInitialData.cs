using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace KasserPro.Migrations
{
    /// <inheritdoc />
    public partial class SeedInitialData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Color", "Icon", "Name" },
                values: new object[,]
                {
                    { 1, "#3B82F6", "🥤", "مشروبات" },
                    { 2, "#EF4444", "🍔", "وجبات" },
                    { 3, "#F59E0B", "🍰", "حلويات" },
                    { 4, "#10B981", "🍟", "مقبلات" }
                });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "FullName", "IsActive", "PasswordHash", "Role", "Username" },
                values: new object[] { 1, new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "المدير العام", true, "$2a$11$5EqkFvM3Y8LZZ0YHqVn4ZeOxNc7DWYpCvLZU3p6qWGNJxJ8HK9EzS", "Admin", "admin" });

            migrationBuilder.InsertData(
                table: "Products",
                columns: new[] { "Id", "CategoryId", "ImageUrl", "IsAvailable", "Name", "Price", "Stock" },
                values: new object[,]
                {
                    { 1, 1, null, true, "كولا", 15.00m, 100 },
                    { 2, 1, null, true, "عصير برتقال", 20.00m, 50 },
                    { 3, 1, null, true, "مياه معدنية", 10.00m, 200 },
                    { 4, 2, null, true, "برجر لحم", 50.00m, 30 },
                    { 5, 2, null, true, "برجر دجاج", 45.00m, 35 },
                    { 6, 2, null, true, "بيتزا مارجريتا", 80.00m, 20 },
                    { 7, 3, null, true, "كيكة شوكولاتة", 25.00m, 15 },
                    { 8, 3, null, true, "آيس كريم", 30.00m, 40 },
                    { 9, 4, null, true, "بطاطس", 20.00m, 60 },
                    { 10, 4, null, true, "أصابع موتزاريلا", 35.00m, 25 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Products",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Categories",
                keyColumn: "Id",
                keyValue: 4);
        }
    }
}
