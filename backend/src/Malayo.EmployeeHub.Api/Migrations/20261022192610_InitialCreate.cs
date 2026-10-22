using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace Malayo.EmployeeHub.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Employees",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FullName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    WorkEmail = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    JobTitle = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    EmploymentType = table.Column<int>(type: "integer", nullable: false),
                    Role = table.Column<int>(type: "integer", nullable: false),
                    ClientName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    PrimaryTechStack = table.Column<string>(type: "character varying(250)", maxLength: 250, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Employees", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Holidays",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    HolidayDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Country = table.Column<int>(type: "integer", nullable: false),
                    IsWorkingDay = table.Column<bool>(type: "boolean", nullable: false),
                    Notes = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Holidays", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PolicyDocuments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Version = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    SummaryMarkdown = table.Column<string>(type: "text", nullable: false),
                    IsMandatory = table.Column<bool>(type: "boolean", nullable: false),
                    PublishedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PolicyDocuments", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HardwareItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    EmployeeId = table.Column<int>(type: "integer", nullable: false),
                    ModelName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    SerialNumber = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AssetTag = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    AssignedDate = table.Column<DateOnly>(type: "date", nullable: false),
                    ReturnDate = table.Column<DateOnly>(type: "date", nullable: true),
                    Status = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Notes = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HardwareItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_HardwareItems_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Tickets",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    Queue = table.Column<int>(type: "integer", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedByEmployeeId = table.Column<int>(type: "integer", nullable: false),
                    AssignedToEmployeeId = table.Column<int>(type: "integer", nullable: true),
                    ResolutionNotes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tickets", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Tickets_Employees_AssignedToEmployeeId",
                        column: x => x.AssignedToEmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Tickets_Employees_CreatedByEmployeeId",
                        column: x => x.CreatedByEmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PolicyAcknowledgements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PolicyDocumentId = table.Column<int>(type: "integer", nullable: false),
                    EmployeeId = table.Column<int>(type: "integer", nullable: false),
                    AcknowledgedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PolicyAcknowledgements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PolicyAcknowledgements_Employees_EmployeeId",
                        column: x => x.EmployeeId,
                        principalTable: "Employees",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PolicyAcknowledgements_PolicyDocuments_PolicyDocumentId",
                        column: x => x.PolicyDocumentId,
                        principalTable: "PolicyDocuments",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Employees_WorkEmail",
                table: "Employees",
                column: "WorkEmail",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HardwareItems_AssetTag",
                table: "HardwareItems",
                column: "AssetTag",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_HardwareItems_EmployeeId",
                table: "HardwareItems",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Holidays_HolidayDate_Country",
                table: "Holidays",
                columns: new[] { "HolidayDate", "Country" });

            migrationBuilder.CreateIndex(
                name: "IX_PolicyAcknowledgements_EmployeeId",
                table: "PolicyAcknowledgements",
                column: "EmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_PolicyAcknowledgements_PolicyDocumentId_EmployeeId",
                table: "PolicyAcknowledgements",
                columns: new[] { "PolicyDocumentId", "EmployeeId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_AssignedToEmployeeId",
                table: "Tickets",
                column: "AssignedToEmployeeId");

            migrationBuilder.CreateIndex(
                name: "IX_Tickets_CreatedByEmployeeId",
                table: "Tickets",
                column: "CreatedByEmployeeId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "HardwareItems");

            migrationBuilder.DropTable(
                name: "Holidays");

            migrationBuilder.DropTable(
                name: "PolicyAcknowledgements");

            migrationBuilder.DropTable(
                name: "Tickets");

            migrationBuilder.DropTable(
                name: "PolicyDocuments");

            migrationBuilder.DropTable(
                name: "Employees");
        }
    }
}
