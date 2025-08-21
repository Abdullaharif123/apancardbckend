import Organisation from "../models/Organisation.js";
import User from "../models/User.js";

export async function assignCategoriesToUser(userId, organizationId) {
  // Fetch the organization to get its categories
  const organization = await Organisation.findById(organizationId).populate(
    "categories"
  );

  if (!organization) {
    throw new Error("Organization not found");
  }

  // Assign the organization's categories to the user
  await User.findByIdAndUpdate(userId, {
    categories: organization?.categories,
  });
}

export async function userHasCategoryPermission(userId, categoryId) {
  const user = await User.findById(userId).populate("categories");
  return user.categories.some((category) => category._id.equals(categoryId));
}
