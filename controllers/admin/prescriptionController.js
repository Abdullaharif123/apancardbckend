import Prescription from "../../models/Prescription.js";
import ResponseService from "../../helper/responseObject.js";
import constants from "../../utils/constants.js";
import messages from "../../utils/messages.js";
import { getUserIdFromToken } from "../../services/tokenService.js";
import _ from "lodash";
import User from "../../models/User.js";
import {
  createPrescriptionService,
  fetchPrescriptionWithTabletsService,
} from "../../services/prescriptionService.js";

export const createPrescription = async (req, res) => {
  const { userId } = req.params;
  const { tablets, specialRemarks, images, specialInstructions, cardNumber } =
    req.body;
  const loggedInUserId = getUserIdFromToken(req);

  try {
    // Call the service to handle logic
    const savedPrescription = await createPrescriptionService({
      userId,
      loggedInUserId,
      tablets,
      specialRemarks,
      specialInstructions,
      images,
      cardNumber,
    });

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      savedPrescription,
      messages.PRESCRIPTION_AND_TABLETS_SAVED_SUCCESSFULLY
    );
    return res.status(ResponseService.status).json(response);
  } catch (error) {
    console.error("Create prescription error:", error);

    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
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
