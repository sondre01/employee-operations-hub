using Microsoft.EntityFrameworkCore;
using Malayo.EmployeeHub.Api.Models.Entities;
using Malayo.EmployeeHub.Api.Models.Enums;

namespace Malayo.EmployeeHub.Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        // Apply migrations for PostgreSQL or EnsureCreated for local SQLite
        if (context.Database.IsNpgsql())
        {
            await context.Database.MigrateAsync();
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
        }

        if (await context.Employees.AnyAsync())
        {
            return; // DB has been seeded
        }

        // 1. Seed Employees
        var maria = new Employee
        {
            FullName = "Maria Santos",
            WorkEmail = "maria.santos@malayo.io",
            JobTitle = "HR & People Operations Lead",
            EmploymentType = EmploymentType.InternalCore,
            Role = UserRole.AdminHr,
            ClientName = null,
            PrimaryTechStack = "HR Tech, BambooHR, Labor Law",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-12)
        };

        var christian = new Employee
        {
            FullName = "Christian Reyes",
            WorkEmail = "christian.reyes@malayo.io",
            JobTitle = "Internal IT & DevOps Specialist",
            EmploymentType = EmploymentType.InternalCore,
            Role = UserRole.AdminHr,
            ClientName = null,
            PrimaryTechStack = "Linux, Networking, WireGuard, Hardware Maintenance",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-10)
        };

        var jesper = new Employee
        {
            FullName = "Jesper Nielsen",
            WorkEmail = "jn@kobenhavntech.dk",
            JobTitle = "Chief Technology Officer / Client Lead",
            EmploymentType = EmploymentType.ClientDedicated,
            Role = UserRole.DanishClientLead,
            ClientName = "Kobenhavn Tech A/S",
            PrimaryTechStack = ".NET Core, Angular, Cloud Architecture",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-8)
        };

        var freja = new Employee
        {
            FullName = "Freja Lind",
            WorkEmail = "freja.lind@nordiclogistics.dk",
            JobTitle = "VP of Engineering",
            EmploymentType = EmploymentType.ClientDedicated,
            Role = UserRole.DanishClientLead,
            ClientName = "Nordic Logistics Group",
            PrimaryTechStack = "Distributed Systems, Microservices",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-6)
        };

        var arnel = new Employee
        {
            FullName = "Arnel Cruz",
            WorkEmail = "arnel.cruz@malayo.io",
            JobTitle = "Senior Full-Stack Engineer",
            EmploymentType = EmploymentType.ClientDedicated,
            Role = UserRole.Developer,
            ClientName = "Kobenhavn Tech A/S",
            PrimaryTechStack = ".NET 8, React, PostgreSQL, Docker",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-8)
        };

        var bianca = new Employee
        {
            FullName = "Bianca Mendoza",
            WorkEmail = "bianca.mendoza@malayo.io",
            JobTitle = "Frontend Engineer",
            EmploymentType = EmploymentType.ClientDedicated,
            Role = UserRole.Developer,
            ClientName = "Kobenhavn Tech A/S",
            PrimaryTechStack = "React, TypeScript, Next.js, Redux",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-5)
        };

        var danilo = new Employee
        {
            FullName = "Danilo Ramos",
            WorkEmail = "danilo.ramos@malayo.io",
            JobTitle = "Senior Backend Engineer",
            EmploymentType = EmploymentType.ClientDedicated,
            Role = UserRole.Developer,
            ClientName = "Nordic Logistics Group",
            PrimaryTechStack = "C#, ASP.NET Core, Azure, RabbitMQ",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-6)
        };

        var camille = new Employee
        {
            FullName = "Camille Soriano",
            WorkEmail = "camille.soriano@malayo.io",
            JobTitle = "QA Automation Engineer",
            EmploymentType = EmploymentType.ClientDedicated,
            Role = UserRole.Developer,
            ClientName = "Nordic Logistics Group",
            PrimaryTechStack = "Playwright, C#, SpecFlow, CI/CD",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-4)
        };

        context.Employees.AddRange(maria, christian, jesper, freja, arnel, bianca, danilo, camille);
        await context.SaveChangesAsync();

        // 2. Seed Hardware Custody Items
        var hardwareItems = new List<HardwareCustodyItem>
        {
            new()
            {
                EmployeeId = arnel.Id,
                ModelName = "MacBook Pro 16 M3 Pro (36GB RAM, 512GB SSD)",
                SerialNumber = "C02XYZ12345",
                AssetTag = "MAL-MBP-2024-001",
                AssignedDate = new DateOnly(2024, 2, 1),
                Status = "Active",
                Notes = "Primary workstation with client VPN & security suite installed."
            },
            new()
            {
                EmployeeId = arnel.Id,
                ModelName = "Dell UltraSharp 27 4K Monitor (U2723QE)",
                SerialNumber = "CN09876543",
                AssetTag = "MAL-MON-2024-005",
                AssignedDate = new DateOnly(2024, 2, 5),
                Status = "Active",
                Notes = "Desk peripheral for home office setup."
            },
            new()
            {
                EmployeeId = bianca.Id,
                ModelName = "MacBook Air 15 M2 (16GB RAM, 512GB SSD)",
                SerialNumber = "C02ABC67890",
                AssetTag = "MAL-MBA-2024-012",
                AssignedDate = new DateOnly(2024, 5, 15),
                Status = "Active",
                Notes = "Frontend development laptop."
            },
            new()
            {
                EmployeeId = danilo.Id,
                ModelName = "Lenovo ThinkPad P16s Gen 2 (Ryzen 7, 32GB RAM)",
                SerialNumber = "PF49XYZ001",
                AssetTag = "MAL-TP-2024-023",
                AssignedDate = new DateOnly(2024, 4, 1),
                Status = "Active",
                Notes = "Heavy enterprise build machine for Azure cloud tasks."
            },
            new()
            {
                EmployeeId = camille.Id,
                ModelName = "Lenovo ThinkPad T14s Gen 4 (Core i7, 32GB RAM)",
                SerialNumber = "PF38ABC992",
                AssetTag = "MAL-TP-2024-031",
                AssignedDate = new DateOnly(2024, 6, 1),
                Status = "Active",
                Notes = "QA test automation runner."
            }
        };

        context.HardwareItems.AddRange(hardwareItems);

        // 3. Seed Tickets
        var tickets = new List<Ticket>
        {
            new()
            {
                Title = "VPN WireGuard Certificate Renewal for Kobenhavn Tech Cluster",
                Description = "Client staging environment requires updated TLS certs and WireGuard tunnel keys for the Manila team.",
                Queue = TicketQueue.ItInfrastructure,
                Status = TicketStatus.Open,
                CreatedByEmployeeId = arnel.Id,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-2),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-2)
            },
            new()
            {
                Title = "Secondary 4K Monitor Request for QA Test Matrix",
                Description = "Need an external display to test multi-breakpoint responsive layouts simultaneously.",
                Queue = TicketQueue.ItInfrastructure,
                Status = TicketStatus.InProgress,
                CreatedByEmployeeId = camille.Id,
                AssignedToEmployeeId = christian.Id,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-5),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-1)
            },
            new()
            {
                Title = "Certificate of Employment (COE) with Compensation for Home Loan",
                Description = "Requesting official Malayo International COE with monthly compensation breakdown for Pag-IBIG home mortgage.",
                Queue = TicketQueue.HrLegal,
                Status = TicketStatus.Open,
                CreatedByEmployeeId = bianca.Id,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-1),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-1)
            },
            new()
            {
                Title = "HMO Dependent Enrollment (PhilCare CarePlus)",
                Description = "Enrolling newborn child under dependent coverage. Birth certificate submitted.",
                Queue = TicketQueue.HrLegal,
                Status = TicketStatus.Resolved,
                CreatedByEmployeeId = danilo.Id,
                AssignedToEmployeeId = maria.Id,
                ResolutionNotes = "Dependent successfully endorsed and approved by PhilCare. Health card arrives next week.",
                CreatedAtUtc = DateTime.UtcNow.AddDays(-14),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-7)
            }
        };

        context.Tickets.AddRange(tickets);

        // 4. Seed Dual Calendar Holidays (2026)
        var holidays = new List<Holiday>
        {
            // Philippines Holidays 2026
            new() { Title = "New Year's Day", HolidayDate = new DateOnly(2026, 1, 1), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (PH)" },
            new() { Title = "Maundy Thursday", HolidayDate = new DateOnly(2026, 4, 2), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (Holy Week)" },
            new() { Title = "Good Friday", HolidayDate = new DateOnly(2026, 4, 3), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (Holy Week)" },
            new() { Title = "Araw ng Kagitingan (Day of Valor)", HolidayDate = new DateOnly(2026, 4, 9), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (PH)" },
            new() { Title = "Labor Day", HolidayDate = new DateOnly(2026, 5, 1), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (PH)" },
            new() { Title = "Philippine Independence Day", HolidayDate = new DateOnly(2026, 6, 12), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (PH)" },
            new() { Title = "Ninoy Aquino Day", HolidayDate = new DateOnly(2026, 8, 21), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Special Non-Working Holiday (PH)" },
            new() { Title = "National Heroes Day", HolidayDate = new DateOnly(2026, 8, 31), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (PH)" },
            new() { Title = "All Saints' Day", HolidayDate = new DateOnly(2026, 11, 1), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Special Non-Working Holiday (PH)" },
            new() { Title = "Bonifacio Day", HolidayDate = new DateOnly(2026, 11, 30), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (PH)" },
            new() { Title = "Feast of the Immaculate Conception", HolidayDate = new DateOnly(2026, 12, 8), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Special Non-Working Holiday (PH)" },
            new() { Title = "Christmas Day", HolidayDate = new DateOnly(2026, 12, 25), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (PH & DK)" },
            new() { Title = "Rizal Day", HolidayDate = new DateOnly(2026, 12, 30), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (PH)" },

            // Denmark Holidays 2026
            new() { Title = "Nytårsdag (New Year's Day)", HolidayDate = new DateOnly(2026, 1, 1), Country = CountryLocation.Denmark, IsWorkingDay = false, Notes = "National Holiday (DK)" },
            new() { Title = "Skærtorsdag (Maundy Thursday)", HolidayDate = new DateOnly(2026, 4, 2), Country = CountryLocation.Denmark, IsWorkingDay = false, Notes = "National Holiday (DK)" },
            new() { Title = "Langfredag (Good Friday)", HolidayDate = new DateOnly(2026, 4, 3), Country = CountryLocation.Denmark, IsWorkingDay = false, Notes = "National Holiday (DK)" },
            new() { Title = "2. Påskedag (Easter Monday)", HolidayDate = new DateOnly(2026, 4, 6), Country = CountryLocation.Denmark, IsWorkingDay = false, Notes = "National Holiday (DK - Manila working, DK closed)" },
            new() { Title = "Kristi Himmelfartsdag (Ascension Day)", HolidayDate = new DateOnly(2026, 5, 14), Country = CountryLocation.Denmark, IsWorkingDay = false, Notes = "National Holiday (DK - Manila working, DK closed)" },
            new() { Title = "2. Pinsedag (Whit Monday)", HolidayDate = new DateOnly(2026, 5, 25), Country = CountryLocation.Denmark, IsWorkingDay = false, Notes = "National Holiday (DK - Manila working, DK closed)" },
            new() { Title = "Grundlovsdag (Constitution Day)", HolidayDate = new DateOnly(2026, 6, 5), Country = CountryLocation.Denmark, IsWorkingDay = false, Notes = "Bank & National Holiday (DK)" },
            new() { Title = "Juledag (Christmas Day)", HolidayDate = new DateOnly(2026, 12, 25), Country = CountryLocation.Denmark, IsWorkingDay = false, Notes = "National Holiday (DK & PH)" },
            new() { Title = "2. Juledag (Boxing Day)", HolidayDate = new DateOnly(2026, 12, 26), Country = CountryLocation.Denmark, IsWorkingDay = false, Notes = "National Holiday (DK)" }
        };

        context.Holidays.AddRange(holidays);

        // 5. Seed Company Policies
        var gdprPolicy = new PolicyDocument
        {
            Title = "Cross-Border Data Security & GDPR Compliance Protocol",
            Version = "2.1",
            SummaryMarkdown = "Mandatory security standards for developers handling Danish client systems. Enforces disk encryption (FileVault/BitLocker), zero local storage of EU citizen PII, required 2FA/MFA on all client Git repositories, and strict prohibition of unapproved AI code copiers.",
            IsMandatory = true,
            PublishedAtUtc = DateTime.UtcNow.AddMonths(-3)
        };

        var equipmentPolicy = new PolicyDocument
        {
            Title = "Hardware Custody, Asset Care, & Return Agreement",
            Version = "1.3",
            SummaryMarkdown = "Terms governing company-provided hardware. Developers are custodians of laptops and peripherals. Any hardware malfunction, theft, or damage must be logged via IT Infrastructure ticket within 24 hours. Hardware must be surrendered upon separation.",
            IsMandatory = true,
            PublishedAtUtc = DateTime.UtcNow.AddMonths(-5)
        };

        var phBenefitsPolicy = new PolicyDocument
        {
            Title = "Philippine Statutory Benefits, 13th Month Pay, & Leaves Handbook",
            Version = "1.0",
            SummaryMarkdown = "Comprehensive guide on SSS, PhilHealth, Pag-IBIG remittances, mandated 13th month pay disbursement, 15 days paid annual leave (SIL), and Philippine holiday pay multipliers under the DOLE Labor Code.",
            IsMandatory = false,
            PublishedAtUtc = DateTime.UtcNow.AddMonths(-6)
        };

        context.PolicyDocuments.AddRange(gdprPolicy, equipmentPolicy, phBenefitsPolicy);
        await context.SaveChangesAsync();

        // 6. Seed Policy Acknowledgements
        var acknowledgements = new List<PolicyAcknowledgement>
        {
            new() { PolicyDocumentId = gdprPolicy.Id, EmployeeId = arnel.Id, AcknowledgedAtUtc = DateTime.UtcNow.AddMonths(-2) },
            new() { PolicyDocumentId = gdprPolicy.Id, EmployeeId = danilo.Id, AcknowledgedAtUtc = DateTime.UtcNow.AddMonths(-2) },
            new() { PolicyDocumentId = equipmentPolicy.Id, EmployeeId = arnel.Id, AcknowledgedAtUtc = DateTime.UtcNow.AddMonths(-2) },
            new() { PolicyDocumentId = equipmentPolicy.Id, EmployeeId = bianca.Id, AcknowledgedAtUtc = DateTime.UtcNow.AddMonths(-1) }
        };

        context.PolicyAcknowledgements.AddRange(acknowledgements);
        await context.SaveChangesAsync();
    }
}
