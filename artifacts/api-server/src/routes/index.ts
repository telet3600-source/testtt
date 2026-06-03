import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import portalRouter from "./portal";
import customersRouter from "./customers";
import vehiclesRouter from "./vehicles";
import ordersRouter from "./orders";
import invoicesRouter from "./invoices";
import techniciansRouter from "./technicians";
import reviewsRouter from "./reviews";
import dashboardRouter from "./dashboard";
import reportsRouter from "./reports";
import superadminRouter from "./superadmin";
import seedRouter from "./seed";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(portalRouter);
router.use(customersRouter);
router.use(vehiclesRouter);
router.use(ordersRouter);
router.use(invoicesRouter);
router.use(techniciansRouter);
router.use(reviewsRouter);
router.use(dashboardRouter);
router.use(reportsRouter);
router.use(superadminRouter);
router.use(seedRouter);

export default router;
