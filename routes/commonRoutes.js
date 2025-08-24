// routes/commonRoutes.js

import { Router } from "express";

import {
  getAllUsersforAdmin,
  getAllOrganisations,
  getCategoriesByOrganisation,
  getCategoryPercentage,
  getUnusedPromoCode,
  saveUserPromoCode,
} from "../controllers/user/userpromocodecontroller.js";

const router = Router();

// Public/shared routes
router.get("/user/users", getAllUsersforAdmin);               // → /api/user/users
router.get("/organisation", getAllOrganisations);             // → /api/organisation
router.get("/organisation/:orgId/categories", getCategoriesByOrganisation);
router.get("/organisation/:orgId/categories/:catId/percentage", getCategoryPercentage);
router.get("/organisation/:orgId/promo-codes/unused", getUnusedPromoCode);
router.post("/user-promo-codes", saveUserPromoCode);

export default router;