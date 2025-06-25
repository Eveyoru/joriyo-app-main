import Stripe from "../config/stripe.js";
import CartProductModel from "../models/cartproduct.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import ProductModel from "../models/product.model.js";
import mongoose from "mongoose";

export async function CashOnDeliveryOrderController(request,response){
    try {
        const userId = request.userId // auth middleware 
        const { list_items, totalAmt, addressId, subTotalAmt } = request.body 

        console.log('Creating new order:', { userId, totalAmt, addressId });

        if (!list_items || !list_items.length) {
            return response.status(400).json({
                message: "No items in order",
                error: true,
                success: false
            });
        }

        // Verify stock availability for all products
        const stockCheckPromises = list_items.map(async (item) => {
            const product = await ProductModel.findById(item.productId._id);
            if (!product) {
                return {
                    isAvailable: false,
                    message: `Product ${item.productId.name} not found`
                };
            }
            
            // Handle products with variations
            if (product.hasVariations && item.variationId) {
                const variation = product.variations.id(item.variationId);
                if (!variation) {
                    return {
                        isAvailable: false,
                        message: `Selected variation for ${product.name} not found`
                    };
                }
                
                if (variation.stock < item.quantity) {
                    return {
                        isAvailable: false,
                        message: `Only ${variation.stock} units of ${product.name} (${variation.size}) available in stock`
                    };
                }
                
                return { 
                    isAvailable: true, 
                    product,
                    variation,
                    hasVariation: true
                };
            }
            // Handle standard products
            else if (product.stock !== null && product.stock < item.quantity) {
                return {
                    isAvailable: false,
                    message: `Only ${product.stock} units of ${product.name} available in stock`
                };
            }
            
            return { isAvailable: true, product, hasVariation: false };
        });
        
        const stockCheckResults = await Promise.all(stockCheckPromises);
        const unavailableItems = stockCheckResults.filter(item => !item.isAvailable);
        
        if (unavailableItems.length > 0) {
            return response.status(400).json({
                message: unavailableItems[0].message,
                error: true,
                success: false
            });
        }

        // Create a single order ID for all items
        const orderId = `ORD-${new mongoose.Types.ObjectId()}`;
        
        // Map products to the new structure
        const products = list_items.map(el => {
            // Base product info
            const product = {
                productId: el.productId._id,
                name: el.productId.name,
                image: el.productId.image,
                quantity: el.quantity,
            };
            
            // Add variation details if present
            if (el.variationId) {
                const variation = el.productId.variations.find(v => 
                    v._id.toString() === el.variationId.toString()
                );
                
                if (variation) {
                    product.variationId = el.variationId;
                    product.selectedSize = el.selectedSize || variation.size;
                    product.price = pricewithDiscount(variation.price, el.productId.discount);
                } else {
                    product.price = pricewithDiscount(el.productId.price, el.productId.discount);
                }
            } else {
                product.price = pricewithDiscount(el.productId.price, el.productId.discount);
            }
            
            return product;
        });

        // Create a single order with all products
        const orderData = {
            userId: userId,
            orderId: orderId,
            products: products,
            paymentId: "",
            payment_status: "CASH ON DELIVERY",
            status: "pending",
            delivery_address: addressId,
            subTotalAmt: subTotalAmt,
            totalAmt: totalAmt,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        console.log('Order data to be saved:', orderData);

        // Create the order with proper error handling
        const generatedOrder = await OrderModel.create(orderData);
        if (!generatedOrder) {
            console.error('Failed to create order in database');
            return response.status(500).json({
                message: "Failed to create order",
                error: true,
                success: false
            });
        }

        console.log('Order created successfully:', generatedOrder._id);

        // Populate the order with user and address details
        const populatedOrder = await OrderModel.findById(generatedOrder._id)
            .populate('userId', 'name email')
            .populate('delivery_address');

        if (!populatedOrder) {
            console.error('Failed to populate order details');
            return response.status(500).json({
                message: "Failed to retrieve order details",
                error: true,
                success: false
            });
        }

        // Update stock for all products in the order
        const stockUpdatePromises = stockCheckResults.map(async (item, index) => {
            const orderItem = list_items[index];
            const quantity = orderItem.quantity;

            // Update variation stock if applicable
            if (item.hasVariation && item.variation) {
                // Find the product and update the variation by ID
                return ProductModel.updateOne(
                    { 
                        _id: item.product._id,
                        'variations._id': item.variation._id 
                    },
                    { 
                        $inc: { 'variations.$.stock': -quantity }
                    }
                );
            } 
            // Update regular product stock
            else if (!item.hasVariation && item.product.stock !== null) {
                return ProductModel.findByIdAndUpdate(
                    item.product._id, 
                    { $inc: { stock: -quantity } },
                    { new: true }
                );
            }
            
            // If neither apply, return a resolved promise to avoid breaking the Promise.all
            return Promise.resolve();
        });
        
        await Promise.all(stockUpdatePromises);

        // Remove items from cart
        try {
            await CartProductModel.deleteMany({ userId: userId });
            await UserModel.updateOne({ _id: userId }, { shopping_cart: [] });
            console.log('Cart cleared successfully');
        } catch (cartError) {
            console.error('Error clearing cart:', cartError);
            // Don't fail the order creation if cart clearing fails
        }

        console.log('Order process completed successfully');
        return response.json({
            message: "Order created successfully",
            error: false,
            success: true,
            data: populatedOrder
        });

    } catch (error) {
        console.error('Error in CashOnDeliveryOrderController:', error);
        return response.status(500).json({
            message: error.message || "Failed to create order",
            error: true,
            success: false
        });
    }
}

function pricewithDiscount(price, dis = 0) {
    if (!price) return 0;
    if (!dis || dis === 0) return price;
    return price - (price * (dis/100));
}

export async function paymentController(request,response){
    try {
        const userId = request.userId // auth middleware 
        const { list_items, totalAmt, addressId, subTotalAmt } = request.body 

        if(!list_items?.length || !totalAmt || !addressId){
            return response.status(400).json({
                message : "Provide list_items, totalAmt, addressId",
                error : true,
                success : false
            })
        }

        // Verify stock availability for all products
        const stockCheckPromises = list_items.map(async (item) => {
            const product = await ProductModel.findById(item.productId._id);
            if (!product) {
                return {
                    isAvailable: false,
                    message: `Product ${item.productId.name} not found`
                };
            }
            
            // Handle products with variations
            if (product.hasVariations && item.variationId) {
                const variation = product.variations.id(item.variationId);
                if (!variation) {
                    return {
                        isAvailable: false,
                        message: `Selected variation for ${product.name} not found`
                    };
                }
                
                if (variation.stock < item.quantity) {
                    return {
                        isAvailable: false,
                        message: `Only ${variation.stock} units of ${product.name} (${variation.size}) available in stock`
                    };
                }
                
                return { 
                    isAvailable: true, 
                    product,
                    variation,
                    hasVariation: true
                };
            }
            // Handle standard products
            else if (product.stock !== null && product.stock < item.quantity) {
                return {
                    isAvailable: false,
                    message: `Only ${product.stock} units of ${product.name} available in stock`
                };
            }
            
            return { isAvailable: true, product, hasVariation: false };
        });
        
        const stockCheckResults = await Promise.all(stockCheckPromises);
        const unavailableItems = stockCheckResults.filter(item => !item.isAvailable);
        
        if (unavailableItems.length > 0) {
            return response.status(400).json({
                message: unavailableItems[0].message,
                error: true,
                success: false
            });
        }

        const lineItems = list_items.map(el => {
            // Calculate price based on whether item has a variation
            let itemPrice;
            let itemName = el.productId.name;
            
            if (el.productId.hasVariations && el.variationId) {
                const variation = el.productId.variations.find(v => 
                    v._id.toString() === el.variationId.toString()
                );
                
                if (variation) {
                    itemPrice = pricewithDiscount(variation.price, el.productId.discount);
                    itemName = `${itemName} - ${el.selectedSize || variation.size}`;
                } else {
                    itemPrice = pricewithDiscount(el.productId.price, el.productId.discount);
                }
            } else {
                itemPrice = pricewithDiscount(el.productId.price, el.productId.discount);
            }
            
            return {
                price_data: {
                    currency: "inr",
                    product_data: {
                        name: itemName,
                        images: el.productId.image
                    },
                    unit_amount: Math.round(itemPrice * 100),
                },
                quantity: el.quantity,
            }
        });

        // Store product details with variation info
        const productDetails = list_items.map(el => {
            const item = {
                productId: el.productId._id,
                name: el.productId.name,
                image: el.productId.image,
                quantity: el.quantity,
            };
            
            if (el.variationId) {
                const variation = el.productId.variations.find(v => 
                    v._id.toString() === el.variationId.toString()
                );
                
                if (variation) {
                    item.variationId = el.variationId;
                    item.selectedSize = el.selectedSize || variation.size;
                    item.price = pricewithDiscount(variation.price, el.productId.discount);
                } else {
                    item.price = pricewithDiscount(el.productId.price, el.productId.discount);
                }
            } else {
                item.price = pricewithDiscount(el.productId.price, el.productId.discount);
            }
            
            return item;
        });

        const session = await Stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            mode: "payment",
            line_items: lineItems,
            success_url: `${process.env.CLIENT_URL}/success`,
            cancel_url: `${process.env.CLIENT_URL}/cancel`,
            metadata: {
                userId,
                addressId,
                totalAmt,
                subTotalAmt,
                lineItems: JSON.stringify(lineItems),
                productDetails: JSON.stringify(productDetails), // Include full product details with variation info
                stockCheck: JSON.stringify(stockCheckResults.map(item => ({ 
                    productId: item.product._id,
                    hasVariation: item.hasVariation,
                    variationId: item.variation ? item.variation._id : null
                })))
            }
        })

        return response.json({
            message: "Payment session created",
            error: false,
            success: true,
            data: {
                url: session.url
            }
        })

    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}


async function getOrderProductItems({
    products,
    userId,
    addressId,
    paymentId,
    payment_status,
    totalAmt,
    subTotalAmt
}) {
    try {
        // Create a single order ID
        const orderId = `ORD-${new mongoose.Types.ObjectId()}`;
        
        // Create the order with the provided products
        const orderData = {
            userId: userId,
            orderId: orderId,
            products: products,
            paymentId: paymentId || "",
            payment_status: payment_status || "",
            status: "pending",
            delivery_address: addressId,
            subTotalAmt: subTotalAmt,
            totalAmt: totalAmt,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        const orderGenerated = await OrderModel.create(orderData);
        return orderGenerated;
        
    } catch (error) {
        console.error('Error in getOrderProductItems:', error);
        throw error;
    }
}

// http://localhost:8080/api/order/webhook
export async function webhookStripe(request,response){
    try {
        const sig = request.headers['stripe-signature'];
        const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
        const event = Stripe.webhooks.constructEvent(request.body, sig, WEBHOOK_SECRET);
        
        if(event.type === 'checkout.session.completed'){
            const session = event.data.object;
            
            const {
                userId,
                addressId,
                totalAmt,
                subTotalAmt,
                productDetails,
                stockCheck
            } = session.metadata;
            
            // Parse the stored product details and stock check data from metadata
            let parsedProducts = [];
            let stockCheckData = [];
            
            try {
                parsedProducts = JSON.parse(productDetails || '[]');
                stockCheckData = JSON.parse(stockCheck || '[]');
            } catch (err) {
                console.error('Error parsing metadata:', err);
                throw new Error('Failed to parse order metadata: ' + err.message);
            }
            
            // Create a new order using the stored product details
            const generatedOrder = await getOrderProductItems({
                products: parsedProducts,
                userId: userId,
                addressId: addressId,
                totalAmt: totalAmt,
                subTotalAmt: subTotalAmt,
                paymentId: session.payment_intent,
                payment_status: "PAID"
            });

            // Update stock for all products
            if (stockCheckData && stockCheckData.length > 0) {
                const stockUpdatePromises = stockCheckData.map(async (item, index) => {
                    try {
                        const orderItem = parsedProducts[index];
                        if (!orderItem) {
                            console.error('No matching product found for stock update index:', index);
                            return Promise.resolve();
                        }
                        
                        const quantity = orderItem.quantity || 1;
                        
                        // Update variation stock if applicable
                        if (item.hasVariation && item.variationId) {
                            // Find the product and update the variation by ID
                            return ProductModel.updateOne(
                                { 
                                    _id: item.productId,
                                    'variations._id': item.variationId 
                                },
                                { 
                                    $inc: { 'variations.$.stock': -quantity }
                                }
                            );
                        } 
                        // Update regular product stock
                        else {
                            return ProductModel.findByIdAndUpdate(
                                item.productId, 
                                { $inc: { stock: -quantity } },
                                { new: true }
                            );
                        }
                    } catch (err) {
                        console.error('Error updating stock for item:', err);
                        return Promise.resolve(); // Continue with other updates even if one fails
                    }
                });
                
                await Promise.all(stockUpdatePromises);
            }

            // Clear user's cart
            try {
                await CartProductModel.deleteMany({ userId: userId });
                await UserModel.updateOne({ _id: userId }, { shopping_cart: [] });
            } catch (cartError) {
                console.error('Error clearing cart:', cartError);
                // Continue processing even if cart clearing fails
            }
        }

        response.json({received: true});

    } catch (error) {
        console.error('Error in webhookStripe:', error.message);
        return response.status(400).send(`Webhook Error: ${error.message}`);
    }
}

export async function getSingleOrderController(request, response) {
    try {
        const { id } = request.params; // Order ID
        console.log('Fetching single order details for ID:', id);

        // Try to find the order with this ID, populating all related entities
        const order = await OrderModel.findOne({ orderId: id })
            .populate('userId')
            .populate('delivery_address')
            .populate({
                path: 'products.productId',
                select: 'name price image discount hasVariations variations'
            })
            .lean();

        if (!order) {
            console.error('Order not found for ID:', id);
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false
            });
        }

        // Debug the products in the order
        console.log('Raw order products from DB:', JSON.stringify(order.products.map(p => ({
            name: p.name,
            variationId: p.variationId,
            selectedSize: p.selectedSize,
            productId: p.productId?._id
        })), null, 2));

        // Process and enhance the order data
        const enhancedOrder = {
            ...order,
            status: order.status || 'pending',
            payment_status: order.payment_status || 'pending',
            products: order.products.map(product => {
                const originalPrice = product.productId?.price || product.price || 0;
                const discount = product.productId?.discount || 0;
                const discountedPrice = pricewithDiscount(originalPrice, discount);
                const quantity = product.quantity || 1;
                const totalDiscountedPrice = discountedPrice * quantity;
                const totalOriginalPrice = originalPrice * quantity;
                const totalSaved = totalOriginalPrice - totalDiscountedPrice;

                // Handle variation information
                let size = null;
                if (product.selectedSize) {
                    size = product.selectedSize;
                } else if (product.size) {
                    size = product.size;
                } else if (product.variationId && product.productId?.variations) {
                    // Find the variation by ID
                    const variation = product.productId.variations.find(
                        v => v._id.toString() === product.variationId.toString()
                    );
                    if (variation) {
                        size = variation.size;
                    }
                }

                // Log for debugging
                console.log('Processing product in getSingleOrderController:', {
                    name: product.name || product.productId?.name || 'Unknown Product',
                    variationId: product.variationId,
                    selectedSize: product.selectedSize,
                    size: product.size,
                    foundSize: size
                });

                return {
                    id: product.productId?._id || product.productId,
                    name: product.name || product.productId?.name || 'Unknown Product',
                    image: product.image || product.productId?.image || [],
                    quantity: quantity,
                    originalPrice: originalPrice,
                    discount: discount,
                    discountedPrice: discountedPrice,
                    totalOriginalPrice: totalOriginalPrice,
                    totalDiscountedPrice: totalDiscountedPrice,
                    totalSaved: totalSaved,
                    // Include variation information (use all possible fields)
                    selectedSize: size || "XL", // Explicitly set XL if we couldn't find size elsewhere
                    size: size || "XL",
                    variationId: product.variationId || null
                };
            })
        };

        // Calculate total savings and amounts
        const totals = enhancedOrder.products.reduce((acc, product) => ({
            originalTotal: acc.originalTotal + product.totalOriginalPrice,
            discountedTotal: acc.discountedTotal + product.totalDiscountedPrice,
            totalSaved: acc.totalSaved + product.totalSaved
        }), { originalTotal: 0, discountedTotal: 0, totalSaved: 0 });

        enhancedOrder.subTotalAmt = totals.discountedTotal;
        enhancedOrder.totalAmt = totals.discountedTotal;
        enhancedOrder.originalTotalAmt = totals.originalTotal;
        enhancedOrder.totalSaved = totals.totalSaved;
        enhancedOrder.orderDate = order.createdAt;
        enhancedOrder.lastUpdated = order.updatedAt;

        // Add delivery address details
        if (enhancedOrder.delivery_address) {
            enhancedOrder.shippingAddress = {
                fullAddress: `${enhancedOrder.delivery_address.address_line}, ${enhancedOrder.delivery_address.city}, ${enhancedOrder.delivery_address.state} ${enhancedOrder.delivery_address.pincode}`,
                mobile: enhancedOrder.delivery_address.mobile
            };
        }

        console.log('Successfully fetched order details:', {
            orderId: enhancedOrder.orderId,
            totalProducts: enhancedOrder.products.length,
            totalAmount: enhancedOrder.totalAmt,
            totalSaved: enhancedOrder.totalSaved
        });

        return response.json({
            message: "Order details fetched successfully",
            data: enhancedOrder,
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Error in getSingleOrderController:', error);
        return response.status(500).json({
            message: error.message || "Server error",
            error: true,
            success: false
        });
    }
}

export async function getOrderDetailsController(request,response){
    try {
        const userId = request.userId // order id

        // Get all orders for this user
        const allOrders = await OrderModel.find({ userId : userId })
            .sort({ createdAt : -1 })
            .populate('delivery_address')
            .populate('products.productId', 'name price image discount hasVariations variations')

        // Group orders by orderId to prevent duplicates
        const uniqueOrderIds = [...new Set(allOrders.map(order => order.orderId))]
        const uniqueOrders = uniqueOrderIds.map(orderId => {
            const order = allOrders.find(order => order.orderId === orderId);
            
            // Process each order to calculate accurate totals with proper discounts
            if (order && order.products && Array.isArray(order.products)) {
                // Calculate the correct discounted totals
                let originalTotalAmt = 0;
                let discountedTotalAmt = 0;
                
                order.products.forEach(product => {
                    let price = product.price || 0;
                    const quantity = product.quantity || 1;
                    const discount = product.productId?.discount || 0;
                    
                    // Try to get variation price if applicable
                    if (product.variationId && product.productId?.variations) {
                        const variation = product.productId.variations.find(
                            v => v._id.toString() === product.variationId.toString()
                        );
                        if (variation) {
                            price = variation.price || price;
                        }
                    }
                    
                    // Calculate original and discounted prices
                    const originalPrice = price;
                    const discountedPrice = pricewithDiscount(price, discount);
                    
                    originalTotalAmt += originalPrice * quantity;
                    discountedTotalAmt += discountedPrice * quantity;
                });
                
                // Update the order with correct totals
                order.originalTotalAmt = originalTotalAmt;
                order.totalAmt = discountedTotalAmt;
                order.subTotalAmt = discountedTotalAmt;
                order.totalSaved = originalTotalAmt - discountedTotalAmt;
            }
            
            return order;
        });

        return response.json({
            message : "order list",
            data : uniqueOrders,
            error : false,
            success : true
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

// New controller function to get a single order by orderId
export async function getAllOrdersController(request, response) {
    try {
        console.log('Fetching all orders...');
        
        // Fetch all orders with proper sorting and population
        const orders = await OrderModel.find()
            .populate('userId', 'name email')
            .populate('delivery_address')
            .populate('products.productId', 'name price image discount hasVariations variations')
            .sort({ createdAt: -1 });
        
        console.log(`Found ${orders.length} orders in database`);
        
        // Log some details about the orders for debugging
        if (orders.length > 0) {
            console.log('Latest order:', {
                orderId: orders[0].orderId,
                status: orders[0].status,
                createdAt: orders[0].createdAt
            });
        }
        
        // Process orders to include complete product information
        const processedOrders = orders.map(order => {
            // Convert to plain object if it's a Mongoose document
            const plainOrder = order.toObject ? order.toObject() : order;
            
            // Process products to ensure they have complete information
            if (plainOrder.products && Array.isArray(plainOrder.products)) {
                let originalTotalAmt = 0;
                let discountedTotalAmt = 0;
                
                plainOrder.products = plainOrder.products.map(product => {
                    const productCopy = { ...product };
                    
                    // Ensure product name is available
                    if (product.productId && product.productId.name) {
                        productCopy.name = product.productId.name;
                    }
                    
                    // Ensure product image is available
                    if (product.productId && product.productId.image) {
                        productCopy.image = product.productId.image;
                    }
                    
                    let price = product.price || 0;
                    const quantity = product.quantity || 1;
                    const discount = product.productId?.discount || 0;
                    
                    // Add variation information
                    if (product.variationId && product.productId && product.productId.variations) {
                        const variation = product.productId.variations.find(
                            v => v._id.toString() === product.variationId.toString()
                        );
                        
                        if (variation) {
                            productCopy.selectedSize = variation.size;
                            productCopy.variationPrice = variation.price;
                            price = variation.price || price;
                        }
                    }
                    
                    // Calculate original and discounted prices
                    const originalPrice = price;
                    const discountedPrice = pricewithDiscount(price, discount);
                    
                    // Add calculated prices to product
                    productCopy.originalPrice = originalPrice;
                    productCopy.discountedPrice = discountedPrice;
                    
                    // Add to running totals
                    originalTotalAmt += originalPrice * quantity;
                    discountedTotalAmt += discountedPrice * quantity;
                    
                    return productCopy;
                });
                
                // Update order with calculated totals
                plainOrder.originalTotalAmt = originalTotalAmt;
                plainOrder.totalAmt = discountedTotalAmt;
                plainOrder.subTotalAmt = discountedTotalAmt;
                plainOrder.totalSaved = originalTotalAmt - discountedTotalAmt;
            }
            
            return plainOrder;
        });
        
        return response.json({
            message: "Orders fetched successfully",
            success: true,
            data: processedOrders
        });
    } catch (error) {
        console.error('Error in getAllOrdersController:', error);
        return response.status(500).json({
            message: error.message || "Failed to fetch orders",
            success: false,
            error: true
        });
    }
}

export async function updateOrderStatusByIdController(request, response) {
    try {
        console.log('----------------------------------------');
        console.log('UPDATE ORDER STATUS CONTROLLER CALLED');
        console.log('Request URL:', request.originalUrl);
        console.log('Request params:', request.params);
        console.log('Request body:', request.body);
        console.log('----------------------------------------');

        const { orderId } = request.params;
        const { status } = request.body;

        console.log('Received status update request:', { orderId, status });

        if (!orderId || !status) {
            console.log('Missing required fields for status update');
            return response.status(400).json({
                message: "Order ID and status are required",
                error: true,
                success: false
            });
        }

        // Validate status
        const validStatuses = ['pending', 'processing', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status.toLowerCase())) {
            console.log('Invalid status provided:', status);
            return response.status(400).json({
                message: "Invalid status. Must be one of: pending, processing, delivered, cancelled",
                error: true,
                success: false
            });
        }

        // First check if the order exists
        console.log('Finding order with ID:', orderId);
        
        // Try to find the order by _id first (MongoDB ObjectId)
        let existingOrder;
        
        try {
            // Check if the orderId is a valid MongoDB ObjectId
            const mongoose = await import('mongoose');
            const isValidObjectId = mongoose.default.isValidObjectId(orderId);
            
            if (isValidObjectId) {
                // If it's a valid ObjectId, look for the order by _id
                console.log('Looking for order by _id');
                existingOrder = await OrderModel.findById(orderId);
            }
            
            // If not found by _id, try orderId field
            if (!existingOrder) {
                console.log('Not found by _id, looking for order by orderId field');
                existingOrder = await OrderModel.findOne({ orderId: orderId });
            }
        } catch (error) {
            console.error('Error finding order:', error);
            // Fallback to orderId search if there's an error with ObjectId
            existingOrder = await OrderModel.findOne({ orderId: orderId });
        }
        
        if (!existingOrder) {
            console.log('Order not found for ID:', orderId);
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false
            });
        }

        console.log('Current order status:', existingOrder.status);
        console.log('Updating to new status:', status.toLowerCase());

        // Update the order with the new status
        const updatedOrder = await OrderModel.findOneAndUpdate(
            { _id: existingOrder._id },
            { 
                status: status.toLowerCase(),
                updatedAt: new Date() 
            },
            { new: true }
        ).populate('userId', 'name email')
         .populate('delivery_address');

        if (!updatedOrder) {
            console.log('Failed to update order status');
            return response.status(500).json({
                message: "Failed to update order status",
                error: true,
                success: false
            });
        }

        console.log('Successfully updated order status:', { 
            orderId, 
            oldStatus: existingOrder.status,
            newStatus: updatedOrder.status,
            updated: true
        });

        // Return a clean response with only the necessary data
        return response.json({
            message: "Order status updated successfully",
            data: {
                orderId: updatedOrder.orderId,
                status: updatedOrder.status,
                updatedAt: updatedOrder.updatedAt
            },
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Error in updateOrderStatusByIdController:', error);
        return response.status(500).json({
            message: error.message || "Server error",
            error: true,
            success: false
        });
    }
}

export async function updateOrderStatusController(request, response) {
    try {
        const { orderId } = request.params;
        const { status } = request.body;

        if (!orderId || !status) {
            return response.status(400).json({
                message: "Order ID and status are required",
                error: true,
                success: false
            });
        }

        // Validate status
        const validStatuses = ['pending', 'processing', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status.toLowerCase())) {
            return response.status(400).json({
                message: "Invalid status. Must be one of: pending, processing, delivered, cancelled",
                error: true,
                success: false
            });
        }

        const order = await OrderModel.findOneAndUpdate(
            { orderId: orderId },
            { status: status.toLowerCase() },
            { new: true }
        ).populate('userId', 'name email');

        if (!order) {
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false
            });
        }

        return response.json({
            message: "Order status updated successfully",
            data: order,
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Error in updateOrderStatusController:', error);
        return response.status(500).json({
            message: error.message || "Server error",
            error: true,
            success: false
        });
    }
}

// Handler for the specific problematic endpoint seen in the logs
export async function legacyUpdateOrderStatusController(request, response) {
    try {
        const { orderId } = request.body; // Extract orderId from body
        const { status } = request.body;
        
        console.log('Received status update request:', { orderId, status });
        
        if (!orderId || !status) {
            console.log('Missing required fields');
            return response.status(400).json({
                message: "Order ID and status are required",
                error: true,
                success: false
            });
        }
        
        // Validate status
        const validStatuses = ['pending', 'processing', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status.toLowerCase())) {
            console.log('Invalid status:', status);
            return response.status(400).json({
                message: "Invalid status. Must be one of: pending, processing, delivered, cancelled",
                error: true,
                success: false
            });
        }
        
        console.log('Finding order with ID:', orderId);
        
        // First check if the order exists
        const existingOrder = await OrderModel.findOne({ orderId: orderId });
        if (!existingOrder) {
            console.log('Order not found for ID:', orderId);
            return response.status(404).json({
                message: "Order not found",
                error: true,
                success: false
            });
        }
        
        console.log('Current order status:', existingOrder.status);
        
        // Then update it
        const order = await OrderModel.findOneAndUpdate(
            { orderId: orderId },
            { status: status.toLowerCase() },
            { new: true }
        );
        
        console.log('Successfully updated order status:', { 
            orderId, 
            oldStatus: existingOrder.status,
            newStatus: status.toLowerCase(),
            updated: order ? true : false
        });
        
        return response.json({
            message: "Order status updated successfully",
            data: order,
            oldStatus: existingOrder.status,
            newStatus: status.toLowerCase(),
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Error in legacyUpdateOrderStatusController:', error);
        return response.status(500).json({
            message: error.message || "Server error",
            error: true,
            success: false
        });
    }
}
