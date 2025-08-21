import Category from "../../models/Category.js";
import Organisation from "../../models/Organisation.js";
import ResponseService from "../../helper/responseObject.js";
import constants from "../../utils/constants.js";
import messages from "../../utils/messages.js";
import _ from "lodash";

// Create a new Category
export const createCategory = async (req, res) => {
  const { categoryName, imageUrl, isGeneric } = req.body;

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
      isGeneric: isGeneric,
      isActive: true,
    });

    await newCat.save();

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
    const org = await Organisation.find({ categories: id });
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
    const searchKeyword = req.query.searchTerm || "";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const searchCondition = searchKeyword
      ? { categoryName: { $regex: searchKeyword, $options: "i" } }
      : {};

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
// export const getCategoriesByUserId = async (req, res) => {
//   const { id } = req.params;

//   try {
//     const org = await Organisation.findById(id);

//     const categories = await Category.find({
//       _id: { $in: org.categories },
//       isActive: true,
//     });

//     if (!categories) {
//       ResponseService.status = constants.CODE.BAD_REQUEST;
//       const response = ResponseService.responseService(
//         constants.STATUS.ERROR,
//         [],
//         messages.CATEGORY_NOT_FOUND
//       );
//       return res.status(ResponseService.status).json(response);
//     }

//     ResponseService.status = constants.CODE.OK;
//     const response = ResponseService.responseService(
//       constants.STATUS.SUCCESS,
//       categories,
//       messages.SUCCESS
//     );
//     res.status(ResponseService.status).json(response);
//   } catch (err) {
//     console.error("Get Category by ID error:", err);
//     ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
//     const errorResponse = ResponseService.responseService(
//       constants.STATUS.EXCEPTION,
//       [],
//       messages.INTERNAL_SERVER_ERROR
//     );
//     res.status(ResponseService.status).json(errorResponse);
//   }
// };

export const getCategoriesByUserId = async (req, res) => {
  const { id } = req.params;

  try {
    // 🔒 Safety: Validate ID format before passing to Mongoose
    if (!id || id === "null" || id === "undefined" || typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing organisation ID",
      });
    }

    // 🔢 Check if it's a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (!isValidObjectId) {
      return res.status(400).json({
        success: false,
        message: "Invalid organisation ID format",
      });
    }

    // ✅ Now safe to use
    const org = await Organisation.findById(id);

    if (!org) {
      ResponseService.status = constants.CODE.NOT_FOUND;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        "Organisation not found"
      );
      return res.status(ResponseService.status).json(response);
    }

    const categories = await Category.find({
      _id: { $in: org.categories },
      isActive: true,
    });

    // 🔁 You had !categories — but find() returns [] not null
    if (categories.length === 0) {
      ResponseService.status = constants.CODE.OK;
      const response = ResponseService.responseService(
        constants.STATUS.SUCCESS,
        [],
        "No active categories found"
      );
      return res.status(ResponseService.status).json(response);
    }

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      categories,
      "Categories fetched successfully"
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get Category by ID error:", err);

    // ✅ Handle CastError gracefully
    if (err.name === "CastError") {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        "Invalid ID format provided"
      );
      return res.status(ResponseService.status).json(response);
    }

    // 🔥 All other errors
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};