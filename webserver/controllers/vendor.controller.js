import VendorModel from "../models/vendor.model.js";

// Add a new vendor
export const addVendorController = async (request, response) => {
    try {
        const { name, description, imageUrl, coverImageUrl, status, displayOrder, products } = request.body;
        
        console.log("Add vendor request body:", request.body);

        // Validate required fields
        if (!name || !imageUrl) {
            return response.status(400).json({
                success: false,
                message: 'Vendor name and image are required fields'
            });
        }

        // Create new vendor
        const newVendor = new VendorModel({
            name,
            description,
            imageUrl,
            coverImageUrl,
            status: status !== undefined ? status : true,
            displayOrder: displayOrder || 0,
            products: products || []
        });

        // Save to database
        await newVendor.save();

        return response.status(201).json({
            success: true,
            message: 'Vendor added successfully',
            data: newVendor
        });
    } catch (error) {
        console.error('Error adding vendor:', error);
        return response.status(500).json({
            success: false,
            message: 'Failed to add vendor',
            error: error.message
        });
    }
};

// Get all vendors
export const getVendorsController = async (request, response) => {
    try {
        const vendors = await VendorModel.find({}).sort({ displayOrder: 1 });
        
        return response.status(200).json({
            success: true,
            message: 'Vendors retrieved successfully',
            data: vendors
        });
    } catch (error) {
        console.error('Error retrieving vendors:', error);
        return response.status(500).json({
            success: false,
            message: 'Failed to retrieve vendors',
            error: error.message
        });
    }
};

// Get active vendors
export const getActiveVendorsController = async (request, response) => {
    try {
        const vendors = await VendorModel.find({ status: true }).sort({ displayOrder: 1 });
        
        return response.status(200).json({
            success: true,
            message: 'Active vendors retrieved successfully',
            data: vendors
        });
    } catch (error) {
        console.error('Error retrieving active vendors:', error);
        return response.status(500).json({
            success: false,
            message: 'Failed to retrieve active vendors',
            error: error.message
        });
    }
};

// Get a vendor by ID
export const getVendorByIdController = async (request, response) => {
    try {
        // Get ID from either params (GET) or body (POST)
        const id = request.params.id || request.body._id;
        
        if (!id) {
            return response.status(400).json({
                message: "Vendor ID is required",
                error: true,
                success: false
            });
        }
        
        const vendor = await VendorModel.findById(id);

        if (!vendor) {
            return response.status(404).json({
                message: "Vendor not found",
                error: true,
                success: false
            });
        }

        return response.json({
            data: vendor,
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Update a vendor
export const updateVendorController = async (request, response) => {
    try {
        const { _id, displayOrder } = request.body;
        
        console.log("Update vendor request body:", request.body);

        if (!_id) {
            return response.status(400).json({
                message: "Vendor ID is required",
                error: true,
                success: false
            });
        }

        // Get all vendors and sort them by display order
        const vendors = await VendorModel.find().sort({ displayOrder: 1 });
        
        // Get the vendor we're updating
        const currentVendor = vendors.find(v => v._id.toString() === _id);
        
        if (!currentVendor) {
            return response.status(404).json({
                message: "Vendor not found",
                error: true,
                success: false
            });
        }

        const currentOrder = currentVendor.displayOrder;
        const newOrder = Number(displayOrder);

        // Update all affected vendors' display order if order has changed
        if (currentOrder !== newOrder) {
            if (newOrder > currentOrder) {
                // Moving to a higher number - shift vendors down
                await VendorModel.updateMany(
                    { 
                        displayOrder: { $gt: currentOrder, $lte: newOrder },
                        _id: { $ne: _id }
                    },
                    { $inc: { displayOrder: -1 } }
                );
            } else {
                // Moving to a lower number - shift vendors up
                await VendorModel.updateMany(
                    { 
                        displayOrder: { $gte: newOrder, $lt: currentOrder },
                        _id: { $ne: _id }
                    },
                    { $inc: { displayOrder: 1 } }
                );
            }
        }

        // Update the target vendor with all fields from request body
        const update = await VendorModel.findByIdAndUpdate(
            _id,
            request.body,
            { new: true }
        );

        // Get all vendors after update to send back updated order
        const updatedVendors = await VendorModel.find()
            .sort({ displayOrder: 1 });

        return response.json({
            message: "Vendor updated successfully",
            success: true,
            error: false,
            data: updatedVendors
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Delete a vendor
export const deleteVendorController = async (request, response) => {
    try {
        const { _id } = request.body;

        if (!_id) {
            return response.status(400).json({
                message: "Vendor ID is required",
                error: true,
                success: false
            });
        }

        const deleteVendor = await VendorModel.deleteOne({ _id: _id });

        return response.json({
            message: "Vendor deleted successfully",
            data: deleteVendor,
            error: false,
            success: true
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            success: false,
            error: true
        });
    }
}; 