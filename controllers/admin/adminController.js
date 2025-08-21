import User from "../../models/User.js";
import Organisation from "../../models/Organisation.js";
import ResponseService from "../../helper/responseObject.js";
import constants from "../../utils/constants.js";
import messages from "../../utils/messages.js";
import { getUserIdFromToken } from "../../services/tokenService.js";
import { assignCategoriesToUser } from "../../services/userServices.js";
import { cardTypes, roles } from "../../helper/enum.js";
import bcrypt from "bcryptjs";
import _ from "lodash";
import { sendActivationEmail } from "../../services/sendGridService.js";
import { createFamilyMembersForUser } from "../../services/adminServices.js";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const loggedInUserId = getUserIdFromToken(req);
    const loggedInUser = await User.findById(loggedInUserId);
    if (!loggedInUser) throw new Error("Logged-in user not found.");

    const searchKeyword = req.query.searchTerm || "";
    const page = Math.max(parseInt(req.query.page, 10), 1) || 1;
    const limit = Math.max(parseInt(req.query.limit, 10), 1) || 10;
    const skip = (page - 1) * limit;

    const searchCondition = constructSearchCondition(
      searchKeyword,
      loggedInUser
    );

    const [totalUsers, users] = await Promise.all([
      User.countDocuments(searchCondition),
      User.find(searchCondition)
        .sort({ firstName: 1 })
        .skip(skip)
        .limit(limit)
        .populate("familyMembers"), // Populate only required fields
    ]);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalRecords: totalUsers,
      limit,
    };

    const userResponses = users.map((user) =>
      _.omit(user.toObject(), ["password"])
    );
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { users: userResponses, pagination },
      messages.USER_FOUND
    );

    res.status(constants.CODE.OK).json(response);
  } catch (err) {
    console.error("Error fetching users:", err.message);
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(constants.CODE.INTERNAL_SERVER_ERROR).json(errorResponse);
  }
};

// Helper to construct search condition
const constructSearchCondition = (searchKeyword, loggedInUser) => {
  const baseCondition = [
    { role: roles.user },
    { organisationName: loggedInUser.organisationName },
  ];

  if (!searchKeyword) return { $and: baseCondition };

  const searchRegex = { $regex: searchKeyword, $options: "i" };
  const fullNameExpression = {
    $expr: {
      $regexMatch: {
        input: { $concat: ["$firstName", " ", "$lastName"] },
        regex: searchKeyword,
        options: "i",
      },
    },
  };

  return {
    $and: [
      ...baseCondition,
      {
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          fullNameExpression,
        ],
      },
    ],
  };
};

// Delete a user
export const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user || user.role !== roles.user) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.USER_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    // Remove the user
    await User.deleteOne({ _id: id });

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      {},
      messages.USER_DELETED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Delete user error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Update SuperAdmin user details
// export const updateUserDetails = async (req, res) => {
//   const { id } = req.params;
//   const updateFields = req.body; // Dynamically get all the fields to update

//   try {
//     const user = await User.findById(id);

//     if (!user || user.role === roles.superAdmin) {
//       ResponseService.status = constants.CODE.BAD_REQUEST;
//       const response = ResponseService.responseService(
//         constants.STATUS.ERROR,
//         [],
//         messages.USER_NOT_FOUND
//       );
//       return res.status(ResponseService.status).json(response);
//     }

//     if ("familyMembers" in updateFields) {
//       const newFamilyMemberIds = await createFamilyMembers(
//         updateFields.familyMembers
//       );
//       user.familyMembers = newFamilyMemberIds;
//       delete updateFields.familyMembers; // prevent overwriting with raw objects
//     }

//     // Dynamically update fields based on what's in the request body
//     Object.keys(updateFields).forEach((key) => {
//       if (key in user) {
//         user[key] = updateFields[key];
//       }
//     });

//     await user.save();

//     ResponseService.status = constants.CODE.OK;
//     const response = ResponseService.responseService(
//       constants.STATUS.SUCCESS,
//       { user: _.omit(user.toObject(), ["password"]) },
//       messages.USER_UPDATED_SUCCESSFULLY
//     );
//     res.status(ResponseService.status).json(response);
//   } catch (err) {
//     console.error("Update User error:", err);
//     ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
//     const errorResponse = ResponseService.responseService(
//       constants.STATUS.EXCEPTION,
//       [],
//       messages.INTERNAL_SERVER_ERROR
//     );
//     res.status(ResponseService.status).json(errorResponse);
//   }
// };

export const updateUserDetails = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body; // Dynamically get all the fields to update

  try {
    const user = await User.findById(id);

    if (!user || user.role === roles.superAdmin) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.USER_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    // Handle familyMembers if cardType is familyCard and familyMembers is passed
    if (
      updateFields.cardType === cardTypes.familyCard &&
      Array.isArray(updateFields.familyMembers)
    ) {
      const familyMemberIds = await createFamilyMembersForUser(
        updateFields.familyMembers,
        user._id
      );
      user.familyMembers = familyMemberIds;

      delete updateFields.familyMembers; // Prevent direct overwrite with raw objects
    }

    // Dynamically update remaining fields
    Object.keys(updateFields).forEach((key) => {
      if (key in user) {
        user[key] = updateFields[key];
      }
    });

    await user.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { user: _.omit(user.toObject(), ["password"]) },
      messages.USER_UPDATED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Update User error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

//Create a new user
export const createUser = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    cnic,
    mobileNo,
    dob,
    gender,
    cardNumber,
    cardType,
    familyMembers,
  } = req.body;

  try {
    // Validation: If cardType is "singleCard", familyMembers should not be present
    if (cardType === cardTypes.singleCard && familyMembers.length > 0) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.SINGLE_CARD_FAMILY_MEMBERS_NOT_ALLOWED
      );
      return res.status(ResponseService.status).json(response);
    }

    // Validation: "Family Card" must have family members
    if (
      cardType === cardTypes.familyCard &&
      (!Array.isArray(familyMembers) || familyMembers.length === 0)
    ) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.FAMILY_MEMBERS_MUST_PROVIDED
      );
      return res.status(ResponseService.status).json(response);
    }

    const loggedInUserId = getUserIdFromToken(req);
    const loggedInUser = await User.findById(loggedInUserId);
    console.log("loggedInUser: ", loggedInUser);

    // Fetch the organisation
    const organisation = await Organisation.findById(loggedInUser.organization);
    if (!organisation) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.ORGANISATION_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    const existingUser = await User.findOne({
      email,
    });

    if (existingUser) {
      ResponseService.status = constants.CODE.ACCEPTED;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.USER_ALREADY_EXISTS
      );
      return res.status(ResponseService.status).json(response);
    }

    // Generate a default password
    const defaultPassword = mobileNo; //await generateRandomPassword();

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    // Create the primary user
    const newUser = await User.create({
      firstName,
      lastName,
      email,
      cnic,
      mobileNo,
      password: hashedPassword,
      organization: organisation._id,
      organisationName: organisation.organisationName,
      dob,
      gender,
      cardNumber,
      cardType,
      isActive: false,
      role: roles.user,
      familyMembers: [], // Family members will be added later
    });

    let familyMemberIds = [];

    // If it's a "Family Card", create family member users
    if (cardType === cardTypes.familyCard && Array.isArray(familyMembers)) {
      const currentYear = new Date().getFullYear(); // Get current year

      for (const member of familyMembers) {
        const { name, age, relation, gender } = member;

        const dobFromAge = new Date(currentYear - age, 0, 1); // Approximate DOB

        const familyMember = await User.create({
          firstName: name.split(" ")[0],
          lastName: name.split(" ").slice(1).join(" ") || "",
          gender,
          dob: dobFromAge,
          relation: relation, // If no DOB, set a placeholder
          parentUserId: newUser._id, // Linking to primary user
          cardType: cardTypes.familyCard, // Ensuring consistency
          role: roles.user, // Assign the same role as the primary user
          isActive: false, // Set inactive until activated
        });

        familyMemberIds.push(familyMember._id);
      }

      // Update the primary user with family member references
      newUser.familyMembers = familyMemberIds;
      await newUser.save();
    }

    await assignCategoriesToUser(newUser?._id, organisation?._id);
    // Send activation email with the default password
    await sendActivationEmail(
      newUser?.email, // Use the user's email
      newUser?.firstName, // Use the user's first name
      defaultPassword // Send the generated default password
    );

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { email: newUser.email },
      messages.USER_CREATED_SUCCESSFULLY
    );
    return res.status(ResponseService.status).json(response);
  } catch (error) {
    console.error("Create User error:", error);

    if (error.code === 11000) {
      // Handle duplicate key error
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.DUPLICATE_USER_INFO
      );
      return res.status(ResponseService.status).json(response);
    }

    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
  }
};

export const getOrganisationName = async (req, res) => {
  try {
    var loggedInUserId = getUserIdFromToken(req);
    const loggedInUser = await User.findById(loggedInUserId);

    // Fetch the organisation
    const organisation = await Organisation.findById(
      loggedInUser.organization._id
    );

    ResponseService.status = constants.CODE.OK;

    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      organisation,
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

// Get user by Id
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);

    if (!user) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        null,
        messages.USER_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      _.omit(user.toObject(), ["password"]),
      messages.USER_FOUND
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get user by ID error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      null,
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

export const changePassword = async (req, res) => {
  const { userId } = req.params;
  const { password, updatedOn } = req.body;

  try {
    const user = await User.findById(userId);

    if (!user) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.USER_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.updatedOn = updatedOn;
    await user.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      user.email,
      messages.PASSWORD_RESET_SUCCESS
    );
    res.status(ResponseService.status).json(response);
  } catch (error) {
    console.error("Reset Password error:", error);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

export const updateOrganizationInvoiceTemplate = async (req, res) => {
  try {
    const loggedInUserId = getUserIdFromToken(req);
    const loggedInUser = await User.findById(loggedInUserId);

    if (!loggedInUser || !loggedInUser.organization) {
      ResponseService.status = constants.CODE.UNAUTHORIZED;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.NOT_AUTHORIZED
      );
      return res.status(ResponseService.status).json(response);
    }

    const { organizationName, address, phoneNumber } = req.body;

    // Ensure at least one field is provided
    if (!organizationName || !address || !phoneNumber) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.INVALID_INVOICE_TEMPLATE_FIELDS
      );
      return res.status(ResponseService.status).json(response);
    }

    // Find and update the invoiceTemplate
    const updatedOrg = await Organisation.findByIdAndUpdate(
      loggedInUser.organization._id,
      {
        $set: {
          "invoiceTemplate.organizationName": organizationName,
          "invoiceTemplate.address": address,
          "invoiceTemplate.phoneNumber": phoneNumber,
          updatedOn: Date.now(),
        },
      },
      { new: true, runValidators: true }
    );

    if (!updatedOrg) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.ORGANISATION_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      updatedOrg,
      messages.INVOICE_TEMPLATE_UPDATED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (error) {
    console.error("Update Invoice Template error:", error);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

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
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      org,
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
