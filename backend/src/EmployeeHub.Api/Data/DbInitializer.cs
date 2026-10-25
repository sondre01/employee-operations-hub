using Microsoft.EntityFrameworkCore;
using EmployeeHub.Api.Models.Entities;
using EmployeeHub.Api.Models.Enums;
using EmployeeHub.Api.Services.Common;

namespace EmployeeHub.Api.Data;

public static class DbInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        // Apply migrations for PostgreSQL or EnsureCreated for local SQLite/Supabase
        if (context.Database.IsNpgsql())
        {
            var moveSchemaSql = @"
DO $$
BEGIN
    CREATE SCHEMA IF NOT EXISTS employee_hub;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Departments') THEN
        ALTER TABLE public.""Departments"" SET SCHEMA employee_hub;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Employees') THEN
        ALTER TABLE public.""Employees"" SET SCHEMA employee_hub;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'HardwareItems') THEN
        ALTER TABLE public.""HardwareItems"" SET SCHEMA employee_hub;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Tickets') THEN
        ALTER TABLE public.""Tickets"" SET SCHEMA employee_hub;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Holidays') THEN
        ALTER TABLE public.""Holidays"" SET SCHEMA employee_hub;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PolicyDocuments') THEN
        ALTER TABLE public.""PolicyDocuments"" SET SCHEMA employee_hub;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'PolicyAcknowledgements') THEN
        ALTER TABLE public.""PolicyAcknowledgements"" SET SCHEMA employee_hub;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = '__EFMigrationsHistory') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'employee_hub' AND table_name = '__EFMigrationsHistory') THEN
            ALTER TABLE public.""__EFMigrationsHistory"" SET SCHEMA employee_hub;
        ELSE
            INSERT INTO employee_hub.""__EFMigrationsHistory"" (""MigrationId"", ""ProductVersion"")
            SELECT ""MigrationId"", ""ProductVersion"" FROM public.""__EFMigrationsHistory""
            ON CONFLICT (""MigrationId"") DO NOTHING;
            DROP TABLE public.""__EFMigrationsHistory"";
        END IF;
    END IF;
END $$;";
            try
            {
                await context.Database.ExecuteSqlRawAsync(moveSchemaSql);
                await context.Database.MigrateAsync();
            }
            catch
            {
                await context.Database.EnsureCreatedAsync();
            }
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
            try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE Employees ADD COLUMN FirstName TEXT NOT NULL DEFAULT '';"); } catch { }
            try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE Employees ADD COLUMN MiddleName TEXT NOT NULL DEFAULT '';"); } catch { }
            try { await context.Database.ExecuteSqlRawAsync("ALTER TABLE Employees ADD COLUMN LastName TEXT NOT NULL DEFAULT '';"); } catch { }
        }

        if (await context.Departments.AnyAsync() && await context.Employees.AnyAsync())
        {
            // Backfill existing rows if empty
            var existingStaff = await context.Employees.Where(e => e.FirstName == "" && e.LastName == "").ToListAsync();
            foreach (var staff in existingStaff)
            {
                var parts = staff.FullName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
                if (parts.Length == 1) { staff.FirstName = parts[0]; }
                else if (parts.Length == 2) { staff.FirstName = parts[0]; staff.LastName = parts[1]; }
                else if (parts.Length > 2) { staff.FirstName = parts[0]; staff.MiddleName = string.Join(" ", parts.Skip(1).Take(parts.Length - 2)); staff.LastName = parts[^1]; }
            }
            if (existingStaff.Count > 0)
            {
                await context.SaveChangesAsync();
            }
            return; // DB has already been seeded
        }

        // 1. Seed Core Departments
        var devOpsDept = new Department
        {
            Name = "Dev Operation",
            Description = "DevOps engineering, Kubernetes cluster management, CI/CD pipelines, and cloud infrastructure.",
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-12)
        };

        var itDept = new Department
        {
            Name = "IT Team",
            Description = "Workstation hardware custody, developer laptop provisioning, WireGuard VPN, and office network equipment.",
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-12)
        };

        var hrDept = new Department
        {
            Name = "HR/Recruitment",
            Description = "People operations, Certificate of Employment (COE), HMO enrollment, statutory benefits (SSS/PhilHealth/Pag-IBIG), and leaves.",
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-12)
        };

        var financeDept = new Department
        {
            Name = "Finance",
            Description = "Payroll, statutory remittance compliance, client billing, equipment purchase reimbursements, and tax document processing.",
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-12)
        };

        context.Departments.AddRange(devOpsDept, itDept, hrDept, financeDept);
        await context.SaveChangesAsync();

        // 2. Seed Employees with RBAC Roles and Default Passwords
        string defaultPasswordHash = PasswordHasher.HashPassword("Password123!");

        // Super Admin (The Manager of Dev Operation)
        var superAdmin = new Employee
        {
            FirstName = "Danilo",
            MiddleName = "R.",
            LastName = "Navarro",
            FullName = "Danilo Navarro",
            WorkEmail = "superadmin@company.io",
            PasswordHash = defaultPasswordHash,
            JobTitle = "Director of Dev Operations & Infrastructure",
            IsInternal = true,
            EmploymentType = EmploymentType.InternalCore,
            Role = UserRole.AdminHr,
            DepartmentId = devOpsDept.Id,
            TicketingRole = TicketingRole.SuperAdmin,
            HasTicketingAccess = true,
            CanAssignEmployees = true,
            ClientName = null,
            PrimaryTechStack = "Kubernetes, Terraform, AWS, Azure, Linux",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-12)
        };

        // Dev Ops Member (Normal Admin)
        var devOpsMember = new Employee
        {
            FirstName = "Christian",
            MiddleName = "P.",
            LastName = "Reyes",
            FullName = "Christian Reyes",
            WorkEmail = "devops@company.io",
            PasswordHash = defaultPasswordHash,
            JobTitle = "Senior DevOps & Cloud Engineer",
            IsInternal = true,
            EmploymentType = EmploymentType.InternalCore,
            Role = UserRole.AdminHr,
            DepartmentId = devOpsDept.Id,
            TicketingRole = TicketingRole.DevOpsAdmin,
            HasTicketingAccess = true,
            CanAssignEmployees = true, // Super admin gave permission to assign newly registered staff
            ClientName = null,
            PrimaryTechStack = "Docker, CI/CD GitHub Actions, WireGuard, Prometheus",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-10)
        };

        // HR Department Manager
        var hrManager = new Employee
        {
            FirstName = "Maria",
            MiddleName = "C.",
            LastName = "Santos",
            FullName = "Maria Santos",
            WorkEmail = "hr.manager@company.io",
            PasswordHash = defaultPasswordHash,
            JobTitle = "HR & Talent Operations Manager",
            IsInternal = true,
            EmploymentType = EmploymentType.InternalCore,
            Role = UserRole.AdminHr,
            DepartmentId = hrDept.Id,
            TicketingRole = TicketingRole.DepartmentManager,
            HasTicketingAccess = true,
            CanAssignEmployees = false,
            ClientName = null,
            PrimaryTechStack = "HRIS, DOLE Labor Compliance, Talent Acquisition",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-11)
        };

        // IT Team Specialist (Department Member)
        var itSpecialist = new Employee
        {
            FirstName = "Mark",
            MiddleName = "J.",
            LastName = "Villanueva",
            FullName = "Mark Villanueva",
            WorkEmail = "it.specialist@company.io",
            PasswordHash = defaultPasswordHash,
            JobTitle = "IT Hardware & Systems Specialist",
            IsInternal = true,
            EmploymentType = EmploymentType.InternalCore,
            Role = UserRole.AdminHr,
            DepartmentId = itDept.Id,
            TicketingRole = TicketingRole.DepartmentMember,
            HasTicketingAccess = true,
            CanAssignEmployees = false,
            ClientName = null,
            PrimaryTechStack = "macOS MDM, Jamf, Hardware Diagnostics, Windows 11 Pro",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-8)
        };

        // Finance Specialist (Department Member)
        var financeSpecialist = new Employee
        {
            FirstName = "Grace",
            MiddleName = "L.",
            LastName = "Tan",
            FullName = "Grace Tan",
            WorkEmail = "finance@company.io",
            PasswordHash = defaultPasswordHash,
            JobTitle = "Senior Finance & Payroll Specialist",
            IsInternal = true,
            EmploymentType = EmploymentType.InternalCore,
            Role = UserRole.AdminHr,
            DepartmentId = financeDept.Id,
            TicketingRole = TicketingRole.DepartmentMember,
            HasTicketingAccess = true,
            CanAssignEmployees = false,
            ClientName = null,
            PrimaryTechStack = "QuickBooks, BIR Compliance, Payroll Systems",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-9)
        };

        // External Client Dedicated Developer 1 (Manila engineer assigned to Danish Client)
        var devArnel = new Employee
        {
            FirstName = "Arnel",
            MiddleName = "D.",
            LastName = "Cruz",
            FullName = "Arnel Cruz",
            WorkEmail = "dev.arnel@company.io",
            PasswordHash = defaultPasswordHash,
            JobTitle = "Senior Full-Stack Engineer",
            IsInternal = false,
            EmploymentType = EmploymentType.ClientDedicated,
            Role = UserRole.Developer,
            DepartmentId = null,
            TicketingRole = TicketingRole.None,
            HasTicketingAccess = false,
            CanAssignEmployees = false,
            ClientName = "Kobenhavn Tech A/S",
            PrimaryTechStack = ".NET 8, React, PostgreSQL, Docker",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-8)
        };

        // External Client Dedicated Developer 2 (Manila engineer assigned to Danish Client)
        var devBianca = new Employee
        {
            FirstName = "Bianca",
            MiddleName = "S.",
            LastName = "Mendoza",
            FullName = "Bianca Mendoza",
            WorkEmail = "dev.bianca@company.io",
            PasswordHash = defaultPasswordHash,
            JobTitle = "Frontend Engineer",
            IsInternal = false,
            EmploymentType = EmploymentType.ClientDedicated,
            Role = UserRole.Developer,
            DepartmentId = null,
            TicketingRole = TicketingRole.None,
            HasTicketingAccess = false,
            CanAssignEmployees = false,
            ClientName = "Nordic Logistics Group",
            PrimaryTechStack = "React, TypeScript, Next.js",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow.AddMonths(-5)
        };

        context.Employees.AddRange(superAdmin, devOpsMember, hrManager, itSpecialist, financeSpecialist, devArnel, devBianca);
        await context.SaveChangesAsync();

        // 3. Seed Hardware Custody Items
        var hardwareItems = new List<HardwareCustodyItem>
        {
            new()
            {
                EmployeeId = devArnel.Id,
                ModelName = "MacBook Pro 16 M3 Pro (36GB RAM, 512GB SSD)",
                SerialNumber = "C02XYZ12345",
                AssetTag = "AST-MBP-2024-001",
                AssignedDate = new DateOnly(2024, 2, 1),
                Status = "Active",
                Notes = "Primary workstation with client VPN & security suite installed."
            },
            new()
            {
                EmployeeId = devArnel.Id,
                ModelName = "Dell UltraSharp 27 4K Monitor (U2723QE)",
                SerialNumber = "CN09876543",
                AssetTag = "AST-MON-2024-005",
                AssignedDate = new DateOnly(2024, 2, 5),
                Status = "Active",
                Notes = "Dual monitor setup for home office."
            },
            new()
            {
                EmployeeId = devBianca.Id,
                ModelName = "MacBook Air 15 M2 (16GB RAM, 512GB SSD)",
                SerialNumber = "C02ABC67890",
                AssetTag = "AST-MBA-2024-012",
                AssignedDate = new DateOnly(2024, 5, 15),
                Status = "Active",
                Notes = "Frontend development laptop."
            }
        };

        context.HardwareItems.AddRange(hardwareItems);

        // 4. Seed Department Tickets Across All 4 Queues
        var tickets = new List<Ticket>
        {
            new()
            {
                Title = "Kubernetes Staging Node Autoscaling Threshold Adjustment",
                Description = "Staging ingress pods hitting resource limits during Danish client sprint integration tests.",
                Priority = "High",
                DepartmentId = devOpsDept.Id,
                Queue = TicketQueue.ItInfrastructure,
                Status = TicketStatus.InProgress,
                CreatedByEmployeeId = devArnel.Id,
                AssignedToEmployeeId = devOpsMember.Id,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-2),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-1)
            },
            new()
            {
                Title = "WireGuard VPN Key Regeneration for Manila Dev Team",
                Description = "Quarterly rotation of VPN credentials to access Kobenhavn Tech staging VPC.",
                Priority = "Medium",
                DepartmentId = devOpsDept.Id,
                Queue = TicketQueue.ItInfrastructure,
                Status = TicketStatus.Open,
                CreatedByEmployeeId = devBianca.Id,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-1),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-1)
            },
            new()
            {
                Title = "MacBook Pro Battery Diagnostic & Service Request",
                Description = "Battery cycle count exceeded 950 cycles; laptop throttling during Docker container builds.",
                Priority = "Medium",
                DepartmentId = itDept.Id,
                Queue = TicketQueue.ItInfrastructure,
                Status = TicketStatus.InProgress,
                CreatedByEmployeeId = devArnel.Id,
                AssignedToEmployeeId = itSpecialist.Id,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-4),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-2)
            },
            new()
            {
                Title = "Certificate of Employment (COE) with Compensation for Mortgage Application",
                Description = "Need notarized COE stating gross monthly pay and client assignment for Pag-IBIG housing loan.",
                Priority = "High",
                DepartmentId = hrDept.Id,
                Queue = TicketQueue.HrLegal,
                Status = TicketStatus.Open,
                CreatedByEmployeeId = devBianca.Id,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-1),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-1)
            },
            new()
            {
                Title = "HMO Dependent Enrollment Endorsement (PhilCare)",
                Description = "Submitted birth certificate for dependent child enrollment under company HMO policy.",
                Priority = "Medium",
                DepartmentId = hrDept.Id,
                Queue = TicketQueue.HrLegal,
                Status = TicketStatus.Resolved,
                CreatedByEmployeeId = devArnel.Id,
                AssignedToEmployeeId = hrManager.Id,
                ResolutionNotes = "Dependent endorsed and approved by PhilCare. Health card dispatched to Manila office.",
                CreatedAtUtc = DateTime.UtcNow.AddDays(-10),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-3)
            },
            new()
            {
                Title = "Reimbursement for Ergonomic Keyboard & Peripheral Setup",
                Description = "Official receipt attached for wireless mechanical keyboard approved under remote setup stipend.",
                Priority = "Low",
                DepartmentId = financeDept.Id,
                Queue = TicketQueue.HrLegal,
                Status = TicketStatus.Resolved,
                CreatedByEmployeeId = devArnel.Id,
                AssignedToEmployeeId = financeSpecialist.Id,
                ResolutionNotes = "Receipt verified. Reimbursement included in mid-month payroll disbursement.",
                CreatedAtUtc = DateTime.UtcNow.AddDays(-12),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-5)
            }
        };

        context.Tickets.AddRange(tickets);

        // 5. Seed Dual Calendar Holidays (2026)
        var holidays = new List<Holiday>
        {
            new() { Title = "New Year's Day", HolidayDate = new DateOnly(2026, 1, 1), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (PH)" },
            new() { Title = "Maundy Thursday", HolidayDate = new DateOnly(2026, 4, 2), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (Holy Week)" },
            new() { Title = "Good Friday", HolidayDate = new DateOnly(2026, 4, 3), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (Holy Week)" },
            new() { Title = "Araw ng Kagitingan (Day of Valor)", HolidayDate = new DateOnly(2026, 4, 9), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (PH)" },
            new() { Title = "Labor Day", HolidayDate = new DateOnly(2026, 5, 1), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (PH)" },
            new() { Title = "Philippine Independence Day", HolidayDate = new DateOnly(2026, 6, 12), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (PH)" },
            new() { Title = "Christmas Day", HolidayDate = new DateOnly(2026, 12, 25), Country = CountryLocation.Philippines, IsWorkingDay = false, Notes = "Regular Holiday (PH & DK)" },

            new() { Title = "Nytårsdag (New Year's Day)", HolidayDate = new DateOnly(2026, 1, 1), Country = CountryLocation.Denmark, IsWorkingDay = false, Notes = "National Holiday (DK)" },
            new() { Title = "Skærtorsdag (Maundy Thursday)", HolidayDate = new DateOnly(2026, 4, 2), Country = CountryLocation.Denmark, IsWorkingDay = false, Notes = "National Holiday (DK)" },
            new() { Title = "Langfredag (Good Friday)", HolidayDate = new DateOnly(2026, 4, 3), Country = CountryLocation.Denmark, IsWorkingDay = false, Notes = "National Holiday (DK)" },
            new() { Title = "Kristi Himmelfartsdag (Ascension Day)", HolidayDate = new DateOnly(2026, 5, 14), Country = CountryLocation.Denmark, IsWorkingDay = false, Notes = "National Holiday (DK - Manila working, DK closed)" },
            new() { Title = "Juledag (Christmas Day)", HolidayDate = new DateOnly(2026, 12, 25), Country = CountryLocation.Denmark, IsWorkingDay = false, Notes = "National Holiday (DK & PH)" }
        };

        context.Holidays.AddRange(holidays);

        // 6. Seed Company Policies
        var gdprPolicy = new PolicyDocument
        {
            Title = "Cross-Border Data Security & GDPR Compliance Protocol",
            Version = "2.1",
            SummaryMarkdown = "Mandatory security standards for developers handling Danish client systems. Enforces disk encryption (FileVault/BitLocker), zero local storage of EU citizen PII, and required MFA on all client Git repositories.",
            IsMandatory = true,
            PublishedAtUtc = DateTime.UtcNow.AddMonths(-3)
        };

        var equipmentPolicy = new PolicyDocument
        {
            Title = "Hardware Custody, Asset Care, & Return Agreement",
            Version = "1.3",
            SummaryMarkdown = "Terms governing company-provided hardware. Laptops and monitors remain property of the company. Malfunctions must be logged via IT Team ticket within 24 hours.",
            IsMandatory = true,
            PublishedAtUtc = DateTime.UtcNow.AddMonths(-5)
        };

        context.PolicyDocuments.AddRange(gdprPolicy, equipmentPolicy);
        await context.SaveChangesAsync();

        // 7. Seed Policy Acknowledgements
        var acknowledgements = new List<PolicyAcknowledgement>
        {
            new() { PolicyDocumentId = gdprPolicy.Id, EmployeeId = devArnel.Id, AcknowledgedAtUtc = DateTime.UtcNow.AddMonths(-2) },
            new() { PolicyDocumentId = equipmentPolicy.Id, EmployeeId = devArnel.Id, AcknowledgedAtUtc = DateTime.UtcNow.AddMonths(-2) },
            new() { PolicyDocumentId = equipmentPolicy.Id, EmployeeId = devBianca.Id, AcknowledgedAtUtc = DateTime.UtcNow.AddMonths(-1) }
        };

        context.PolicyAcknowledgements.AddRange(acknowledgements);
        await context.SaveChangesAsync();
    }
}
