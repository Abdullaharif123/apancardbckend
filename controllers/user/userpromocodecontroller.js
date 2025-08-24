import Organisation from "../../models/Organisation.js";
import Category from "../../models/Category.js";
import OrganisationCategoryPercentage from "../../models/OrganisationCategoryPercentage.js";
import PromoCode from "../../models/promocode.js";
import User from "../../models/User.js";
import UserPromoCode from "../../models/userpromocode.js";
import ResponseService from "../../helper/responseObject.js";
import constants from "../../utils/constants.js";
import messages from "../../utils/messages.js";

// 1. Get all users (for Admin only)
export const getAllUsersforAdmin = async (req, res) => {
  try {
    const users = await User.find({ isActive: true })
      .select("firstName lastName email role")
      .lean();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      users,
      messages.DATA_FOUND
    );
    return res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Error fetching users:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
  }
};

// 2. Get all organisations
export const getAllOrganisations = async (req, res) => {
  try {
    const orgs = await Organisation.find({ isActive: true })
      .select("organisationName")
      .lean();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      orgs,
      messages.DATA_FOUND
    );
    return res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Error fetching organisations:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
  }
};

// 3. Get categories by organisation
export const getCategoriesByOrganisation = async (req, res) => {
  try {
    const { orgId } = req.params;

    const organisation = await Organisation.findById(orgId).populate({
      path: "categories",
      model: Category,
      select: "categoryName",
    });

    if (!organisation) {
      ResponseService.status = constants.CODE.NOT_FOUND;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.ORGANISATION_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    const categories = organisation.categories || [];

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      categories.map((cat) => ({
        _id: cat._id,
        name: cat.categoryName, // frontend expects `name`
      })),
      messages.DATA_FOUND
    );
    return res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Error fetching categories:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
  }
};

// 4. Get percentage for a category in an organisation
export const getCategoryPercentage = async (req, res) => {
  try {
    const { orgId, catId } = req.params;

    // 🔒 Validate IDs
    if (!orgId || !catId || orgId === "null" || catId === "null") {
      return res.status(400).json({
        success: false,
        message: "Organisation ID and Category ID are required",
      });
    }

    const isValidId = (id) => /^[0-9a-fA-F]{24}$/.test(id);
    if (!isValidId(orgId) || !isValidId(catId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ID format",
      });
    }

    // 🔍 Find the percentage config for this org
    const percentageDoc = await OrganisationCategoryPercentage.findOne({
      organisationId: orgId,
    });

    if (!percentageDoc) {
      return res.status(404).json({
        success: false,
        message: "No percentage configuration found for this organisation",
      });
    }

    // 🔍 Find the category in the array
    const categoryConfig = percentageDoc.categories.find(
      (c) => c.categoryId.toString() === catId
    );

    if (!categoryConfig) {
      return res.status(404).json({
        success: false,
        message: "No percentage assigned for this category",
      });
    }

    // ✅ Return percentage
    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { percentage: categoryConfig.percentage },
      "Percentage fetched successfully"
    );
    return res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Error fetching percentage:", err);

    // ✅ Handle CastError and other mongoose errors
    if (err.name === "CastError") {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        "Invalid ID format"
      );
      return res.status(ResponseService.status).json(response);
    }

    // 🔥 Generic server error
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
  }
};

// 5. Get unused promo code from organisation
export const getUnusedPromoCode = async (req, res) => {
  try {
    const { orgId } = req.params;

    const promoCode = await PromoCode.findOne({
      partnerId: orgId,
      status: "unused",
    }).select("code");

    if (!promoCode) {
      ResponseService.status = constants.CODE.NOT_FOUND;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        "No unused promo code available"
      );
      return res.status(ResponseService.status).json(response);
    }

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { promoCode: promoCode.code },
      messages.DATA_FOUND
    );
    return res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Error fetching unused promo code:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
  }
};

// 6. Save user-promo assignment
export const saveUserPromoCode = async (req, res) => {
  try {
    const {
      userId,
      organisationId,
      categoryId,
      promoCode,
      billAmount,
      discountedAmount,
      percentage,
    } = req.body;

    if (!userId || !organisationId || !categoryId || !promoCode || !billAmount) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        "All required fields must be provided"
      );
      return res.status(ResponseService.status).json(response);
    }

    // Create new record
    const newUserPromo = new UserPromoCode({
      userId,
      organisationId,
      categoryId,
      promoCode,
      billAmount: Number(billAmount),
      discountedAmount: Number(discountedAmount),
      percentage: Number(percentage),
    });

    await newUserPromo.save();

    // Mark promo code as used
    await PromoCode.findOneAndUpdate(
      { code: promoCode },
      {
        status: "used",
        assignedToUser: userId,
        assignedOn: new Date(),
      }
    );

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      {},
      "Promo code assigned and saved successfully"
    );
    return res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Error saving user promo code:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
  }
};