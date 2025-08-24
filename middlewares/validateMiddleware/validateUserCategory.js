import Joi from "joi";
import ResponseService from "../../helper/responseObject.js";
import constants from "../../utils/constants.js";

const userCategorySchema = Joi.object({
  userId: Joi.string().required(), // Assuming userId will be passed as a string
  categoryId: Joi.string().required(), // Assuming categoryId will be passed as a string
  isActive: Joi.boolean().optional(), // Optional since it defaults to false
});

const validateUserCategory = (req, res, next) => {
  const { error } = userCategorySchema.validate(req.body);

  if (error) {
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

export default validateUserCategory;
