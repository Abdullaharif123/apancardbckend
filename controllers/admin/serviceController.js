import ResponseService from "../../helper/responseObject.js";
import constants from "../../utils/constants.js";
import messages from "../../utils/messages.js";
import Service from "../../models/Service.js";
import { getUserIdFromToken } from "../../services/tokenService.js";
import _ from "lodash";

export const createService = async (req, res) => {
  try {
    const { name, price } = req.body;

    const loggedInUserId = getUserIdFromToken(req);
    // Check if a service with the same name and userId already exists
    const existingService = await Service.findOne({
      name,
      userId: loggedInUserId,
    });
    if (existingService) {
      ResponseService.status = constants.CODE.CONFLICT;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.SERVICE_ALREADY_EXISTS
      );
      return res.status(ResponseService.status).json(response);
    }

    const service = new Service({
      userId: loggedInUserId,
      name,
      price,
      isActive: true,
    });

    await service.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      service,
      messages.SERVICE_ADDED_SECCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (error) {
    console.error("Service Creation error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

export const getServices = async (req, res) => {
  try {
    // Ensure loggedInUserId is an ObjectId
    const loggedInUserId = getUserIdFromToken(req);

    // Extract query parameters
    const searchTerm = req.query.searchTerm || "";
    const page = Math.max(parseInt(req.query.page, 10), 1) || 1;
    const limit = Math.max(parseInt(req.query.limit, 10), 10) || 10;
    const skip = (page - 1) * limit;

    // Create search condition for the 'name' field
    const searchCondition = {
      userId: loggedInUserId,
      name: { $regex: searchTerm, $options: "i" }, // Case-insensitive search
    };

    // Fetch services and total count in parallel
    const [totalServices, services] = await Promise.all([
      Service.countDocuments(searchCondition),
      Service.find(searchCondition).skip(skip).limit(limit),
    ]);

    // if (!services.length) {
    //   ResponseService.status = constants.CODE.BAD_REQUEST;
    //   const response = ResponseService.responseService(
    //     constants.STATUS.ERROR,
    //     [],
    //     messages.SERVICE_NOT_FOUND
    //   );
    //   return res.status(ResponseService.status).json(response);
    // }

    // Pagination info
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalServices / limit),
      totalRecords: totalServices,
      limit,
    };

    // Success response
    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { services, pagination },
      messages.SERVICES_FETCHED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Service Fetch Error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findById(id).populate(
      "userId",
      '"name email organisationName"'
    );
    if (!service) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.SERVICE_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      service,
      messages.SERVICE_FOUND
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Service Fetch by ID Error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

export const updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, isActive } = req.body;

    const service = await Service.findById(id);
    if (!service) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.SERVICE_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    service.name = name ?? service.name;
    service.price = price ?? service.price;
    service.isActive = isActive ?? service.isActive;

    service.updatedOn = Date.now();

    await service.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      service,
      messages.SERVICE_UPDATED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Service Update Error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.SERVICE_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    await service.deleteOne();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      [],
      messages.SERVICE_DELETED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Service Deletion Error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};
