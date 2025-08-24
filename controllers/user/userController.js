import bcrypt from "bcryptjs";
import User from "../../models/User.js";
import ResponseService from "../../helper/responseObject.js";
import constants from "../../utils/constants.js";
import messages from "../../utils/messages.js";
import { generateToken } from "../../services/tokenService.js";
import {
  sendActivationEmail,
  sendForgotPasswordEmail,
} from "../../services/sendGridService.js";
import { generateRandomPassword } from "../../utils/passwordGenerator.js";
import _ from "lodash";
import Organisation from "../../models/Organisation.js";
import { getSignedS3UrlUtil } from "../../utils/s3Utils.js";
import PromoCode from "../../models/promocode.js";
import UserPromoCode from '../../models/userpromocode.js';


// Signup User
export const signupUser = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    cnic,
    mobileNo,
    password,
    confirmPassword,
    organization,
    dob,
    gender,
    cardNumber,
  } = req.body;

  try {
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

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

    // Debugging: Print the hashed password
    console.log("Hashed Password (signup):", hashedPassword);

    // Create new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      cnic,
      mobileNo,
      password: hashedPassword,
      organization,
      dob,
      gender,
      cardNumber,
      isActive: false,
    });

    await newUser.save();

    // Send activation email
    await sendActivationEmail(newUser?.email, newUser?.firstName);

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

export const signUpScanCard = async (req, res) => {
  const {
    firstName,
    lastName,
    email,
    cnic,
    mobileNo,
    password,
    confirmPassword,
    dob,
    gender,
    cardNumber,
  } = req.body;

  try {
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const existingUser = await User.findOne({ cardNumber });
    if (!existingUser) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.USER_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // If the user exists, update their information
    existingUser.firstName = firstName;
    existingUser.lastName = lastName;
    existingUser.email = email;
    existingUser.cnic = cnic;
    existingUser.mobileNo = mobileNo;
    existingUser.dob = dob;
    existingUser.gender = gender;
    existingUser.password = hashedPassword;
    existingUser.updatedOn = Date.now();

    await existingUser.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { cardNumber: cardNumber },
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

// Login User
export const loginUser = async (req, res) => {
  const { identifier, password } = req.body;

  try {
    const user = await User.findOne({
      $or: [
        { $expr: { $eq: [{ $toLower: "$email" }, identifier.toLowerCase()] } },
        { cnic: identifier },
        { mobileNo: identifier },
      ],
    });

    if (!user) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.USER_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.INVALID_CREDENTIALS
      );
      return res.status(ResponseService.status).json(response);
    }

    if (!user?.isActive) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.USER_STATUS_FAIL
      );
      return res.status(ResponseService.status).json(response);
    }

    // Generate JWT token
    const token = generateToken(user._id, user.role);

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      {
        accessToken: token,
        expiresIn: "1d",
        cardNumber: user?.cardNumber,
        orgId: user?.organization,
        userId: user?._id,
        email: user?.email,
        firstName: user?.firstName,  // ✅ ADD THIS
        lastName: user?.lastName,
      },
      messages.LOGIN_SUCCESSFUL
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Login error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Forgot Password
export const forgotPassword = async (req, res) => {
  const { cnic, mobileNo } = req.body;

  try {
    // Check if the user exists with provided CNIC and mobile number
    const user = await User.findOne({ cnic, mobileNo });

    if (!user) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.USER_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    // Generate a new system password
    const newPassword = await generateRandomPassword();

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the user's password in the database
    user.password = hashedPassword;
    await user.save();

    // Send the new password via email or SMS
    await sendForgotPasswordEmail(user?.email, user?.firstName, newPassword);
    // You could also send via SMS if you have an SMS service integrated.

    // Success response
    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      user?.email,
      messages.PASSWORD_RESET_SUCCESS
    );
    res.status(ResponseService.status).json(response);
  } catch (error) {
    console.error("Forgot Password error:", error);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Update Password
export const updatePassword = async (req, res) => {
  const { email, oldPassword, newPassword, confirmNewPassword } = req.body;

  if (newPassword !== confirmNewPassword) {
    ResponseService.status = constants.CODE.BAD_REQUEST;
    const response = ResponseService.responseService(
      constants.STATUS.ERROR,
      [],
      "New passwords do not match"
    );
    return res.status(ResponseService.status).json(response);
  }

  try {
    // Find the user by email
    const user = await User.findOne({
      $expr: { $eq: [{ $toLower: "$email" }, email.toLowerCase()] },
    });
    if (!user) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.USER_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    // Check if the old password matches
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      ResponseService.status = constants.CODE.UNAUTHORIZED;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.OLD_PASSWORD_NOT_MATCH
      );
      return res.status(ResponseService.status).json(response);
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password
    user.password = hashedPassword;
    await user.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { email: user.email },
      messages.PASSWORD_UPDATE_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (error) {
    console.error("Password update error:", error);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

export const updateUserDetails = async (req, res) => {
  const { userId } = req.params; // Assuming userId is passed in the route parameter
  const updateFields = req.body; // Dynamically get all the fields to update

  try {
    // Find the user by userId
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

    // Filter out the isActive field if present
    if (updateFields.hasOwnProperty("isActive")) {
      delete updateFields.isActive;
    }

    // Check if prescriptions are present in the request body
    if (
      updateFields.prescriptions &&
      Array.isArray(updateFields.prescriptions)
    ) {
      user.prescriptions = [
        ...user.prescriptions,
        ...updateFields.prescriptions,
      ];
      delete updateFields.prescriptions; // Remove it from updateFields
    }

    // Check if labReports are present in the request body
    if (updateFields.labReports && Array.isArray(updateFields.labReports)) {
      user.labReports = [...user.labReports, ...updateFields.labReports];
      delete updateFields.labReports; // Remove it from updateFields
    }

    // Dynamically update fields based on what's in the request body
    Object.keys(updateFields).forEach((key) => {
      if (key in user) {
        user[key] = updateFields[key];
      }
    });

    if (updateFields.mobileNo) {
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(updateFields.mobileNo, salt);
      user.password = hashedPassword;
    }

    user.updatedOn = Date.now();

    // Save the updated user details
    await user.save();

    // Send success response
    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      {
        user: _.omit(user.toObject(), [
          "password",
          "organization",
          "cnic",
          "isActive",
        ]),
      },
      messages.USER_UPDATED_SUCCESSFULLY
    );
    return res.status(ResponseService.status).json(response);
  } catch (error) {
    console.error("Update User Details error:", error);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
  }
};

//Get User By Card Number or Creating if it doesn't exist
export const getUserByCardNumber = async (req, res) => {
  const { cardNumber } = req.params;

  try {
    // Check if a user with the same cardNumber already exists
    const existingUser = await User.findOne({ cardNumber }).populate(
      "familyMembers"
    );

    if (existingUser) {
      ResponseService.status = constants.CODE.OK;
      const response = ResponseService.responseService(
        constants.STATUS.SUCCESS,
        // existingUser,
        {
          existingUser: _.omit(existingUser.toObject(), [
            "password",
            "isActive",
          ]),
        },
        messages.USER_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    // Step 2: Check if card exists in Organization's cardNumbers
    const organisation = await Organisation.findOne({
      cardNumbers: cardNumber,
    }).populate("categories");

    if (organisation) {
      // Step 3: Create a new user with the scanned card and organization details
      const newUser = new User({
        firstName: "",
        lastName: "",
        organization: organisation._id,
        organisationName: organisation.organisationName,
        cardNumber,
        isActive: true,
      });

      // Step 4: Create dynamic arrays based on categories
      const categories = organisation.categories.map((category) => ({
        [category.categoryName]: [
          {
            URL: "",
            fileName: "",
            uploadedOn: "",
          },
        ],
      }));

      // Assign categories to the user
      newUser.categories = categories;

      await newUser.save();

      ResponseService.status = constants.CODE.OK;
      const response = ResponseService.responseService(
        constants.STATUS.SUCCESS,
        newUser,
        messages.USER_CREATED_SUCCESSFULLY
      );
      return res.status(ResponseService.status).json(response);
    }

    // Step 4: If card is not found, return an error
    ResponseService.status = constants.CODE.BAD_REQUEST; // HTTP 400
    return res
      .status(ResponseService.status)
      .json(
        ResponseService.responseService(
          constants.STATUS.ERROR,
          {},
          messages.CARD_NOT_FOUND
        )
      );
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
    console.error("Error creating/fetching user by cardNumber:", error);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
  }
};

export const logoutUser = async (req, res) => {
  try {
    // Invalidate the token (e.g., add it to a blacklist or inform the client to remove it)
    const token = req.header("Authorization")?.split(" ")[1];

    if (!token) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.TOKEN_NOT_PROVIDED
      );
      return res.status(ResponseService.status).json(response);
    }

    // Send successful logout response
    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      [],
      messages.LOGOUT_SUCCESSFUL
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Logout error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Scan Card
export const scanCard = async (req, res) => {
  try {
    const { cardNumber } = req.params;

    // Step 1: Check if card exists in User model
    let user = await User.findOne({ cardNumber });
    if (user) {
      ResponseService.status = constants.CODE.OK; // HTTP 200
      return res.status(ResponseService.status).json(
        ResponseService.responseService(
          constants.STATUS.SUCCESS,
          {
            user: _.omit(user.toObject(), [
              "password",
              "isActive",
              "labReports",
              "prescriptions",
              "categories",
            ]),
          },
          messages.USER_FOUND
        )
      );
    }

    // Step 2: Check if card exists in Organization's cardNumbers
    const organisation = await Organisation.findOne({
      cardNumbers: cardNumber,
    }).populate("categories");

    if (organisation) {
      // Step 3: Create a new user with the scanned card and organization details
      const newUser = new User({
        firstName: "",
        lastName: "",
        organization: organisation._id,
        organisationName: organisation.organisationName,
        cardNumber,
        isActive: true,
      });

      // Step 4: Create dynamic arrays based on categories
      const categories = organisation.categories.map((category) => ({
        [category.categoryName]: [
          {
            URL: "",
            fileName: "",
            uploadedOn: "",
          },
        ],
      }));

      // Assign categories to the user
      newUser.categories = categories;

      await newUser.save();

      ResponseService.status = constants.CODE.OK; // HTTP 200
      return res
        .status(ResponseService.status)
        .json(
          ResponseService.responseService(
            constants.STATUS.SUCCESS,
            _.omit(newUser.toObject(), ["password", "categories"]),
            messages.USER_CREATED_SUCCESSFULLY
          )
        );
    }

    // Step 4: If card is not found, return an error
    ResponseService.status = constants.CODE.BAD_REQUEST; // HTTP 400
    return res
      .status(ResponseService.status)
      .json(
        ResponseService.responseService(
          constants.STATUS.ERROR,
          {},
          messages.CARD_NOT_FOUND
        )
      );
  } catch (error) {
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR; // HTTP 500
    console.error("Scan Card error:", error);
    return res
      .status(ResponseService.status)
      .json(
        ResponseService.responseService(
          constants.STATUS.EXCEPTION,
          {},
          messages.INTERNAL_SERVER_ERROR
        )
      );
  }
};

//GetSignedUrl From S3

export const getSignedUrlController = async (req, res) => {
  const { filename, filetype } = req.query;

  try {
    const signedUrl = await getSignedS3UrlUtil(filename, filetype);

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { signedUrl },
      messages.FILE_FOUND
    );
    res.status(ResponseService.status).json(response);
  } catch (error) {
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};
export const getAllUsers = async (req, res) => {
  try {
    let users = await User.find().populate('organisation', 'organisationName');

    res.status(200).json({
      message: 'success',
      data: users
    });

  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};


export const getUserOrganization = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('organisation', 'organisationName');

    console.log("Fetched User:", user);
    console.log("User.organization:", user?.organization);
    console.log("OrganizationId from request:", organizationId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ organizationName: user.organization.organisationName });
  } catch (err) {
    console.error('Error fetching user organization:', err);
    res.status(500).json({ message: 'Failed to fetch organization for user' });
  }
};
export const getPromoCodeForUser = async (req, res) => {
  try {
    const { partnerId } = req.params;
    // Find one unused promo code for the given partner/organization
    const promoCode = await PromoCode.findOne({ 
      partnerId,
      status: 'unused'
    });

    if (!promoCode) {
      return res.status(404).json({ message: 'No promo code available for this organization' });
    }

    res.status(200).json({ promoCode: promoCode.code });

  } catch (error) {
    console.error('Error fetching promo code:', error);
    res.status(500).json({ message: 'Failed to fetch promo code' });
  }
};

export const markPromoCodeAsUsed = async (req, res) => {
  try {
    const { code, billAmount } = req.body;

    if (!code || !billAmount) {
      return res.status(400).json({ message: 'Code and bill amount are required' });
    }

    const promoCode = await PromoCode.findOne({ code });

    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    if (promoCode.status === 'used') {
      return res.status(400).json({ message: 'Promo code is already used' });
    }

    // Mark promo code as used
    promoCode.status = 'used';
    await promoCode.save();

    // Create usage log in UserPromoCode collection
    const userPromo = new UserPromoCode({
      userId: promoCode.assignedToUser,
      promoCode: promoCode.code,
      billAmount: billAmount,
    });

    await userPromo.save();

    res.status(200).json({ message: 'Promo code marked as used and recorded successfully.' });

  } catch (error) {
    console.error('Error marking promo code as used:', error);
    res.status(500).json({ message: 'Failed to mark promo code as used.' });
  }
};
export const assignPromoCodeToUser = async (req, res) => {
  try {
    const { userId, billAmount, organizationId } = req.body;

    if (!userId || !billAmount || !organizationId) {
      return res.status(400).json({ message: 'User ID, Bill Amount, and Organization ID are required.' });
    }

    // Get user with their associated organisation info (optional)
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // 🧹 Removed organisation match check

    const promoCode = await PromoCode.findOne({
      partnerId: organizationId,
      status: 'unused'
    });

    if (!promoCode) {
      return res.status(404).json({ message: 'No available promo codes for this organization.' });
    }
    console.log({
      userId,
        promoCode: promoCode.code,
        billAmount: billAmount
      });

    // Save assignment in UserPromoCode collection
    try {
  const userPromo = new UserPromoCode({
    userId,
    promoCode: promoCode.code,
    billAmount
  });

  await userPromo.save();
  console.log("✅ Saved to UserPromoCode!");

  const allPromos = await UserPromoCode.find();
  console.log("All UserPromoCodes:", allPromos);
} catch (err) {
  console.error("❌ Failed to save to UserPromoCode:", err);
}

    // Mark promo code as used
    promoCode.status = 'used';
    promoCode.assignedToUser = userId;
    promoCode.assignedOn = new Date();
    await promoCode.save();

    // Update organisation's promo pools
    await Organisation.updateOne(
      { _id: organizationId },
      {
        $pull: { unusedCodes: promoCode._id },
        $push: { usedCodes: promoCode._id }
      }
    );

    res.status(200).json({
      message: 'Promo code assigned and saved to userPromoCode collection.',
      promoCode: promoCode.code
    });

  } catch (err) {
    console.error('Error assigning promo code:', err);
    res.status(500).json({ message: 'Server error while assigning promo code.' });
  }
};

