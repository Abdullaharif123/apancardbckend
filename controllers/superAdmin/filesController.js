import Files from "../../models/Files.js";
import ResponseService from "../../helper/responseObject.js";
import constants from "../../utils/constants.js";
import messages from "../../utils/messages.js";
import _ from "lodash";

// Create user file
export const createFiles = async (req, res) => {
  const { fileName, filePath, userId, categoryId } = req.body;

  try {
    const existingFile = await Files.findOne({
      fileName,
      filePath,
      userId,
      categoryId,
    });

    if (existingFile) {
      ResponseService.status = constants.CODE.ACCEPTED;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.FILE_ALREADY_EXISTS
      );
      return res.status(ResponseService.status).json(response);
    }

    const newFile = new Files({
      fileName,
      filePath,
      userId,
      categoryId,
      isActive: true,
    });

    await newFile.save();

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { userId: newFile.userId, categoryId: newFile.categoryId },
      messages.FILE_SAVED_SUCCESSFULLY
    );
    res.status(ResponseService.status).json(response);
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.DUPLICATE_FILE_INFO
      );
      return res.status(ResponseService.status).json(response);
    }

    console.error("Create file error:", error);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(errorResponse);
  }
};

export const getFiles = async (req, res) => {
  const { userId, catId, fileName, pageno, month } = req.body;

  const searchKeyword = fileName || "";
  const page = pageno || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  const searchCondition = searchKeyword
    ? { fileName: { $regex: searchKeyword, $options: "i" } }
    : {};

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
  const totalUserFiles = await Files.countDocuments({
    userId: userId,
    categoryId: catId,
    isActive: true,
    ...searchCondition,
    ...dateFilter,
  });

  try {
    const userFiles = await Files.find({
      userId: userId,
      categoryId: catId,
      isActive: true,
      ...searchCondition,
      ...dateFilter,
    })
      .sort({ fileName: 1 }) // Sorting alphabetically by fileName
      .skip(skip)
      .limit(limit);

    const pagination = {
      currentPage: page,
      totalPages: Math.ceil(totalUserFiles / limit),
      totalRecords: totalUserFiles,
      limit,
    };

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { userFiles, pagination },
      messages.FILE_FOUND
    );
    res.status(ResponseService.status).json(response);
  } catch (error) {
    console.error("User Files error:", error);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};

export const deleteFiles = async (req, res) => {
  const { userId, filePath, categoryId } = req.query; // Get the category and URL from the query parameters

  try {
    const file = await Files.findOne({
      filePath,
      userId,
      categoryId,
    });

    if (!file) {
      ResponseService.status = constants.CODE.BAD_REQUEST;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.USER_NOT_FOUND
      );
      return res.status(ResponseService.status).json(response);
    }

    await Files.deleteOne({ _id: file._id });

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { message: `File deleted successfully` },
      messages.FILE_REMOVED_SUCCESSFULLY
    );
    return res.status(ResponseService.status).json(response);
  } catch (error) {
    console.error("Error removing URL:", error);
    ResponseService.status = constants.CODE.SERVER_ERROR;
    const response = ResponseService.responseService(
      constants.STATUS.ERROR,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    return res.status(ResponseService.status).json(response);
  }
};
