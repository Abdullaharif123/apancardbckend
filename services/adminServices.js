import { cardTypes, roles } from "../helper/enum.js";
import User from "../models/User.js";

export async function createFamilyMembersForUser(familyMembers, parentUserId) {
  const familyMemberIds = [];
  const currentYear = new Date().getFullYear();

  for (const member of familyMembers) {
    const { name, age, relation, gender } = member;
    const dobFromAge = new Date(currentYear - age, 0, 1);

    const familyMember = await User.create({
      firstName: name.split(" ")[0],
      lastName: name.split(" ").slice(1).join(" ") || "",
      gender,
      dob: dobFromAge,
      relation,
      parentUserId,
      cardType: cardTypes.familyCard,
      role: roles.user,
      isActive: false,
    });

    familyMemberIds.push(familyMember._id);
  }

  return familyMemberIds;
}
