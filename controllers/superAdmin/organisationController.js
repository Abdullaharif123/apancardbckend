import Organisation from "../../models/Organisation.js";
import User from "../../models/User.js";
import ResponseService from "../../helper/responseObject.js";
import constants from "../../utils/constants.js";
import messages from "../../utils/messages.js";
import _ from "lodash";
import mongoose from "mongoose";
export const createOrganisation = async (req, res) => {
  const { organisationName } = req.body;

  try {
    // Check if the organization already exists
    const existingOrg = await Organisation.findOne({
      $expr: {
        $eq: [
          { $toLower: "$organisationName" },
          organisationName.toLowerCase(),
        ],
      },
    });

    if (existingOrg) {
      ResponseService.status = constants.CODE.ACCEPTED;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.ORGANISATION_ALREADY_EXISTS
      );
      return res.status(ResponseService.status).json(response);
    }

    const newOrg = new Organisation({
      organisationName,
      isActive: true,
    });

    await newOrg.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      {
        organisationName: newOrg.organisationName,
        // cardNumbers: newOrg.cardNumbers,
      },
      messages.ORGANISATION_CREATED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.DUPLICATE_ORG_INFO
      );
      return res.status(ResponseService.status).json(response);
    }

    console.error("Create Organisation error:", error);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
  }
};

// Get Organisation by ID
export const getOrganisationById = async (req, res) => {
  const { id } = req.params;

  try {
    const org = await Organisation.findById(id);

    if (!org) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.ORGANISATION_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    ResponseService.status = constants.CODE.OK;

    const orgObject = org.toObject();

    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      orgObject,
      messages.SUCCESS
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get Organisation by ID error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Update Organisation
export const updateOrganisation = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body; // Dynamically get all the fields to update

  try {
    const org = await Organisation.findById(id);

    if (!org) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.ORGANISATION_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    // Dynamically update fields based on what's in the request body
    Object.keys(updateFields).forEach((key) => {
      if (key in org) {
        org[key] = updateFields[key];
      }
    });

    org.updatedOn = Date.now();

    await org.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      org,
      messages.ORGANISATION_UPDATED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Update Organisation error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Update Organisation
export const updateOrganisationCards = async (req, res) => {
  const { id } = req.params;
  const { cardRange } = req.body; // Get the card range from request body

  try {
    const org = await Organisation.findById(id);
    if (!org) {
      ResponseService.status = constants.CODE.NOT_FOUND;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.ORGANISATION_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    let newCardNumbers = [];

    // Determine if input is a single card or a range
    if (cardRange && typeof cardRange === "string" && cardRange.includes("-")) {
      const [start, end] = cardRange.split("-").map(Number);
      if (isNaN(start) || isNaN(end) || start > end) {
        ResponseService.status = constants.CODE.BAD_REQUEST;
        const response = ResponseService.responseService(
          constants.STATUS.ERROR,
          [],
          messages.CARD_RANGE_INVALID
        );
        return res.status(ResponseService.status).json(response);
      }
      newCardNumbers = Array.from(
        { length: end - start + 1 },
        (_, i) => start + i
      );
    } else {
      const singleCard = parseInt(cardRange, 10);
      if (isNaN(singleCard)) {
        ResponseService.status = constants.CODE.BAD_REQUEST;
        const response = ResponseService.responseService(
          constants.STATUS.ERROR,
          [],
          messages.CARD_RANGE_INVALID
        );
        return res.status(ResponseService.status).json(response);
      }
      newCardNumbers = [singleCard];
    }

    // Combine existing card numbers with new card numbers, ensuring no duplicates
    const existingCardNumbers = org.cardNumbers || [];
    const updatedCardNumbers = Array.from(
      new Set([...existingCardNumbers, ...newCardNumbers])
    );

    // Check for overlapping card numbers in other organizations
    const overlappingCards = await Organisation.findOne({
      _id: { $ne: id }, // Exclude the current organization
      cardNumbers: { $in: newCardNumbers },
    });

    if (overlappingCards) {
      ResponseService.status = constants.CODE.CONFLICT;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.CARD_NUMBERS_OVERLAP
      );
      return res.status(ResponseService.status).json(response);
    }

    // Update organization with the combined card numbers
    org.cardNumbers = updatedCardNumbers; // Save the updated list
    org.updatedOn = Date.now();
    await org.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      org,
      messages.ORGANISATION_UPDATED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Update Organisation error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};
export const updateOrganisationCategories = async (req, res) => {
  const { id } = req.params;
  const { categoryId, isEnabled } = req.body; // Expecting categoryId and isEnabled flag
  try {
    const org = await Organisation.findById(id);

    if (!org) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.ORGANISATION_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    // Check if the category should be added or removed
    if (isEnabled) {
      // Add the category if it doesn't already exist
      if (!org.categories.includes(categoryId)) {
        org.categories.push(categoryId);
      }
    } else {
      // Remove the category if it exists
      org.categories = org.categories.filter(
        (existingCategoryId) => existingCategoryId.toString() !== categoryId
      );
    }

    org.updatedOn = Date.now();

    await org.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      org,
      messages.ORGANISATION_UPDATED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Update Organisation error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Delete Organisation
export const deleteOrganisation = async (req, res) => {
  const { id } = req.params;

  try {
    const org = await Organisation.findById(id);

    if (!org) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.ORGANISATION_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    // Remove the Organisation
    await Organisation.deleteOne({ _id: id });

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      {},
      messages.ORGANISATION_DELETED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Delete Organisation error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Get all Organisations with Pagination
export const getOrganisations = async (req, res) => {
  try {
    const searchKeyword = req.query.searchTerm || "";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const searchCondition = searchKeyword
      ? { organisationName: { $regex: searchKeyword, $options: "i" } }
      : {};

    // Calculate the number of records to skip based on the current page
    const skip = (page - 1) * limit;

    // Get the total count of organisations that match the search condition
    const totalOrganisations = await Organisation.countDocuments(
      searchCondition
    );

    // Fetch the organisations with pagination
    const organisations = await Organisation.find(searchCondition)
      .sort({ organisationName: 1 })
      .skip(skip)
      .limit(limit);

    // Create a pagination object
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalOrganisations / limit),
      totalRecords: totalOrganisations,
      limit,
    };

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { organisations, pagination }, // Include the organisations and pagination data in the response
      messages.ORGANISATION_FOUND
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get organisations error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Get all Organisations with Pagination
export const getOrganisationNames = async (req, res) => {
  try {
    // Fetch the organisations with pagination
    const organisations = await Organisation.find({
      isActive: true,
    });

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      organisations, // Include the organisations and pagination data in the response
      messages.ORGANISATION_FOUND
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get organisations error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Get all Organisations with card details
export const getOrganisationsWithDetails = async (req, res) => {
  try {
    const organisations = await Organisation.find();

    const organisationsWithCards = await Promise.all(
      organisations.map(async (org) => {
        const users = await User.find({ organization: org.organisationName });
        const cardNumbers = users.map((user) => user.cardNumber);

        return {
          ...org._doc,
          cardCount: cardNumbers.length,
          cardNumbers,
        };
      })
    );

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      organisationsWithCards,
      messages.ORGANISATION_FOUND
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get organisations error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

export const getUsersByOrganization = async (req, res) => {
  const { organizationId } = req.params; // Get the organizationId from request params

  try {
    // Fetch users belonging to the specified organization
    const users = await User.find({
      organization: organizationId,
      isActive: true,
    });

    if (!users || users.length === 0) {
      ResponseService.status = constants.CODE.OK;
      const response = ResponseService.responseService(
        constants.STATUS.SUCCESS,
        [],
        messages.NO_USERS_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    // Use Lodash to omit the password field from each user object
    let usersWithoutSenstiveInfo = users.map((user) =>
      _.omit(user.toObject(), "password")
    );

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      usersWithoutSenstiveInfo,
      messages.USERS_FETCHED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (error) {
    console.error("Get Users by Organization error:", error);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};
export const getOrganisationCategories = async (req, res) => {
  try {
    const { organisationId } = req.params;
    // console.log("Organisation ID received:", organisationId);

    if (!mongoose.Types.ObjectId.isValid(organisationId)) {
      return res.status(400).json({ message: "Invalid organisation ID" });
    }

    // Fetch only the assigned categories and include their names
    const organisation = await Organisation.findById(organisationId)
      .select("categories")
      .populate({
        path: "categories",
        // ✅ include the name so the dialog can display it
        select: "categoryName _id isActive imageUrl",
        model: "Category",
      })
      .lean();

    // console.log("Organisation found:", organisation);

    if (!organisation) {
      return res.status(404).json({ message: "Organisation not found" });
    }

    // Return exactly the assigned categories with names
    return res.status(200).json({
      categories: organisation.categories || [],
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return res.status(500).json({
      message: "Server error",
      details: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
};