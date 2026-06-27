import { Router, type IRouter } from "express";
import healthRouter from "./health";
import floorplanRouter from "./floorplan";

const router: IRouter = Router();

router.use(healthRouter);
router.use(floorplanRouter);

export default router;
