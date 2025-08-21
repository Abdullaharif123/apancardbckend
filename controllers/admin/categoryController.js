import Category from "../../models/Category.js";
import User from "../../models/User.js";
import Organisation from "../../models/Organisation.js";
import ResponseService from "../../helper/responseObject.js";
import constants from "../../utils/constants.js";
import messages from "../../utils/messages.js";
import { getUserIdFromToken } from "../../services/tokenService.js";
import _ from "lodash";

// Create a new Category
export const createCategory = async (req, res) => {
  const { categoryName, imageUrl } = req.body;

  try {
    const existingCat = await Category.findOne({
      $expr: {
        $eq: [{ $toLower: "$categoryName" }, categoryName.toLowerCase()],
      },
    });
    if (existingCat) {
      ResponseService.status = constants.CODE.ACCEPTED;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.CATEGORY_ALREADY_EXISTS
      );
      return res.status(ResponseService.status).json(response);
    }

    // Create new Category
    const newCat = new Category({
      categoryName,
      imageUrl,
      isActive: true,
    });

    await newCat.save();

    var loggedInUserId = getUserIdFromToken(req);
    const loggedInUser = await User.findById(loggedInUserId);

    const updatedOrganisation = await Organisation.findByIdAndUpdate(
      loggedInUser.organization._id,
      { $addToSet: { categories: newCat._id } }, // $addToSet ensures no duplicates
      { new: true } // Returns the updated document
    );

    if (!updatedOrganisation) {
      throw new Error("Organization not found or update failed");
    }

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { categoryName: newCat.categoryName },
      messages.CATEGORY_CREATED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.DUPLICATE_CAT_INFO
      );
      return res.status(ResponseService.status).json(response);
    }

    console.error("Create Category error:", error);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
  }
};

// Get Category by ID
export const getCategoryById = async (req, res) => {
  const { id } = req.params;

  try {
    const cat = await Category.findById(id);

    if (!cat) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.CATEGORY_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      cat,
      messages.SUCCESS
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get Category by ID error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Update Category
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body; // Dynamically get all the fields to update

  try {
    const cat = await Category.findById(id);

    if (!cat) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.CATEGORY_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }
    // Dynamically update fields based on what's in the request body
    Object.keys(updateFields).forEach((key) => {
      if (key in cat) {
        cat[key] = updateFields[key];
      }
    });

    await cat.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      cat,
      messages.CATEGORY_UPDATED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Update Category error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Delete Category
export const deleteCategory = async (req, res) => {
  const { id } = req.params;

  try {
    var loggedInUserId = getUserIdFromToken(req);
    const loggedInUser = await User.findById(loggedInUserId);

    const updatedOrganisation = await Organisation.findOneAndUpdate(
      { _id: loggedInUser.organization._id, categories: id }, // Match both organization and category
      { $pull: { categories: id } }, // Remove the category from the array
      { new: true } // Return the updated document
    );

    if (!updatedOrganisation) {
      throw new Error("Organization or category not found");
    }

    const cat = await Category.findById(id);

    if (!cat) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.CATEGORY_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    // Remove the Category
    await Category.deleteOne({ _id: id });

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      {},
      messages.CATEGORY_DELETED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Delete Category error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Get all Categories
export const getAllCategories = async (req, res) => {
  try {
    var loggedInUserId = getUserIdFromToken(req);
    const loggedInUser = await User.findById(loggedInUserId);

    const organisation = await Organisation.findById(
      loggedInUser.organization._id
    );

    const searchKeyword = req.query.searchTerm || "";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const categoryIds = organisation.categories.map((id) => id.toString());

    const searchCondition = searchKeyword
      ? {
          categoryName: { $regex: searchKeyword, $options: "i" },
          _id: { $in: categoryIds }, // Ensures only categories from the organization are included
        }
      : { _id: { $in: categoryIds } }; // Defaults to filtering by organization categories only

    // Calculate the number of records to skip based on the current page
    const skip = (page - 1) * limit;

    // Get the total count of organisations that match the search condition
    const totalCategories = await Category.countDocuments(searchCondition);

    // Fetch the organisations with pagination
    const categories = await Category.find(searchCondition)
      .sort({ categoryName: 1 })
      .skip(skip)
      .limit(limit);

    // Create a pagination object
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalCategories / limit),
      totalRecords: totalCategories,
      limit,
    };

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { categories, pagination },
      messages.CATEGORY_FOUND
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get Categories error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Get all Categories
export const getActiveCategories = async (req, res) => {
  try {
    const Categories = await Category.find({ isActive: true });

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      Categories,
      messages.CATEGORY_FOUND
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get Categories error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Get Category by ID
export const getCategoriesByUserId = async (req, res) => {
  const { id } = req.params;

  try {
    const org = await Organisation.findById(id);

    const categories = await Category.find({
      _id: { $in: org.categories },
      isActive: true,
    });

    if (!categories) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.CATEGORY_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      categories,
      messages.SUCCESS
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get Category by ID error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};
