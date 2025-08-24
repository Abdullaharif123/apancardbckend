import express from "express";
import {
  signupUser,
  loginUser,
  forgotPassword,
  updatePassword,
  updateUserDetails,
  getUserByCardNumber,
  logoutUser,
  scanCard,
  signUpScanCard,
  getSignedUrlController,
  getAllUsers,
  getUserOrganization,
  assignPromoCodeToUser,
  getPromoCodeForUser,
  markPromoCodeAsUsed
} from "../../controllers/user/userController.js";
import { getCategoriesByUserId } from "../../controllers/superAdmin/categoryController.js";
import {
  getFiles,
  createFiles,
  deleteFiles,
} from "../../controllers/superAdmin/filesController.js";

import {
  getPrescriptionWithTablets,
  getUserPrescriptions,
  getUserPrescriptionsv2,
} from "../../controllers/user/prescriptionController.js";

import { verifyToken } from "../../middlewares/authMiddleware.js";
import validateUser from "../../middlewares/validateMiddleware/validateUser.js";

const router = express.Router();

router.post("/signup", validateUser, signupUser);
router.put("/scan-card/signup", signUpScanCard);
router.post("/login", loginUser);
router.post("/logout", verifyToken, logoutUser);
router.post("/forgot-password", forgotPassword);
router.post("/update-password", verifyToken, updatePassword);
router.put("/update-user-details/:userId", verifyToken, updateUserDetails);
router.get("/card/:cardNumber", getUserByCardNumber); //Will Delete this one later, when we confirm this scarn-card is working properly
router.get("/scan-card/:cardNumber", scanCard);
router.delete("/delete-file", deleteFiles);
router.get("/get-category-byorg/:id", getCategoriesByUserId);
router.post("/get-files", getFiles);
router.post("/create-files", createFiles);

router.post("/get-prescriptions", getUserPrescriptions);
router.get("/getAllPrescriptions/:userId", getUserPrescriptionsv2);
router.get("/prescriptions/:prescriptionId", getPrescriptionWithTablets);

//Get SignedUrl for FileUpload to S3

router.get("/get-signed-url", getSignedUrlController);
router.get('/users', getAllUsers);
router.get('/users/:userId/organization', getUserOrganization);
router.post('/assign-promo-code', assignPromoCodeToUser);
router.get("/get-promo-code/:partnerId", getPromoCodeForUser);
router.post("/mark-promo-code-used", markPromoCodeAsUsed);

export default router;
