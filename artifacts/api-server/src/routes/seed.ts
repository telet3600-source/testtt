import { Router } from "express";
import { db } from "../lib/db";
import { tenantsTable, superAdminsTable, usersTable, customersTable, vehiclesTable, workOrdersTable, techniciansTable, orderServicesTable, orderPartsTable, invoicesTable, reviewsTable } from "@workspace/db";
import { hashPassword } from "../lib/auth";
import { nanoid } from "nanoid";

const router = Router();

router.post("/seed", async (req, res) => {
  try {
    // Check if already seeded
    const existing = await db.select().from(tenantsTable).limit(1);
    if (existing.length > 0) {
      res.json({ ok: true, message: "Already seeded" });
      return;
    }

    // Super admin
    await db.insert(superAdminsTable).values({ email: "super@garage.sa", passwordHash: await hashPassword("Super@1234") });

    // Tenant
    const [tenant] = await db.insert(tenantsTable).values({
      slug: "al-nakheel", nameAr: "ورشة النخيل", nameEn: "Al-Nakheel Workshop",
      taglineAr: "خدمة سريعة واحترافية", taglineEn: "Fast & Professional Service",
      country: "SA", currency: "SAR", plan: "full", maxUsers: 20, maxOrdersPerMonth: 1000,
      phone: "+966501234567", addressAr: "الرياض، حي النخيل",
    }).returning();

    // Admin user
    const [adminUser] = await db.insert(usersTable).values({ tenantId: tenant.id, email: "admin@garage.sa", passwordHash: await hashPassword("Admin@1234"), role: "admin", fullName: "أحمد الإدارة", isActive: true }).returning();

    // Technician users
    const [techUser1] = await db.insert(usersTable).values({ tenantId: tenant.id, email: "tech1@garage.sa", passwordHash: await hashPassword("Tech@1234"), role: "technician", fullName: "محمد الفني", phone: "+966501111111", isActive: true }).returning();
    const [techUser2] = await db.insert(usersTable).values({ tenantId: tenant.id, email: "tech2@garage.sa", passwordHash: await hashPassword("Tech@1234"), role: "technician", fullName: "علي الميكانيكي", phone: "+966502222222", isActive: true }).returning();

    const [tech1] = await db.insert(techniciansTable).values({ tenantId: tenant.id, userId: techUser1.id, specialization: ["engine", "electrical"], shift: "morning", isAvailable: true, totalOrdersCompleted: 45 }).returning();
    const [tech2] = await db.insert(techniciansTable).values({ tenantId: tenant.id, userId: techUser2.id, specialization: ["brakes", "suspension"], shift: "evening", isAvailable: true, totalOrdersCompleted: 32 }).returning();

    // Customer user
    const [custUser1] = await db.insert(usersTable).values({ tenantId: tenant.id, email: "khaled@example.com", passwordHash: await hashPassword("Customer@1234"), role: "customer", fullName: "خالد العبدالله", isActive: true }).returning();
    const [custUser2] = await db.insert(usersTable).values({ tenantId: tenant.id, email: "sara@example.com", passwordHash: await hashPassword("Customer@1234"), role: "customer", fullName: "سارة المحمد", isActive: true }).returning();

    // Customers
    const [cust1] = await db.insert(customersTable).values({ tenantId: tenant.id, userId: custUser1.id, fullName: "خالد العبدالله", phonePrimary: "0501234567", email: "khaled@example.com", ownerType: "individual", gender: "male", address: "الرياض، العليا", createdBy: adminUser.id }).returning();
    const [cust2] = await db.insert(customersTable).values({ tenantId: tenant.id, userId: custUser2.id, fullName: "سارة المحمد", phonePrimary: "0509876543", email: "sara@example.com", ownerType: "individual", gender: "female", address: "الرياض، السليمانية", createdBy: adminUser.id }).returning();
    const [cust3] = await db.insert(customersTable).values({ tenantId: tenant.id, fullName: "شركة الأفق للتجارة", phonePrimary: "0112345678", email: "info@ufq.sa", ownerType: "private_company", address: "الرياض، الملك فهد", createdBy: adminUser.id }).returning();

    // Vehicles
    const [v1] = await db.insert(vehiclesTable).values({ tenantId: tenant.id, customerId: cust1.id, plateNumber: "أ ب ج 1234", make: "تويوتا", model: "كامري", year: 2021, color: "أبيض", bodyType: "sedan", fuelType: "petrol", transmission: "automatic", currentMileage: 45000 }).returning();
    const [v2] = await db.insert(vehiclesTable).values({ tenantId: tenant.id, customerId: cust1.id, plateNumber: "د ه و 5678", make: "لكزس", model: "ES 350", year: 2022, color: "أسود", bodyType: "sedan", fuelType: "petrol", transmission: "automatic", currentMileage: 30000 }).returning();
    const [v3] = await db.insert(vehiclesTable).values({ tenantId: tenant.id, customerId: cust2.id, plateNumber: "ز ح ط 9012", make: "هيونداي", model: "توسان", year: 2023, color: "رمادي", bodyType: "suv", fuelType: "petrol", transmission: "automatic", currentMileage: 15000 }).returning();
    const [v4] = await db.insert(vehiclesTable).values({ tenantId: tenant.id, customerId: cust3.id, plateNumber: "ي ك ل 3456", make: "فورد", model: "F-150", year: 2020, color: "أزرق", bodyType: "pickup", fuelType: "petrol", transmission: "automatic", currentMileage: 80000 }).returning();

    // Work Orders
    const [o1] = await db.insert(workOrdersTable).values({
      tenantId: tenant.id, orderNumber: "GR-2506-1001",
      vehicleId: v1.id, customerId: cust1.id, status: "in_progress", priority: "normal",
      assignedTechnicianId: techUser1.id, customerComplaint: "صوت غريب عند الإقلاع وضعف في أداء المحرك",
      diagnosisNotes: "حاجة لتغيير شمعات الإشعال وفلتر الهواء", mileageAtReception: 44850,
      fuelLevel: "3/4", estimatedCostMin: "800", estimatedCostMax: "1200",
      totalLaborCost: "400", totalPartsCost: "500", grandTotal: "900",
      trackingToken: nanoid(16), trackingTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: adminUser.id,
    }).returning();

    const [o2] = await db.insert(workOrdersTable).values({
      tenantId: tenant.id, orderNumber: "GR-2506-1002",
      vehicleId: v3.id, customerId: cust2.id, status: "waiting_approval", priority: "urgent",
      assignedTechnicianId: techUser2.id, customerComplaint: "المكابح تصدر صوتاً عند الضغط عليها",
      diagnosisNotes: "تلف في تيل الفرامل الأمامي واليساري، يُنصح بتغيير القرص أيضاً",
      mileageAtReception: 14900, fuelLevel: "1/2",
      estimatedCostMin: "600", estimatedCostMax: "900",
      trackingToken: nanoid(16), trackingTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: adminUser.id,
    }).returning();

    const [o3] = await db.insert(workOrdersTable).values({
      tenantId: tenant.id, orderNumber: "GR-2506-1003",
      vehicleId: v2.id, customerId: cust1.id, status: "ready", priority: "vip",
      assignedTechnicianId: techUser1.id, customerComplaint: "صيانة دورية كاملة وتغيير زيت",
      diagnosisNotes: "تم إجراء الصيانة الكاملة", workDescription: "تغيير زيت المحرك وفلتر الزيت والهواء، فحص شامل",
      mileageAtReception: 29800, fuelLevel: "Full",
      totalLaborCost: "300", totalPartsCost: "250", discountAmount: "50", grandTotal: "500",
      paymentStatus: "pending",
      trackingToken: nanoid(16), trackingTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: adminUser.id,
    }).returning();

    const [o4] = await db.insert(workOrdersTable).values({
      tenantId: tenant.id, orderNumber: "GR-2506-1000",
      vehicleId: v4.id, customerId: cust3.id, status: "delivered", priority: "normal",
      assignedTechnicianId: techUser2.id, customerComplaint: "تعليق متعب وضجيج عند المرور على المطبات",
      workDescription: "تم استبدال مساعدات الإطار الأمامية",
      mileageAtReception: 79500, fuelLevel: "1/4",
      totalLaborCost: "500", totalPartsCost: "700", grandTotal: "1200",
      paymentStatus: "paid", actualDeliveryAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      trackingToken: nanoid(16), trackingTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdBy: adminUser.id,
    }).returning();

    // Services for o1
    await db.insert(orderServicesTable).values([
      { orderId: o1.id, serviceNameAr: "تغيير شمعات الإشعال", serviceNameEn: "Spark Plugs Replacement", quantity: "1", unitPrice: "200", totalPrice: "200", status: "completed" },
      { orderId: o1.id, serviceNameAr: "تنظيف وضبط المحرك", serviceNameEn: "Engine Tuning", quantity: "1", unitPrice: "200", totalPrice: "200", status: "in_progress" },
    ]);

    await db.insert(orderPartsTable).values([
      { orderId: o1.id, partNameAr: "شمعات إشعال NGK", partNameEn: "NGK Spark Plugs", brand: "NGK", quantity: "4", unitCost: "80", unitPrice: "100", totalCost: "320", totalPrice: "400", warrantyDays: 365 },
      { orderId: o1.id, partNameAr: "فلتر هواء", partNameEn: "Air Filter", brand: "Toyota", quantity: "1", unitCost: "60", unitPrice: "100", totalCost: "60", totalPrice: "100" },
    ]);

    // Invoice for o3
    const [inv] = await db.insert(invoicesTable).values({
      tenantId: tenant.id, invoiceNumber: "INV-2506-001", orderId: o3.id, customerId: cust1.id,
      subtotal: "550", discountAmount: "50", taxRate: "0", taxAmount: "0", total: "500",
      totalPaid: "0", balanceDue: "500", currency: "SAR", status: "issued", paymentStatus: "pending",
      issuedAt: new Date(), createdBy: adminUser.id,
    }).returning();

    // Invoice for o4 (paid)
    await db.insert(invoicesTable).values({
      tenantId: tenant.id, invoiceNumber: "INV-2506-000", orderId: o4.id, customerId: cust3.id,
      subtotal: "1200", discountAmount: "0", taxRate: "0", taxAmount: "0", total: "1200",
      totalPaid: "1200", balanceDue: "0", currency: "SAR", status: "issued", paymentStatus: "paid",
      issuedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), createdBy: adminUser.id,
    });

    // Review for o4
    await db.insert(reviewsTable).values({
      tenantId: tenant.id, orderId: o4.id, customerId: cust3.id, technicianId: tech2.id,
      overallRating: 5, speedRating: 4, qualityRating: 5, communicationRating: 5, cleanlinessRating: 4,
      commentAr: "خدمة ممتازة وسريعة، الفريق محترف جداً وصادق في التشخيص. سأعود بالتأكيد",
    });

    res.json({
      ok: true,
      credentials: {
        admin: { email: "admin@garage.sa", password: "Admin@1234" },
        superAdmin: { email: "super@garage.sa", password: "Super@1234" },
        customer: { phone: "0501234567", password: "Customer@1234" },
        technician: { email: "tech1@garage.sa", password: "Tech@1234" },
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
