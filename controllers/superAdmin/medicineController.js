import Medicine from "../../models/Medicine.js";
import ResponseService from "../../helper/responseObject.js";
import constants from "../../utils/constants.js";
import messages from "../../utils/messages.js";
import _ from "lodash";

// Create a new Medicine
export const createMedicine = async (req, res) => {
  const { medicineName } = req.body;

  try {
    const existingMedic = await Medicine.findOne({
      $expr: {
        $eq: [{ $toLower: "$medicineName" }, medicineName.toLowerCase()],
      },
    });
    if (existingMedic) {
      ResponseService.status = constants.CODE.ACCEPTED;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.MEDICINE_ALREADY_EXISTS
      );
      return res.status(ResponseService.status).json(response);
    }

    // Create new Medicine
    const newMedic = new Medicine({
      medicineName,
      isActive: true,
      createdOn: Date.now(),
      updatedOn: Date.now(),
    });

    await newMedic.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { medicineName: newMedic.medicineName },
      messages.MEDICINE_CREATED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.DUPLICATE_MED_INFO
      );
      return res.status(ResponseService.status).json(response);
    }

    console.error("Create Medicine error:", error);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
  }
};

// Update Medicine
export const updateMedicine = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;

  try {
    const medic = await Medicine.findById(id);

    if (!medic) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.MEDICINE_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }
    // Dynamically update fields based on what's in the request body
    Object.keys(updateFields).forEach((key) => {
      if (key in medic) {
        medic[key] = updateFields[key];
      }
    });

    await medic.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      medic,
      messages.CATEGORY_UPDATED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Update Medicine error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Delete Medicine
export const deleteMedicine = async (req, res) => {
  const { id } = req.params;

  try {
    const medic = await Medicine.findById(id);

    if (!medic) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.MEDICINE_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    // Remove the Medicine
    await Medicine.deleteOne({ _id: id });

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      {},
      messages.MEDICINE_DELETED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Medicine Category error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Get all Medicines
export const getAllMedicines = async (req, res) => {
  try {
    const searchKeyword = req.query.searchTerm || "";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const searchCondition = searchKeyword
      ? { medicineName: { $regex: searchKeyword, $options: "i" } }
      : {};

    // Calculate the number of records to skip based on the current page
    const skip = (page - 1) * limit;

    // Get the total count of Medicine that match the search condition
    const totalMedicines = await Medicine.countDocuments(searchCondition);

    // Fetch the Medicine with pagination
    const medicines = await Medicine.find(searchCondition)
      .sort({ medicineName: 1 })
      .skip(skip)
      .limit(limit);

    // Create a pagination object
    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalMedicines / limit),
      totalRecords: totalMedicines,
      limit,
    };

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { medicines, pagination },
      messages.MEDICINE_FOUND
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get Medicines error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

// Get all Medicines
export const getAllMedicinesWOPagination = async (req, res) => {
  try {
    // Fetch all Medicines
    const medicines = await Medicine.find({}).sort({ medicineName: 1 });

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { medicines },
      messages.MEDICINE_FOUND
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get Medicines error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};
