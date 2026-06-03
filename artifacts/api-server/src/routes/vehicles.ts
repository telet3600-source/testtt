import { Router } from "express";
import { db } from "../lib/db";
import { vehiclesTable, customersTable, workOrdersTable, oilRecordsTable } from "@workspace/db";
import { eq, and, or, ilike, desc } from "drizzle-orm";
import { requireStaff } from "../lib/auth";

const router = Router();

router.get("/vehicles", requireStaff, async (req, res) => {
  const search = req.query.search as string | undefined;
  const customerId = req.query.customerId ? Number(req.query.customerId) : undefined;

  let query = db.select({ v: vehiclesTable, c: customersTable }).from(vehiclesTable).leftJoin(customersTable, eq(vehiclesTable.customerId, customersTable.id)).$dynamic();
  if (customerId) query = query.where(eq(vehiclesTable.customerId, customerId));
  else if (search) {
    query = query.where(or(
      ilike(vehiclesTable.plateNumber, `%${search}%`),
      ilike(vehiclesTable.make, `%${search}%`),
      ilike(vehiclesTable.model, `%${search}%`),
    ));
  }
  const rows = await query.orderBy(desc(vehiclesTable.createdAt));
  res.json(rows.map(r => ({ ...r.v, customerName: r.c?.fullName ?? "" })));
});

router.post("/vehicles", requireStaff, async (req, res) => {
  const { customerId, plateNumber, make, model, year, color, bodyType, fuelType, transmission, currentMileage, engineSize, vin, notes } = req.body;
  const [v] = await db.insert(vehiclesTable).values({ customerId, plateNumber, make, model, year, color, bodyType: bodyType || "sedan", fuelType: fuelType || "petrol", transmission: transmission || "automatic", currentMileage, engineSize, vin, notes, tenantId: req.session.tenantId }).returning();
  res.status(201).json({ ...v, customerName: "" });
});

router.get("/vehicles/:id", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const [row] = await db.select({ v: vehiclesTable, c: customersTable }).from(vehiclesTable).leftJoin(customersTable, eq(vehiclesTable.customerId, customersTable.id)).where(eq(vehiclesTable.id, id)).limit(1);
  if (!row) { res.status(404).json({ error: "Not found" }); return; }
  const oilRecords = await db.select().from(oilRecordsTable).where(eq(oilRecordsTable.vehicleId, id)).orderBy(desc(oilRecordsTable.createdAt));
  const history = await db.select().from(workOrdersTable).where(eq(workOrdersTable.vehicleId, id)).orderBy(desc(workOrdersTable.createdAt)).limit(20);
  const lastOil = oilRecords[0] ?? null;
  res.json({ ...row.v, customerName: row.c?.fullName ?? "", lastOilChange: lastOil, nextOilChangeMileage: lastOil?.nextChangeMileage ?? null, nextOilChangeDate: lastOil?.nextChangeDate ?? null, oilChangeOverdue: false, maintenanceHistory: history.map(o => ({ ...o, customerName: "", vehiclePlate: row.v.plateNumber, vehicleMake: row.v.make, vehicleModel: row.v.model, vehicleYear: row.v.year, assignedTechnicianName: null })) });
});

router.put("/vehicles/:id", requireStaff, async (req, res) => {
  const id = Number(req.params.id);
  const { plateNumber, make, model, year, color, bodyType, fuelType, transmission, currentMileage, engineSize, notes } = req.body;
  const [v] = await db.update(vehiclesTable).set({ plateNumber, make, model, year, color, bodyType, fuelType, transmission, currentMileage, engineSize, notes }).where(eq(vehiclesTable.id, id)).returning();
  res.json({ ...v, customerName: "" });
});

router.get("/vehicles/:id/oil-records", requireStaff, async (req, res) => {
  const records = await db.select().from(oilRecordsTable).where(eq(oilRecordsTable.vehicleId, Number(req.params.id))).orderBy(desc(oilRecordsTable.createdAt));
  res.json(records);
});

router.post("/vehicles/:id/oil-records", requireStaff, async (req, res) => {
  const vehicleId = Number(req.params.id);
  const { type, brand, viscosity, quantityLiters, mileageAtChange, nextChangeMileage, nextChangeDate, notes } = req.body;
  const [record] = await db.insert(oilRecordsTable).values({ vehicleId, type: type || "synthetic", brand, viscosity, quantityLiters, mileageAtChange, nextChangeMileage, nextChangeDate: nextChangeDate ? new Date(nextChangeDate) : null, notes, tenantId: req.session.tenantId, createdBy: req.session.userId }).returning();
  res.status(201).json(record);
});

export default router;
