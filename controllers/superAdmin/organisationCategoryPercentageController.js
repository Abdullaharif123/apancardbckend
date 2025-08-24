import OrganisationCategoryPercentage from "../../models/OrganisationCategoryPercentage.js";

// Create or Update percentages
export const createOrgCategoryPercentage = async (req, res) => {
  try {
    const { organisationId, percentages } = req.body;

    // Fetch the document for this organisation
    let orgDoc = await OrganisationCategoryPercentage.findOne({ organisationId });

    if (!orgDoc) {
      // Create document if not exists
      orgDoc = new OrganisationCategoryPercentage({
        organisationId,
        categories: percentages,
      });
    } else {
      // Update existing percentages or add new ones
      percentages.forEach((p) => {
        const existing = orgDoc.categories.find(
          (c) => String(c.categoryId) === String(p.categoryId)
        );
        if (existing) {
          existing.percentage = p.percentage; // update
        } else {
          orgDoc.categories.push({ categoryId: p.categoryId, percentage: p.percentage }); // add new
        }
      });
    }

    await orgDoc.save();

    res.status(200).json({ message: "Percentages saved successfully" });
  } catch (error) {
    console.error("Error saving percentages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};


// Get percentages for an organisation
export const getOrgCategoryPercentages = async (req, res) => {
  try {
    const { organisationId } = req.params;

    // Fetch the organisation's category percentages
    const orgDoc = await OrganisationCategoryPercentage.findOne({ organisationId });

    if (!orgDoc) {
      return res.status(200).json([]); // return empty array if not found
    }

    res.status(200).json(orgDoc.categories); // array of { categoryId, percentage }
  } catch (error) {
    console.error("Error fetching percentages:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

