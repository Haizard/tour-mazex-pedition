import express from "express";
import RestaurantPartnerAdmin from "../models/RestaurantPartnerAdmin.js";
import Restaurant from "../models/Restaurant.js";
import RestaurantAvailabilityEntry from "../models/RestaurantAvailabilityEntry.js";
import RestaurantReservationRequest from "../models/RestaurantReservationRequest.js";
import RestaurantServiceWindow from "../models/RestaurantServiceWindow.js";
import RestaurantTableType from "../models/RestaurantTableType.js";
import RestaurantMenuSection from "../models/RestaurantMenuSection.js";
import RestaurantMenuItem from "../models/RestaurantMenuItem.js";
import PaymentTransaction from "../models/PaymentTransaction.js";
import { requireRestaurantPartnerAdmin } from "../middleware/restaurantPartnerAuthMiddleware.js";
import { signRestaurantPartnerToken, verifyAdminPassword } from "../utils/adminAuth.js";
import {
  buildReservationStatusUpdate,
  normalizeAvailabilityPayload,
  normalizeServiceWindowPayload,
  normalizeTableTypePayload,
  shapeReservationRequest,
} from "../utils/restaurantReservations.js";
import {
  normalizeMenuItemPayload,
  normalizeMenuSectionPayload,
} from "../utils/restaurantMenu.js";
import {
  buildReservationPaymentUpdate,
  buildRestaurantPaymentTransactionPayload,
  calculateRestaurantDepositAmount,
  isActiveRestaurantPaymentTransaction,
  normalizeRestaurantCheckoutSettings,
  validateCustomRestaurantPayment,
} from "../utils/restaurantCheckout.js";

const router = express.Router();

const shapePartnerAdmin = (admin = {}) => ({
  id: admin._id,
  username: admin.username,
  displayName: admin.displayName,
  role: admin.role,
  restaurantIds: (admin.restaurantIds || []).map((restaurantId) => String(restaurantId)),
  lastLoginAt: admin.lastLoginAt,
});

const getPartnerRestaurantIds = (admin = {}) =>
  (admin.restaurantIds || []).map((restaurantId) => String(restaurantId));

const assertPartnerRestaurantAccess = (req, restaurantId) => {
  const allowedIds = getPartnerRestaurantIds(req.restaurantPartnerAdmin);
  if (!allowedIds.includes(String(restaurantId))) {
    const error = new Error("Restaurant is not assigned to this partner account.");
    error.statusCode = 403;
    throw error;
  }
};

router.post("/login", async (req, res) => {
  try {
    const username = req.body.username?.toString().trim().toLowerCase();
    const password = req.body.password?.toString() || "";

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required." });
    }

    const partnerAdmin = await RestaurantPartnerAdmin.findOne({
      tenantId: req.tenantId,
      username,
      status: "active",
    });

    if (!partnerAdmin) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    const isValid = await verifyAdminPassword(
      password,
      partnerAdmin.passwordSalt,
      partnerAdmin.passwordHash
    );

    if (!isValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    partnerAdmin.lastLoginAt = new Date();
    await partnerAdmin.save();

    const token = signRestaurantPartnerToken({
      partnerAdminId: String(partnerAdmin._id),
      tenantId: String(req.tenantId),
      username: partnerAdmin.username,
      role: partnerAdmin.role,
      restaurantIds: partnerAdmin.restaurantIds,
    });

    return res.status(200).json({
      token,
      partnerAdmin: shapePartnerAdmin(partnerAdmin),
      tenant: {
        id: req.tenant._id,
        name: req.tenant.name,
        slug: req.tenant.slug,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/me", requireRestaurantPartnerAdmin, async (req, res) => {
  res.status(200).json({
    partnerAdmin: shapePartnerAdmin(req.restaurantPartnerAdmin),
    tenant: {
      id: req.tenant._id,
      name: req.tenant.name,
      slug: req.tenant.slug,
    },
  });
});

router.use(requireRestaurantPartnerAdmin);

router.get("/restaurants", async (req, res) => {
  try {
    const restaurants = await Restaurant.find({
      tenantId: req.tenantId,
      _id: { $in: req.restaurantPartnerAdmin.restaurantIds || [] },
    })
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({ restaurants });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get("/restaurants/:restaurantId/reservations", async (req, res) => {
  try {
    assertPartnerRestaurantAccess(req, req.params.restaurantId);
    const query = {
      tenantId: req.tenantId,
      restaurantId: req.params.restaurantId,
    };
    const [serviceWindows, tableTypes, availabilityEntries, reservationRequests] =
      await Promise.all([
        RestaurantServiceWindow.find(query).sort({ serviceType: 1, label: 1 }).lean(),
        RestaurantTableType.find(query).sort({ minGuests: 1, label: 1 }).lean(),
        RestaurantAvailabilityEntry.find(query).sort({ date: 1 }).limit(120).lean(),
        RestaurantReservationRequest.find(query).sort({ createdAt: -1 }).limit(100).lean(),
      ]);

    return res.status(200).json({
      serviceWindows,
      tableTypes,
      availabilityEntries,
      reservationRequests: reservationRequests.map(shapeReservationRequest),
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post("/restaurants/:restaurantId/service-windows", async (req, res) => {
  try {
    assertPartnerRestaurantAccess(req, req.params.restaurantId);
    const payload = normalizeServiceWindowPayload(req.body);
    if (!payload.label) {
      return res.status(400).json({ message: "Service window label is required." });
    }

    const serviceWindow = await RestaurantServiceWindow.create({
      ...payload,
      tenantId: req.tenantId,
      restaurantId: req.params.restaurantId,
    });

    return res.status(201).json(serviceWindow);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
});

router.patch("/service-windows/:id", async (req, res) => {
  try {
    const existing = await RestaurantServiceWindow.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!existing) {
      return res.status(404).json({ message: "Service window not found." });
    }

    assertPartnerRestaurantAccess(req, existing.restaurantId);
    Object.assign(existing, normalizeServiceWindowPayload(req.body));
    await existing.save();

    return res.status(200).json(existing);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
});

router.post("/restaurants/:restaurantId/table-types", async (req, res) => {
  try {
    assertPartnerRestaurantAccess(req, req.params.restaurantId);
    const payload = normalizeTableTypePayload(req.body);
    if (!payload.label) {
      return res.status(400).json({ message: "Table type label is required." });
    }

    const tableType = await RestaurantTableType.create({
      ...payload,
      tenantId: req.tenantId,
      restaurantId: req.params.restaurantId,
    });

    return res.status(201).json(tableType);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
});

router.patch("/table-types/:id", async (req, res) => {
  try {
    const existing = await RestaurantTableType.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!existing) {
      return res.status(404).json({ message: "Table type not found." });
    }

    assertPartnerRestaurantAccess(req, existing.restaurantId);
    Object.assign(existing, normalizeTableTypePayload(req.body));
    await existing.save();

    return res.status(200).json(existing);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
});

router.get("/restaurants/:restaurantId/menu", async (req, res) => {
  try {
    assertPartnerRestaurantAccess(req, req.params.restaurantId);
    const query = {
      tenantId: req.tenantId,
      restaurantId: req.params.restaurantId,
    };

    const [sections, items] = await Promise.all([
      RestaurantMenuSection.find(query).sort({ displayOrder: 1, title: 1 }).lean(),
      RestaurantMenuItem.find(query).sort({ featured: -1, groupFriendly: -1, name: 1 }).lean(),
    ]);

    return res.status(200).json({ sections, items });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post("/restaurants/:restaurantId/menu/sections", async (req, res) => {
  try {
    assertPartnerRestaurantAccess(req, req.params.restaurantId);
    const payload = normalizeMenuSectionPayload(req.body);
    if (!payload.title) {
      return res.status(400).json({ message: "Menu section title is required." });
    }

    const section = await RestaurantMenuSection.create({
      ...payload,
      tenantId: req.tenantId,
      restaurantId: req.params.restaurantId,
    });

    return res.status(201).json(section);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
});

router.post("/restaurants/:restaurantId/menu/items", async (req, res) => {
  try {
    assertPartnerRestaurantAccess(req, req.params.restaurantId);
    const payload = normalizeMenuItemPayload(req.body);
    if (!payload.name) {
      return res.status(400).json({ message: "Menu item name is required." });
    }

    const item = await RestaurantMenuItem.create({
      ...payload,
      tenantId: req.tenantId,
      restaurantId: req.params.restaurantId,
    });

    return res.status(201).json(item);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
});

router.patch("/menu-sections/:id", async (req, res) => {
  try {
    const section = await RestaurantMenuSection.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!section) {
      return res.status(404).json({ message: "Menu section not found." });
    }

    assertPartnerRestaurantAccess(req, section.restaurantId);
    Object.assign(section, normalizeMenuSectionPayload(req.body));
    await section.save();

    return res.status(200).json(section);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
});

router.delete("/menu-sections/:id", async (req, res) => {
  try {
    const section = await RestaurantMenuSection.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!section) {
      return res.status(404).json({ message: "Menu section not found." });
    }

    assertPartnerRestaurantAccess(req, section.restaurantId);

    // Unlink items belonging to this section
    await RestaurantMenuItem.updateMany(
      { sectionId: req.params.id, tenantId: req.tenantId },
      { $set: { sectionId: null } }
    ).catch(() => {});

    await RestaurantMenuSection.deleteOne({ _id: req.params.id });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.patch("/menu-items/:id", async (req, res) => {
  try {
    const item = await RestaurantMenuItem.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!item) {
      return res.status(404).json({ message: "Menu item not found." });
    }

    assertPartnerRestaurantAccess(req, item.restaurantId);
    Object.assign(item, normalizeMenuItemPayload(req.body));
    await item.save();

    return res.status(200).json(item);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
});

router.delete("/menu-items/:id", async (req, res) => {
  try {
    const item = await RestaurantMenuItem.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!item) {
      return res.status(404).json({ message: "Menu item not found." });
    }

    assertPartnerRestaurantAccess(req, item.restaurantId);
    await RestaurantMenuItem.deleteOne({ _id: req.params.id });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
});

router.post("/restaurants/:restaurantId/availability", async (req, res) => {
  try {
    assertPartnerRestaurantAccess(req, req.params.restaurantId);
    const payload = normalizeAvailabilityPayload(req.body);
    if (!payload.date) {
      return res.status(400).json({ message: "Availability date is required." });
    }

    const availability = await RestaurantAvailabilityEntry.create({
      ...payload,
      tenantId: req.tenantId,
      restaurantId: req.params.restaurantId,
    });

    return res.status(201).json(availability);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
});

router.patch("/availability/:id", async (req, res) => {
  try {
    const existing = await RestaurantAvailabilityEntry.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!existing) {
      return res.status(404).json({ message: "Availability entry not found." });
    }

    assertPartnerRestaurantAccess(req, existing.restaurantId);
    Object.assign(existing, normalizeAvailabilityPayload(req.body));
    await existing.save();

    return res.status(200).json(existing);
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
});

router.patch("/reservation-requests/:id", async (req, res) => {
  try {
    const existing = await RestaurantReservationRequest.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!existing) {
      return res.status(404).json({ message: "Reservation request not found." });
    }

    assertPartnerRestaurantAccess(req, existing.restaurantId);
    Object.assign(existing, buildReservationStatusUpdate(req.body));
    await existing.save();

    return res.status(200).json({ request: shapeReservationRequest(existing.toObject()) });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
});

router.patch("/restaurants/:restaurantId/checkout-settings", async (req, res) => {
  try {
    assertPartnerRestaurantAccess(req, req.params.restaurantId);
    const settings = normalizeRestaurantCheckoutSettings(req.body);
    const restaurant = await Restaurant.findOneAndUpdate(
      {
        _id: req.params.restaurantId,
        tenantId: req.tenantId,
      },
      { $set: { restaurantCheckout: settings } },
      { new: true }
    ).lean();

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found." });
    }

    return res.status(200).json({ restaurantCheckout: restaurant.restaurantCheckout });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
});

router.post("/reservation-requests/:id/payment-request", async (req, res) => {
  try {
    const reservation = await RestaurantReservationRequest.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
    });

    if (!reservation) {
      return res.status(404).json({ message: "Reservation request not found." });
    }

    assertPartnerRestaurantAccess(req, reservation.restaurantId);

    const restaurant = await Restaurant.findOne({
      _id: reservation.restaurantId,
      tenantId: req.tenantId,
    }).lean();

    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found." });
    }

    const existingPayment = await PaymentTransaction.findOne({
      tenantId: req.tenantId,
      restaurantReservationRequestId: reservation._id,
      status: "pending",
    }).lean();

    if (isActiveRestaurantPaymentTransaction(existingPayment)) {
      return res.status(409).json({
        message: "An active payment request already exists for this reservation.",
        payment: existingPayment,
      });
    }

    const payment =
      req.body.paymentMode === "custom"
        ? validateCustomRestaurantPayment(req.body)
        : calculateRestaurantDepositAmount({
            settings: restaurant.restaurantCheckout,
            reservation,
          });

    const transaction = await PaymentTransaction.create(
      buildRestaurantPaymentTransactionPayload({
        tenantId: req.tenantId,
        restaurant,
        reservation,
        payment,
      })
    );

    Object.assign(
      reservation,
      buildReservationPaymentUpdate({
        transaction,
        paymentReason: payment.paymentReason,
        paymentInstructions: payment.paymentInstructions,
      })
    );
    await reservation.save();

    return res.status(201).json({
      payment: transaction,
      request: shapeReservationRequest(reservation.toObject()),
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ message: error.message });
  }
});

export default router;
