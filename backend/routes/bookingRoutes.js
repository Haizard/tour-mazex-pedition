import express from 'express';
import Booking from '../models/Booking.js';
import TourPackage from '../models/TourPackage.js';

const router = express.Router();

// Get all bookings (Admin)
router.get('/', async (req, res) => {
    try {
        const bookings = await Booking.find().sort({ createdAt: -1 });
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create a new booking (Customer)
router.post('/', async (req, res) => {
    const bookingData = { ...req.body };

    if (!bookingData.pax) {
        bookingData.pax = Number(bookingData.adults || 0) + Number(bookingData.children || 0);
    }

    if (!bookingData.pax || bookingData.pax < 1) {
        bookingData.pax = 1;
    }

    bookingData.adults = Number(bookingData.adults || bookingData.pax || 1);
    bookingData.children = Number(bookingData.children || 0);

    try {
        // If it's a specific package booking, check for group capacity
        const tour = await TourPackage.findOne({ title: bookingData.packageTour });

        if (tour && tour.isGroupTour) {
            if (tour.currentBookings + bookingData.pax > tour.maxCapacity) {
                return res.status(400).json({
                    message: `Sorry, only ${tour.maxCapacity - tour.currentBookings} spots left for this group tour.`
                });
            }

            // Increment bookings
            tour.currentBookings += bookingData.pax;
            await tour.save();
        }

        const newBooking = new Booking(bookingData);
        await newBooking.save();
        res.status(201).json(newBooking);
    } catch (error) {
        res.status(409).json({ message: error.message });
    }
});

// Delete a booking (Admin)
router.delete('/:id', async (req, res) => {
    try {
        await Booking.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

export default router;
