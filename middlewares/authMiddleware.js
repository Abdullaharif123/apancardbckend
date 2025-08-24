import jwt from "jsonwebtoken";

import ResponseService from "../helper/responseObject.js";
import constants from "../utils/constants.js";
import messages from "../utils/messages.js";
import dotenv from "dotenv";

dotenv.config();

// export const verifyToken = (req, res, next) => {
//   const token = req.headers["authorization"];
//   console.log("token: ", token);

//   if (!token) {
//     ResponseService.status = constants.CODE.UNAUTHORIZED;
//     const response = ResponseService.responseService(
//       constants.STATUS.ERROR,
//       [],
//       messages.NO_TOKEN_PROVIDED
//     );
//     return res.status(ResponseService.status).json(response);
//   }

//   try {
//     console.log("Awais");
//     console.log("token: ", token);
//     console.log("process.env.JWT_SECRET: ", process.env.JWT_SECRET);

//     const verified = jwt.verify(token, process.env.JWT_SECRET);

//     console.log("verified: ", verified);
//     req.user = verified;
//     next();
//   } catch (error) {
//     ResponseService.status = constants.CODE.BAD_REQUEST;
//     const response = ResponseService.responseService(
//       constants.STATUS.ERROR,
//       [],
//       messages.INVALID_TOKEN
//     );
//     return res.status(ResponseService.status).json(response);
//   }
// };

export const verifyToken = (req, res, next) => {
  if (req.originalUrl.includes("/api/super-admin/organisation-names")) {
    return next();
  }
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) {
    ResponseService.status = constants.CODE.UNAUTHORIZED;
    const response = ResponseService.responseService(
      constants.STATUS.ERROR,
      [],
      messages.TOKEN_REQUIRED
    );
    return res.status(ResponseService.status).json(response);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      ResponseService.status = constants.CODE.FORBIDDEN;
      const response = ResponseService.responseService(
        constants.STATUS.ERROR,
        [],
        messages.TOKEN_REQUIRED
      );
      return res.status(ResponseService.status).json(response);
    }
    req.user = user;
    next();
  });
};
