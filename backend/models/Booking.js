import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Tenant',
        index: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    address: { type: String, required: true },
    phone: { type: String, required: true },
    packageTour: { type: String, required: true },
    pax: { type: Number, required: true, default: 1 },
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    travelDate: { type: Date },
    notes: { type: String },
    totalPrice: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ['Pending', 'Confirmed', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

const Booking = mongoose.model('Booking', bookingSchema);
export default Booking;
