import Organisation from "../../models/Organisation.js";
import User from "../../models/User.js";
import Category from "../../models/Category.js";
import ResponseService from "../../helper/responseObject.js";
import constants from "../../utils/constants.js";
import { getUserIdFromToken } from "../../services/tokenService.js";
import messages from "../../utils/messages.js";
import _ from "lodash";

// Get dashboard
export const getDashboardDetails = async (req, res) => {
  try {
    var loggedInUserId = getUserIdFromToken(req);
    const loggedInUser = await User.findById(loggedInUserId);
    const activeUserCount = await User.countDocuments({ isActive: true });
    const orgCount = await Organisation.countDocuments();
    const catCount = await Category.countDocuments();
    const totalCardNumbersCount = await Organisation.aggregate([
      { $project: { cardNumbers: { $size: "$cardNumbers" } } }, // Project the size of the cardNumbers array
      { $group: { _id: null, totalCardCount: { $sum: "$cardNumbers" } } }, // Sum up the sizes
    ]);

    const cardCount =
      totalCardNumbersCount.length > 0
        ? totalCardNumbersCount[0].totalCardCount
        : 0;

    ResponseService.status = constants.CODE.OK;
    const response = ResponseService.responseService(
      constants.STATUS.SUCCESS,
      { activeUserCount, orgCount, catCount, cardCount, loggedInUser },
      messages.SUCCESS
    );
    res.status(ResponseService.status).json(response);
  } catch (err) {
    console.error("Get Dashboard error:", err);
    ResponseService.status = constants.CODE.INTERNAL_SERVER_ERROR;
    const errorResponse = ResponseService.responseService(
      constants.STATUS.EXCEPTION,
      [],
      messages.INTERNAL_SERVER_ERROR
    );
    res.status(ResponseService.status).json(errorResponse);
  }
};
