import express from "express";
import DynamicPricingRule from "../models/DynamicPricingRule.js";
import { requireTenantAdmin } from "../middleware/adminAuthMiddleware.js";
import { requireSubscriptionFeature } from "../middleware/subscriptionAccessMiddleware.js";
import { calculateDynamicPricePreview } from "../utils/dynamicPricingEngine.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";

const router = express.Router();

router.use(requireTenantAdmin);
router.use(requireSubscriptionFeature("dynamic-pricing-engine"));

router.get("/", async (req, res) => {
  try {
    const rules = await DynamicPricingRule.find(buildTenantFilter(req))
      .sort({ updatedAt: -1 })
      .lean();

    res.status(200).json(
      rules.map((rule) => ({
        ...rule,
        preview: calculateDynamicPricePreview(rule),
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const rule = new DynamicPricingRule(
      withTenantId(req, {
        ruleName: req.body.ruleName,
        routeLabel: req.body.routeLabel,
        seasonMultiplier: req.body.seasonMultiplier,
        demandMultiplier: req.body.demandMultiplier,
        occupancyMultiplier: req.body.occupancyMultiplier,
        minimumPrice: req.body.minimumPrice,
        basePrice: req.body.basePrice,
        status: req.body.status,
        notes: req.body.notes,
      })
    );

    await rule.save();

    res.status(201).json({
      ...rule.toObject(),
      preview: calculateDynamicPricePreview(rule.toObject()),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const updates = {
      ruleName: req.body.ruleName,
      routeLabel: req.body.routeLabel,
      seasonMultiplier: req.body.seasonMultiplier,
      demandMultiplier: req.body.demandMultiplier,
      occupancyMultiplier: req.body.occupancyMultiplier,
      minimumPrice: req.body.minimumPrice,
      basePrice: req.body.basePrice,
      status: req.body.status,
      notes: req.body.notes,
    };

    Object.keys(updates).forEach((key) => {
      if (updates[key] === undefined) {
        delete updates[key];
      }
    });

    const rule = await DynamicPricingRule.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      { $set: updates },
      { new: true }
    ).lean();

    if (!rule) {
      return res.status(404).json({ message: "Dynamic pricing rule not found" });
    }

    res.status(200).json({
      ...rule,
      preview: calculateDynamicPricePreview(rule),
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const rule = await DynamicPricingRule.findOneAndDelete(
      buildTenantFilter(req, { _id: req.params.id })
    ).lean();

    if (!rule) {
      return res.status(404).json({ message: "Dynamic pricing rule not found" });
    }

    res.status(200).json({ message: "Dynamic pricing rule deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
