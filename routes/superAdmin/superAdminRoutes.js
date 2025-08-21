import express from "express";
import {
  createOrgCategoryPercentage,
  getOrgCategoryPercentages,
} from "../../controllers/superAdmin/organisationCategoryPercentageController.js";

import {
  createSuperAdmin,
  getSuperAdmins,
  getSuperAdminById,
  updateSuperAdmin,
  deleteSuperAdmin,
  getAllUsers,
  deleteUser,
  updateUserDetails,
  getUserById,
  createUser,
  resetPassword,
  changePassword,
  getAllAdmins,
} from "../../controllers/superAdmin/superAdminController.js";

import {
  createOrganisation,
  getOrganisationById,
  updateOrganisation,
  deleteOrganisation,
  getOrganisations,
  getOrganisationsWithDetails,
  updateOrganisationCategories,
  getUsersByOrganization,
  updateOrganisationCards,
  getOrganisationNames,
  getOrganisationCategories,
} from "../../controllers/superAdmin/organisationController.js";

import {
  createCategory,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getActiveCategories,
} from "../../controllers/superAdmin/categoryController.js";

import {
  createMedicine,
  updateMedicine,
  deleteMedicine,
  getAllMedicines,
} from "../../controllers/superAdmin/medicineController.js";

import { getDashboardDetails } from "../../controllers/superAdmin/dashboardController.js";

import { verifyToken } from "../../middlewares/authMiddleware.js";
import { checkRole } from "../../middlewares/checkRole.js"; // Custom middleware to check if the user is a SuperAdmin
import { roles } from "../../helper/enum.js";
import { savePromoCodes } from "../../controllers/superAdmin/promocodecontroller.js";


const router = express.Router();
router.get("/organisation-names", getOrganisationNames);
// Middleware to check if the user is a SuperAdmin
//router.use(verifyToken);
//router.use(checkRole(roles.superAdmin));

// Routes for SuperAdmin CRUD operations
router.post("/create-super-admins", createSuperAdmin);
router.get("/get-super-admins", getSuperAdmins);
router.get("/get-super-admins/:id", getSuperAdminById);
router.put("/update-super-admins/:id", updateSuperAdmin);
router.delete("/delete-super-admins/:id", deleteSuperAdmin);

router.post("/create-user", createUser);
router.delete("/delete-user/:id", deleteUser);
router.get("/users", getAllUsers);
router.get("/users/:id", getUserById);
router.post("/reset-password/:userId", resetPassword);
router.post("/change-password/:userId", changePassword);
router.put("/update-users-details/:id", updateUserDetails);

router.post("/create-organisation", createOrganisation);
router.get("/get-organisation/:id", getOrganisationById);
router.get(
  "/get-users-by-organization/:organizationId",
  getUsersByOrganization
);
router.put("/update-organisation/:id", updateOrganisation);
router.put("/update-organisation-category/:id", updateOrganisationCategories);
router.put("/update-organisation-cards/:id", updateOrganisationCards);
router.get("/organisations", getOrganisations);

router.get("/organisation-details", getOrganisationsWithDetails);
router.delete("/delete-organisation/:id", deleteOrganisation);

router.post("/create-org-category-percentage", createOrgCategoryPercentage);
router.get("/get-org-category-percentages/:organisationId", getOrgCategoryPercentages);
router.post("/create-category", createCategory);
router.get("/get-category/:id", getCategoryById);
router.put("/update-category/:id", updateCategory);
router.get("/categories", getAllCategories);
router.get("/active-categories", getActiveCategories);
router.delete("/delete-category/:id", deleteCategory);
router.get("/organisation-categories/:organisationId", getOrganisationCategories);


router.post("/create-medicine", createMedicine);
router.put("/update-medicine/:id", updateMedicine);
router.get("/medicines", getAllMedicines);
router.delete("/delete-medicine/:id", deleteMedicine);

router.get("/get-dashboard", getDashboardDetails);
router.get("/admins", getAllAdmins);
router.post("/save-promo-codes", savePromoCodes);

export default router;
