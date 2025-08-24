import ResponseService from "../helper/responseObject.js";
import constants from "../utils/constants.js";
import messages from "../utils/messages.js";

export const checkRole = (role) => {
  return (req, res, next) => {
    if (req.user && req.user.role === role) {
      next();
    } else {
      ResponseService.status = constants.CODE.FORBIDDEN;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.NOT_AUTHORIZED
      );
      res.status(ResponseService.status).json(response);
    }
  };
};
