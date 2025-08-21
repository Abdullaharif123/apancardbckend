import express from "express";
import {
  getAllUsers,
  deleteUser,
  updateUserDetails,
  createUser,
  getOrganisationName,
  getUserById,
  changePassword,
  updateOrganizationInvoiceTemplate,
  getOrganisationById,
} from "../../controllers/admin/adminController.js";
import {
  createService,
  deleteService,
  getServiceById,
  getServices,
  updateService,
} from "../../controllers/admin/serviceController.js";
import {
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getActiveCategories,
} from "../../controllers/admin/categoryController.js";
import {
  createPrescription,
  getPrescriptionWithTablets,
} from "../../controllers/admin/prescriptionController.js";
import { getAllMedicinesWOPagination } from "../../controllers/superAdmin/medicineController.js";
import { getDashboardDetails } from "../../controllers/admin/dashboardController.js";
import { verifyToken } from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/checkRole.js"; // Custom middleware to check if the user is a Admin
import { roles } from "../../helper/enum.js";

const router = express.Router();

// Middleware to check if the user is a Admin
router.use(verifyToken);
router.use(checkRole(roles.admin));

router.post("/create-user", createUser);
router.get("/users", getAllUsers);
router.delete("/delete-user/:id", deleteUser);
router.put("/update-users-details/:id", updateUserDetails);
router.get("/organisation-name", getOrganisationName);
router.get("/users/:id", getUserById);
router.post("/change-password/:userId", changePassword);
router.get("/get-dashboard", getDashboardDetails);

router.post("/create-service", createService);
router.get("/get-all-services", getServices);
router.get("/get-service/:id", getServiceById);
router.put("/update-service/:id", updateService);
router.delete("/delete-service/:id", deleteService);

router.post("/create-category", createCategory);
router.get("/get-category/:id", getCategoryById);
router.put("/update-category/:id", updateCategory);
router.put(
  "/update-organization-invoice-template",
  updateOrganizationInvoiceTemplate
);

router.get("/get-organisation/:id", getOrganisationById);

router.get("/categories", getAllCategories);
router.get("/active-categories", getActiveCategories);
router.delete("/delete-category/:id", deleteCategory);

// Routes for PrescriptionsV2
router.post("/prescriptions/:userId", createPrescription);
router.get("/prescriptions/:prescriptionId", getPrescriptionWithTablets);

router.get("/medicines", getAllMedicinesWOPagination);

export default router;
