using Microsoft.EntityFrameworkCore;
using EmployeeHub.Api.Models.Entities;

namespace EmployeeHub.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Department> Departments => Set<Department>();
    public DbSet<HardwareCustodyItem> HardwareItems => Set<HardwareCustodyItem>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<Holiday> Holidays => Set<Holiday>();
    public DbSet<PolicyDocument> PolicyDocuments => Set<PolicyDocument>();
    public DbSet<PolicyAcknowledgement> PolicyAcknowledgements => Set<PolicyAcknowledgement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Department configurations
        modelBuilder.Entity<Department>(entity =>
        {
            entity.HasKey(d => d.Id);
            entity.Property(d => d.Name).IsRequired().HasMaxLength(100);
            entity.HasIndex(d => d.Name).IsUnique();
            entity.Property(d => d.Description).HasMaxLength(500);
        });

        // Employee configurations
        modelBuilder.Entity<Employee>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.FirstName).HasMaxLength(100);
            entity.Property(e => e.MiddleName).HasMaxLength(100);
            entity.Property(e => e.LastName).HasMaxLength(100);
            entity.Property(e => e.FullName).IsRequired().HasMaxLength(150);
            entity.Property(e => e.WorkEmail).IsRequired().HasMaxLength(150);
            entity.HasIndex(e => e.WorkEmail).IsUnique();
            entity.Property(e => e.JobTitle).IsRequired().HasMaxLength(100);
            entity.Property(e => e.ClientName).HasMaxLength(150);
            entity.Property(e => e.PrimaryTechStack).HasMaxLength(250);

            entity.HasOne(e => e.Department)
                  .WithMany(d => d.Members)
                  .HasForeignKey(e => e.DepartmentId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // HardwareCustodyItem configurations
        modelBuilder.Entity<HardwareCustodyItem>(entity =>
        {
            entity.HasKey(h => h.Id);
            entity.Property(h => h.ModelName).IsRequired().HasMaxLength(150);
            entity.Property(h => h.SerialNumber).IsRequired().HasMaxLength(100);
            entity.Property(h => h.AssetTag).IsRequired().HasMaxLength(100);
            entity.HasIndex(h => h.AssetTag).IsUnique();
            entity.Property(h => h.Status).IsRequired().HasMaxLength(50);
            
            entity.HasOne(h => h.Employee)
                  .WithMany(e => e.HardwareItems)
                  .HasForeignKey(h => h.EmployeeId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // Ticket configurations
        modelBuilder.Entity<Ticket>(entity =>
        {
            entity.HasKey(t => t.Id);
            entity.Property(t => t.Title).IsRequired().HasMaxLength(200);
            entity.Property(t => t.Description).IsRequired().HasMaxLength(2000);
            entity.Property(t => t.Priority).HasMaxLength(50);
            entity.Property(t => t.ResolutionNotes).HasMaxLength(2000);

            entity.HasOne(t => t.Department)
                  .WithMany(d => d.Tickets)
                  .HasForeignKey(t => t.DepartmentId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(t => t.CreatedByEmployee)
                  .WithMany(e => e.CreatedTickets)
                  .HasForeignKey(t => t.CreatedByEmployeeId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(t => t.AssignedToEmployee)
                  .WithMany(e => e.AssignedTickets)
                  .HasForeignKey(t => t.AssignedToEmployeeId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // Holiday configurations
        modelBuilder.Entity<Holiday>(entity =>
        {
            entity.HasKey(h => h.Id);
            entity.Property(h => h.Title).IsRequired().HasMaxLength(200);
            entity.Property(h => h.Notes).HasMaxLength(500);
            entity.HasIndex(h => new { h.HolidayDate, h.Country });
        });

        // PolicyDocument configurations
        modelBuilder.Entity<PolicyDocument>(entity =>
        {
            entity.HasKey(p => p.Id);
            entity.Property(p => p.Title).IsRequired().HasMaxLength(200);
            entity.Property(p => p.Version).IsRequired().HasMaxLength(20);
            entity.Property(p => p.SummaryMarkdown).IsRequired();
        });

        // PolicyAcknowledgement configurations
        modelBuilder.Entity<PolicyAcknowledgement>(entity =>
        {
            entity.HasKey(pa => pa.Id);
            
            entity.HasOne(pa => pa.PolicyDocument)
                  .WithMany(p => p.Acknowledgements)
                  .HasForeignKey(pa => pa.PolicyDocumentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pa => pa.Employee)
                  .WithMany(e => e.PolicyAcknowledgements)
                  .HasForeignKey(pa => pa.EmployeeId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(pa => new { pa.PolicyDocumentId, pa.EmployeeId }).IsUnique();
        });
    }
}
