import CategoryModel from "../models/category.model.js";
import SubCategoryModel from "../models/subCategory.model.js";
import ProductModel from "../models/product.model.js";

export const AddCategoryController = async(request,response)=>{
    try {
        const { name, image, displayOrder } = request.body 

        if(!name || !image){
            return response.status(400).json({
                message : "Enter required fields",
                error : true,
                success : false
            })
        }

        const addCategory = new CategoryModel({
            name,
            image,
            displayOrder: displayOrder || 0
        })

        const saveCategory = await addCategory.save()

        if(!saveCategory){
            return response.status(500).json({
                message : "Not Created",
                error : true,
                success : false
            })
        }

        return response.json({
            message : "Add Category",
            data : saveCategory,
            success : true,
            error : false
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const getCategoryController = async(request,response)=>{
    try {
        const data = await CategoryModel.find().sort({ displayOrder: 1, createdAt: -1 })

        return response.json({
            data: data,
            error: false,
            success: true
        })
    } catch (error) {
        return response.status(500).json({
            message: error.messsage || error,
            error: true,
            success: false
        })
    }
}

export const updateCategoryController = async(request,response)=>{
    try {
        const { _id, name, image, displayOrder } = request.body;

        // Get all categories and sort them by display order
        const categories = await CategoryModel.find().sort({ displayOrder: 1 });
        
        // Get the category we're updating
        const currentCategory = categories.find(cat => cat._id.toString() === _id);
        const currentOrder = currentCategory.displayOrder;
        const newOrder = Number(displayOrder);

        // Update all affected categories
        if (currentOrder !== newOrder) {
            if (newOrder > currentOrder) {
                // Moving to a higher number - shift categories down
                await CategoryModel.updateMany(
                    { 
                        displayOrder: { $gt: currentOrder, $lte: newOrder },
                        _id: { $ne: _id }
                    },
                    { $inc: { displayOrder: -1 } }
                );
            } else {
                // Moving to a lower number - shift categories up
                await CategoryModel.updateMany(
                    { 
                        displayOrder: { $gte: newOrder, $lt: currentOrder },
                        _id: { $ne: _id }
                    },
                    { $inc: { displayOrder: 1 } }
                );
            }
        }

        // Update the target category
        const update = await CategoryModel.findByIdAndUpdate(
            _id,
            { name, image, displayOrder: newOrder },
            { new: true }
        );

        // Get all categories after update to send back updated order
        const updatedCategories = await CategoryModel.find().sort({ displayOrder: 1 });

        return response.json({
            message: "Updated Category",
            success: true,
            error: false,
            data: updatedCategories
        });
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
}

export const deleteCategoryController = async(request,response)=>{
    try {
        const { _id } = request.body 

        const checkSubCategory = await SubCategoryModel.find({
            category : {
                "$in" : [ _id ]
            }
        }).countDocuments()

        const checkProduct = await ProductModel.find({
            category : {
                "$in" : [ _id ]
            }
        }).countDocuments()

        if(checkSubCategory >  0 || checkProduct > 0 ){
            return response.status(400).json({
                message : "Category is already use can't delete",
                error : true,
                success : false
            })
        }

        const deleteCategory = await CategoryModel.deleteOne({ _id : _id})

        return response.json({
            message : "Delete category successfully",
            data : deleteCategory,
            error : false,
            success : true
        })

    } catch (error) {
       return response.status(500).json({
            message : error.message || error,
            success : false,
            error : true
       }) 
    }
}

// Add controller to get only active categories
export const getActiveCategoryController = async(request, response) => {
    try {
        const data = await CategoryModel.find({ active: true }).sort({ displayOrder: 1, createdAt: -1 });

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
}