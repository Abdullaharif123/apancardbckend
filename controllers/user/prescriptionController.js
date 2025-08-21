import Prescription from "../../models/Prescription.js";
import ResponseService from "../../helper/responseObject.js";
import constants from "../../utils/constants.js";
import messages from "../../utils/messages.js";
import { getUserIdFromToken } from "../../services/tokenService.js";
import _ from "lodash";
import User from "../../models/User.js";
import {
  fetchPrescriptionWithTabletsService,
  getPrescriptionsWithTablets,
} from "../../services/prescriptionService.js";

export const getUserPrescriptions = async (req, res) => {
  const { catId, pageno, month } = req.body;

  const userId = getUserIdFromToken(req);
  const page = pageno || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  let dateFilter = {};
  if (month) {
    const year = new Date().getFullYear(); // Assuming the current year, you can change this if needed
    const startDate = new Date(year, month - 1, 1); // First day of the selected month
    const endDate = new Date(year, month, 0, 23, 59, 59); // Last day of the selected month
    dateFilter = {
      updatedOn: {
        $gte: startDate,
        $lt: endDate,
      },
    };
  }

  const skip = (page - 1) * limit;

  // Get the total count of user files that match the search condition
  const totalUserPres = await Prescription.countDocuments({
    userId: userId,
    isActive: true,
    ...dateFilter,
  });

  try {
    const userPrescription = await Prescription.find({
      userId: userId,
      isActive: true,
      ...dateFilter,
    })
      .populate("addedByUserId", "name email organisationName")
      .sort({ createdOn: 1 })
      .skip(skip)
      .limit(limit);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalUserPres / limit),
      totalRecords: totalUserPres,
      limit,
    };

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { userPrescription, pagination },
      messages.FILE_FOUND
    );
    res.status(ResponseService.status).json(response);
  } catch (error) {
    console.error("User Prescription error:", error);
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
export const updatePrescription = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  try {
    const pres = await Prescription.findById(id);

    if (!pres) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.PRESCRIPTION_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }
    // Dynamically update fields based on what's in the request body
    Object.keys(updateFields).forEach((key) => {
      if (key in pres) {
        pres[key] = updateFields[key];
      }
    });

    await pres.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      pres,
      messages.PRESCRIPTION_UPDATED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Update Prescription error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// export const getUserPrescriptionsv2 = async (req, res) => {
//   const { userId } = req.params;

//   try {
//     const responseData = await getPrescriptionsWithTablets(userId);

//     ResponseService.status = constants.CODE.OK;
//     const response = ResponseService.responseService(
//       constants.STATUS.SUCCESS,
//       responseData,
//       messages.PRESCRIPTION_AND_TABLETS_FOUND_SUCCESSFULLY
//     );
//     return res.status(ResponseService.status).json(response);
//   } catch (error) {
//     console.error(error);
//     ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
//     const response = ResponseService.responseService(
//       constants.STATUS.EXCEPTION,
//       null,
//       messages.INTERNAL_SERVER_ERROR
//     );
//     return res.status(ResponseService.status).json(response);
//   }
// };

export const getUserPrescriptionsv2 = async (req, res) => {
  const { userId } = req.params;
  const query = req.query; // Extract pagination and filtering parameters from query

  try {
    const responseData = await getPrescriptionsWithTablets(userId, query);

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      responseData,
      messages.PRESCRIPTION_AND_TABLETS_FOUND_SUCCESSFULLY
    );
    return res.status(ResponseService.status).json(response);
  } catch (error) {
    console.error(error);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const response = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      null,
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(response);
  }
};

export const getPrescriptionWithTablets = async (req, res) => {
  const { prescriptionId } = req.params;

  try {
    const responseData = await fetchPrescriptionWithTabletsService(
      prescriptionId
    );

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      responseData,
      messages.PRESCRIPTION_AND_TABLETS_FOUND_SUCCESSFULLY
    );
    return res.status(ResponseService.status).json(response);
  } catch (error) {
    console.error("Error fetching prescription with tablets:", error);

    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
  }
};
