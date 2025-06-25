import { Router } from 'express'
import auth from '../middleware/auth.js'
import { admin } from '../middleware/Admin.js'
import { 
    CashOnDeliveryOrderController, 
    getOrderDetailsController, 
    getAllOrdersController, 
    paymentController, 
    webhookStripe, 
    getSingleOrderController,
    updateOrderStatusController,
    updateOrderStatusByIdController,
    legacyUpdateOrderStatusController 
} from '../controllers/order.controller.js'

const orderRouter = Router()

// Direct routes - place these before any nested routes for better matching
orderRouter.put("/update-status/:orderId", auth, admin, updateOrderStatusByIdController)

// Order creation and payment routes
orderRouter.post("/cash-on-delivery", auth, CashOnDeliveryOrderController)
orderRouter.post('/checkout', auth, paymentController)
orderRouter.post('/webhook', webhookStripe)

// Order listing routes
orderRouter.get("/order-list", auth, getOrderDetailsController)
orderRouter.get("/all", auth, admin, getAllOrdersController)
orderRouter.get("/details/:id", auth, getSingleOrderController)

// Legacy/alternative routes - keep these for backward compatibility
orderRouter.put("/admin/update-status/:orderId", auth, admin, updateOrderStatusByIdController)

export default orderRouter