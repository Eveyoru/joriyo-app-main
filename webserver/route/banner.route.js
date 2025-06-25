import { Router } from 'express';
import auth from '../middleware/auth.js';
import { 
    addBannerController, 
    getBannersController, 
    getActiveBannersController,
    updateBannerController, 
    deleteBannerController 
} from '../controllers/banner.controller.js';

const bannerRouter = Router();

bannerRouter.post("/add", auth, addBannerController);
bannerRouter.get('/get', getBannersController);
bannerRouter.get('/get-active', getActiveBannersController);
bannerRouter.put('/update', auth, updateBannerController);
bannerRouter.delete("/delete", auth, deleteBannerController);

export default bannerRouter;
