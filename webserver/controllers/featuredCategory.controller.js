import FeaturedCategoryModel from "../models/featuredCategory.model.js";
import ProductModel from "../models/product.model.js";

// Add a new featured category
export const addFeaturedCategoryController = async (request, response) => {
    try {
        const { name, image, coverImage, description, products, displayOrder } = request.body;

        if (!name || !image) {
            return response.status(400).json({
                message: "Name and image are required fields",
                error: true,
                success: false
            });
        }

        const addFeaturedCategory = new FeaturedCategoryModel({
            name,
            image,
            coverImage: coverImage || "",
            description: description || "",
            products: products || [],
            displayOrder: displayOrder || 0
        });

        const saveFeaturedCategory = await addFeaturedCategory.save();

        if (!saveFeaturedCategory) {
            return response.status(500).json({
                message: "Failed to create featured category",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "Featured category created successfully",
            data: saveFeaturedCategory,
            success: true,
            error: false
        });

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Get all featured categories
export const getFeaturedCategoriesController = async (request, response) => {
    try {
        const data = await FeaturedCategoryModel.find()
            .populate('products', 'name image price discount stock hasVariations variations')
            .sort({ displayOrder: 1, createdAt: -1 });

        return response.json({
            data: data,
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

// Get a single featured category by ID
export const getFeaturedCategoryByIdController = async (request, response) => {
    try {
        const { id } = request.params;

        const featuredCategory = await FeaturedCategoryModel.findById(id)
            .populate('products', 'name image price discount stock hasVariations variations');

        if (!featuredCategory) {
            return response.status(404).json({
                message: "Featured category not found",
                error: true,
                success: false
            });
        }

        return response.json({
            data: featuredCategory,
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

// Update a featured category
export const updateFeaturedCategoryController = async (request, response) => {
    try {
        const { _id, name, image, coverImage, description, products, displayOrder, active } = request.body;

        if (!_id) {
            return response.status(400).json({
                message: "Featured category ID is required",
                error: true,
                success: false
            });
        }

        // Get all featured categories and sort them by display order
        const featuredCategories = await FeaturedCategoryModel.find().sort({ displayOrder: 1 });
        
        // Get the featured category we're updating
        const currentFeaturedCategory = featuredCategories.find(cat => cat._id.toString() === _id);
        
        if (!currentFeaturedCategory) {
            return response.status(404).json({
                message: "Featured category not found",
                error: true,
                success: false
            });
        }

        const currentOrder = currentFeaturedCategory.displayOrder;
        const newOrder = Number(displayOrder);

        // Update all affected featured categories' display order if order has changed
        if (currentOrder !== newOrder) {
            if (newOrder > currentOrder) {
                // Moving to a higher number - shift categories down
                await FeaturedCategoryModel.updateMany(
                    { 
                        displayOrder: { $gt: currentOrder, $lte: newOrder },
                        _id: { $ne: _id }
                    },
                    { $inc: { displayOrder: -1 } }
                );
            } else {
                // Moving to a lower number - shift categories up
                await FeaturedCategoryModel.updateMany(
                    { 
                        displayOrder: { $gte: newOrder, $lt: currentOrder },
                        _id: { $ne: _id }
                    },
                    { $inc: { displayOrder: 1 } }
                );
            }
        }

        // Update the target featured category
        const update = await FeaturedCategoryModel.findByIdAndUpdate(
            _id,
            { 
                name, 
                image, 
                coverImage,
                description, 
                products,
                displayOrder: newOrder,
                active
            },
            { new: true }
        );

        // Get all featured categories after update to send back updated order
        const updatedFeaturedCategories = await FeaturedCategoryModel.find()
            .populate('products', 'name image price discount stock hasVariations variations')
            .sort({ displayOrder: 1 });

        return response.json({
            message: "Featured category updated successfully",
            success: true,
            error: false,
            data: updatedFeaturedCategories
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Delete a featured category
export const deleteFeaturedCategoryController = async (request, response) => {
    try {
        const { _id } = request.body;

        if (!_id) {
            return response.status(400).json({
                message: "Featured category ID is required",
                error: true,
                success: false
            });
        }

        const deleteFeaturedCategory = await FeaturedCategoryModel.deleteOne({ _id: _id });

        return response.json({
            message: "Featured category deleted successfully",
            data: deleteFeaturedCategory,
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

// Get active featured categories for homepage
export const getActiveFeaturedCategoriesController = async (request, response) => {
    try {
        const data = await FeaturedCategoryModel.find({ active: true })
            .populate('products', 'name image price discount stock hasVariations variations')
            .sort({ displayOrder: 1 });

        return response.json({
            data: data,
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