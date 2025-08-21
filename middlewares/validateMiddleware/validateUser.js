// middleware/validateUser.js
import Joi from "joi";
import ResponseService from "../../helper/responseObject.js";
import constants from "../../utils/constants.js";

const userSchema = Joi.object({
  firstName: Joi.string().optional(),
  lastName: Joi.string().optional(),
  profilePicture: Joi.string().uri().allow(null),
  email: Joi.string().email().required(),
  cnic: Joi.string().required(),
  mobileNo: Joi.string().required(),
  organization: Joi.string().default("Individual"),
  dob: Joi.date().optional(),
  gender: Joi.string().optional(),
  password: Joi.string().min(6).required(),
  role: Joi.string().default("User"),
  isActive: Joi.boolean().default(false),
  cardNumber: Joi.string().required(),
  prescriptions: Joi.array().items(Joi.string().uri()).default([]),
  labReports: Joi.array().items(Joi.string().uri()).default([]),
});

const validateUser = (req, res, next) => {
  const { error } = userSchema.validate(req.body);
  if (error) {
    console.log("error: ", error);

    ResponseService.status = constants.CODE.BAD_REQUEST;
    const response = ResponseService.responseService(
      constants.STATUS.ERROR,
      [],
      error.details[0].message // Provide the Joi error message
    );
    return res.status(ResponseService.status).json(response);
  }
  next();
};

export default validateUser;
