import User from "../../models/User.js";
import ResponseService from "../../helper/responseObject.js";
import constants from "../../utils/constants.js";
import messages from "../../utils/messages.js";
import _ from "lodash";
import bcrypt from "bcryptjs";
import { defaultPassword, roles } from "../../helper/enum.js";
import { generateRandomPassword } from "../../utils/passwordGenerator.js";
import {
  sendActivationEmail,
  sendResetPasswordEmail,
} from "../../services/sendGridService.js";
import Organisation from "../../models/Organisation.js";
import { assignCategoriesToUser } from "../../services/userServices.js";

// Create a new SuperAdmin user
export const createSuperAdmin = async (req, res) => {
  const { firstName, lastName, email, cnic, mobileNo, password, dob, gender } =
    req.body;

  try {
    const existingUser = await User.findOne({
      $expr: { $eq: [{ $toLower: "$email" }, email.toLowerCase()] },
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

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new SuperAdmin user
    const newUser = new User({
      firstName,
      lastName,
      email,
      cnic,
      mobileNo,
      password: hashedPassword,
      dob,
      gender,
      role: "SuperAdmin", // Set role to SuperAdmin
    });

    await newUser.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { email: newUser.email },
      messages.USER_CREATED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.DUPLICATE_USER_INFO
      );
      return res.status(ResponseService.status).json(response);
    }

    console.error("Create SuperAdmin error:", error);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
  }
};

// Get all SuperAdmin users
export const getSuperAdmins = async (req, res) => {
  try {
    const superAdmins = await User.find({ role: "SuperAdmin" });

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      superAdmins.map((user) => _.omit(user.toObject(), ["password"])),
      messages.RECORD_FOUND
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get SuperAdmins error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Get SuperAdmin by ID
export const getSuperAdminById = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user || user.role !== roles.superAdmin) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.USER_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      _.omit(user.toObject(), ["password"]),
      messages.SUCCESS
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get SuperAdmin by ID error:", err);
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
export const updateSuperAdmin = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body; // Dynamically get all the fields to update

  try {
    const user = await User.findById(id);

    if (!user || user.role !== roles.superAdmin) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.USER_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }
    // Dynamically update fields based on what's in the request body
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
    console.error("Update SuperAdmin error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Delete a SuperAdmin user
export const deleteSuperAdmin = async (req, res) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user || user.role !== roles.superAdmin) {
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
    console.error("Delete SuperAdmin error:", err);
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
    organizationId,
    role,
  } = req.body;

  try {
    const organisation = await Organisation.findById(organizationId);

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
      mobileNo,
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

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      cnic,
      mobileNo,
      password: hashedPassword,
      organization: { _id: organisation?._id },
      organisationName: organisation?.organisationName,
      dob,
      gender,
      ...(role === roles.admin && { cardNumber }), // Add cardNumber only if role is admin
      isActive: true,
      role,
    });

    await newUser.save();

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

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const searchKeyword = req.query.searchTerm || "";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const searchCondition = searchKeyword
      ? {
          $and: [
            {
              $or: [{ role: roles.user }, { role: roles.admin }],
            },
            {
              $or: [
                { firstName: { $regex: searchKeyword, $options: "i" } },
                { lastName: { $regex: searchKeyword, $options: "i" } },
                {
                  $expr: {
                    $regexMatch: {
                      input: { $concat: ["$firstName", " ", "$lastName"] },
                      regex: searchKeyword,
                      options: "i",
                    },
                  },
                },
              ],
            },
          ],
        }
      : {
          $or: [{ role: roles.user }, { role: roles.admin }],
        };

    const skip = (page - 1) * limit;

    const totalUsers = await User.countDocuments(searchCondition);

    const users = await User.find(searchCondition)
      .sort({ firstName: 1 })
      .skip(skip)
      .limit(limit);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalUsers / limit),
      totalRecords: totalUsers,
      limit,
    };

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      {
        users: users.map((user) => _.omit(user.toObject(), ["password"])),
        pagination,
      },
      messages.USER_FOUND
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get users error:", err);
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
    // Dynamically update fields based on what's in the request body
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

export const resetPassword = async (req, res) => {
  const { userId } = req.params;

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

    const newPassword = defaultPassword.defaultUserPassword;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    await sendResetPasswordEmail(user?.email, user?.firstName, newPassword);

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

export const getAllAdmins = async (req, res) => {
  try {
    const searchKeyword = req.query.searchTerm || "";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const searchCondition = searchKeyword
      ? {
          $and: [
            { role: roles.admin },
            {
              $or: [
                { firstName: { $regex: searchKeyword, $options: "i" } },
                { lastName: { $regex: searchKeyword, $options: "i" } },
                {
                  $expr: {
                    $regexMatch: {
                      input: { $concat: ["$firstName", " ", "$lastName"] },
                      regex: searchKeyword,
                      options: "i",
                    },
                  },
                },
              ],
            },
          ],
        }
      : { role: roles.admin };

    const skip = (page - 1) * limit;

    const totalAdmins = await User.countDocuments(searchCondition);

    const admins = await User.find(searchCondition)
      .sort({ firstName: 1 })
      .skip(skip)
      .limit(limit);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalAdmins / limit),
      totalRecords: totalAdmins,
      limit,
    };

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      {
        admins: admins.map((user) => _.omit(user.toObject(), ["password"])),
        pagination,
      },
      messages.USER_FOUND
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get admins error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};
