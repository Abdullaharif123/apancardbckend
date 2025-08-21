import Prescription from "../models/Prescription.js";
import PrescriptionDetail from "../models/PrescriptionDetail.js";
import User from "../models/User.js";
import messages from "../utils/messages.js";
import ResponseService from "../helper/responseObject.js";
import constants from "../utils/constants.js";
import moment from "moment";

export const createPrescriptionService = async ({
  userId,
  loggedInUserId,
  tablets,
  specialRemarks,
  specialInstructions,
  images,
  cardNumber,
}) => {
  const user = await User.findById(userId);
  const loggedInUser = await User.findById(loggedInUserId);

  if (!user || !loggedInUser) {
    ResponseService.status = constants.CODE.BAD_REQUEST;
    const response = ResponseService.responseService(
      constants.STATUS.ERROR,
      [],
      messages.USER_NOT_FOUND
    );
    return res.status(ResponseService.status).json(response);
  }

  const newPrescription = new Prescription({
    userId: userId,
    addedBy: loggedInUser.firstName + " " + loggedInUser.lastName,
    cardNumber,
    specialRemarks,
    specialInstructions,
    imageUrls: images || [], // Array of { name, s3Url }
  });

  const savedPrescription = await newPrescription.save();

  let savedTablets = [];

  if (tablets?.length > 0) {
    const tabletDocuments = tablets.map((tablet) => ({
      prescriptionId: savedPrescription._id,
      tabletName: tablet.tabletName,
      isMorning: tablet.isMorning,
      isEvening: tablet.isEvening,
      isNight: tablet.isNight,
      days: tablet.days,
      description: tablet.description,
    }));

    savedTablets = await PrescriptionDetail.insertMany(tabletDocuments);
  }

  const result = {
    ...savedPrescription.toObject(),
    tablets: savedTablets,
  };
  return result;
};

export const fetchPrescriptionWithTabletsService = async (prescriptionId) => {
  const prescription = await Prescription.findById(prescriptionId).populate({
    path: "userId",
    select: "firstName lastName dob",
  });

  if (!prescription) {
    ResponseService.status = constants.CODE.BAD_REQUEST;
    const response = ResponseService.responseService(
      constants.STATUS.ERROR,
      [],
      messages.PRESCRIPTION_NOT_FOUND
    );
    return res.status(ResponseService.status).json(response);
  }

  const tablets = await PrescriptionDetail.find({ prescriptionId });
  // Combine prescription with tablets as a single object
  const result = {
    ...prescription.toObject(),
    tablets,
  };

  return result;
};

// export const getPrescriptionsWithTablets = async (userId) => {
//   // Fetch All prescriptions for the user
//   const prescriptions = await Prescription.find({ userId }).populate({
//     path: "userId",
//     select: "firstName lastName dob",
//   });

//   const prescriptionsWithTablets = await Promise.all(
//     prescriptions.map(async (prescription) => {
//       const tablets = await PrescriptionDetail.find({
//         prescriptionId: prescription._id,
//       });
//       return {
//         ...prescription.toObject(),
//         tablets,
//       };
//     })
//   );

//   return prescriptionsWithTablets;
// };

export const getPrescriptionsWithTablets = async (userId, query) => {
  const page = parseInt(query.page || 1);
  const limit = parseInt(query.limit || 5);
  let month = query.month || moment().format("MM");

  // Ensure month is zero-padded if numeric (e.g., "1" -> "01")
  if (!isNaN(month)) {
    month = month.padStart(2, "0");
  }

  const year = query.year || moment().format("YYYY");
  const formattedMonth = `${year}-${month}`;

  // Fetch child user IDs
  const childUsers = await User.find({ parentUserId: userId }, { _id: 1 }); // Get only the _id field
  const childUserIds = childUsers.map((user) => user._id);

  // Include parent userId and childUserIds in the filter
  const filters = { userId: { $in: [userId, ...childUserIds] } };

  // Filter by month (default or provided)
  const startOfMonth = moment(formattedMonth, "YYYY-MM")
    .startOf("month")
    .toDate();
  const endOfMonth = moment(formattedMonth, "YYYY-MM").endOf("month").toDate();
  filters.createdOn = { $gte: startOfMonth, $lte: endOfMonth };

  // Fetch total count for pagination metadata
  const totalPrescriptions = await Prescription.countDocuments(filters);

  // Fetch paginated prescriptions
  const prescriptions = await Prescription.find(filters)
    .populate({
      path: "userId",
      select: "firstName lastName dob",
    })
    .sort({ createdOn: -1 }) // Sort by most recent
    .skip((page - 1) * limit)
    .limit(limit);

  // Fetch tablets for each prescription
  const prescriptionsWithTablets = await Promise.all(
    prescriptions.map(async (prescription) => {
      const tablets = await PrescriptionDetail.find({
        prescriptionId: prescription._id,
      });
      return {
        ...prescription.toObject(),
        tablets,
      };
    })
  );

  // Prepare pagination metadata
  const pagination = {
    total: totalPrescriptions,
    page,
    limit,
    totalPages: Math.ceil(totalPrescriptions / limit),
  };

  return {
    prescriptions: prescriptionsWithTablets,
    pagination,
  };
};
