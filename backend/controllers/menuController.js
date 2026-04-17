import MenuItem from "../models/MenuItem.js";
import { defaultMenuItems } from "../data/defaultMenuItems.js";
import { buildTenantFilter, withTenantId } from "../utils/tenantContext.js";

const sortMenu = (items) =>
  items
    .map((item) => ({
      ...item,
      children: [...(item.children || [])].sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
      ),
    }))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

export const getMenuItems = async (req, res) => {
  try {
    const items = await MenuItem.find(buildTenantFilter(req)).lean();
    if (!items.length) {
      return res.status(200).json(sortMenu(defaultMenuItems));
    }
    res.status(200).json(sortMenu(items));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createMenuItem = async (req, res) => {
  try {
    const menuItem = new MenuItem(withTenantId(req, req.body));
    await menuItem.save();
    res.status(201).json(menuItem);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    await MenuItem.findOneAndDelete(buildTenantFilter(req, { _id: req.params.id }));
    res.status(200).json({ message: "Menu item deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetMenuItems = async (req, res) => {
  try {
    await MenuItem.deleteMany(buildTenantFilter(req));
    const created = await MenuItem.insertMany(
      defaultMenuItems.map((item) => withTenantId(req, item))
    );
    res.status(200).json(sortMenu(created.map((item) => item.toObject())));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const updated = await MenuItem.findOneAndUpdate(
      buildTenantFilter(req, { _id: req.params.id }),
      req.body,
      {
        new: true,
      }
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
