import { Router } from 'express';
import auth from '../middleware/auth.js';
import { 
    addFeaturedCategoryController, 
    deleteFeaturedCategoryController, 
    getActiveFeaturedCategoriesController, 
    getFeaturedCategoriesController, 
    getFeaturedCategoryByIdController, 
    updateFeaturedCategoryController 
} from '../controllers/featuredCategory.controller.js';

const featuredCategoryRouter = Router();

// Create a new featured category (admin only)
featuredCategoryRouter.post("/add", auth, addFeaturedCategoryController);

// Get all featured categories (admin panel)
featuredCategoryRouter.get("/get-all", auth, getFeaturedCategoriesController);

// Get a single featured category by ID
featuredCategoryRouter.get("/get/:id", getFeaturedCategoryByIdController);

// Get active featured categories (for homepage)
featuredCategoryRouter.get("/get-active", getActiveFeaturedCategoriesController);

// Update a featured category (admin only)
featuredCategoryRouter.put("/update", auth, updateFeaturedCategoryController);

// Delete a featured category (admin only)
featuredCategoryRouter.delete("/delete", auth, deleteFeaturedCategoryController);

export default featuredCategoryRouter; 