import express from "express";
import {
    addVendorController,
    getVendorsController,
    getVendorByIdController,
    updateVendorController,
    deleteVendorController,
    getActiveVendorsController
} from "../controllers/vendor.controller.js";
import auth from "../middleware/auth.js";

const vendorRouter = express.Router();

// Add a new vendor (protected)
vendorRouter.post("/add", auth, addVendorController);

// Get all vendors (protected)
vendorRouter.get("/get-all", auth, getVendorsController);

// Get vendor by ID
vendorRouter.get("/get/:id", getVendorByIdController);

// Get vendor by ID (POST method)
vendorRouter.post("/get-by-id", getVendorByIdController);

// Update vendor (protected)
vendorRouter.put("/update", auth, updateVendorController);

// Delete vendor (protected)
vendorRouter.delete("/delete", auth, deleteVendorController);

// Get active vendors (public)
vendorRouter.get("/get-active", getActiveVendorsController);

export default vendorRouter; 