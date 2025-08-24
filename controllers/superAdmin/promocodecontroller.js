import PromoCode from '../../models/promocode.js';

export const savePromoCodes = async (req, res) => {
  try {
    const { partnerId, fromDate, toDate, codes } = req.body;

    if (!partnerId || !fromDate || !toDate || !codes || !codes.length) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    const promoCodeDocs = codes.map(code => ({
      partnerId,
      fromDate,
      toDate,
      code,
      status: 'unused'   // <-- Setting status here
    }));

    await PromoCode.insertMany(promoCodeDocs);

    res.status(201).json({ message: 'Promo codes saved successfully.' });
  } catch (error) {
    console.error('Error saving promo codes:', error);
    res.status(500).json({ message: 'Internal server error.' });
  }
};
