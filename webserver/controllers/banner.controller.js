import BannerModel from "../models/banner.model.js";

export const addBannerController = async (request, response) => {
    try {
        const { title, image, description, link, isActive, displayOrder } = request.body;

        if (!title || !image) {
            return response.status(400).json({
                message: "Title and image are required fields",
                error: true,
                success: false
            });
        }

        const addBanner = new BannerModel({
            title,
            image,
            description: description || "",
            link: link || "",
            isActive: isActive !== undefined ? isActive : true,
            displayOrder: displayOrder || 0
        });

        const saveBanner = await addBanner.save();

        if (!saveBanner) {
            return response.status(500).json({
                message: "Banner not created",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "Banner added successfully",
            data: saveBanner,
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

export const getBannersController = async (request, response) => {
    try {
        const data = await BannerModel.find().sort({ displayOrder: 1, createdAt: -1 });

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

export const getActiveBannersController = async (request, response) => {
    try {
        const data = await BannerModel.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 });

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

export const updateBannerController = async (request, response) => {
    try {
        const { _id, title, image, description, link, isActive, displayOrder } = request.body;

        if (!_id) {
            return response.status(400).json({
                message: "Banner ID is required",
                error: true,
                success: false
            });
        }

        const update = await BannerModel.updateOne(
            { _id: _id },
            { 
                title, 
                image,
                description,
                link,
                isActive,
                displayOrder
            }
        );

        return response.json({
            message: "Banner updated successfully",
            success: true,
            error: false,
            data: update
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const deleteBannerController = async (request, response) => {
    try {
        const { _id } = request.body;

        if (!_id) {
            return response.status(400).json({
                message: "Banner ID is required",
                error: true,
                success: false
            });
        }

        const deleteBanner = await BannerModel.deleteOne({ _id: _id });

        return response.json({
            message: "Banner deleted successfully",
            data: deleteBanner,
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
