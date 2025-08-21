import mongoose from 'mongoose';

const promoCodeSchema = new mongoose.Schema({
  partnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organisation',
    required: true
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  fromDate: {
    type: Date,
    required: true
  },
  toDate: {
    type: Date,
    required: true
  },
  assignedToUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  assignedOn: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['unused', 'used'],
    default: 'unused'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
export default PromoCode;
