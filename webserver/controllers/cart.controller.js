import CartProductModel from "../models/cartproduct.model.js";
import UserModel from "../models/user.model.js";
import ProductModel from "../models/product.model.js";

export const addToCartItemController = async(request,response)=>{
    try {
        const userId = request.userId;
        const { productId, variationId, selectedSize } = request.body;
        
        if(!productId){
            return response.status(400).json({
                message: "Product ID is required",
                error: true,
                success: false
            });
        }

        // Check if the product exists
        const product = await ProductModel.findById(productId);
        if (!product) {
            return response.status(404).json({
                message: "Product not found",
                error: true,
                success: false
            });
        }

        // Handle product with variations
        if (product.hasVariations) {
            // Require variation ID or selected size for products with variations
            if (!variationId && !selectedSize) {
                return response.status(400).json({
                    message: "Please select a size for this product",
                    error: true,
                    success: false
                });
            }

            let selectedVariation;
            
            // Find the variation by ID or by size
            if (variationId) {
                selectedVariation = product.variations.id(variationId);
                if (!selectedVariation) {
                    return response.status(404).json({
                        message: "Selected variation not found",
                        error: true,
                        success: false
                    });
                }
            } else if (selectedSize) {
                selectedVariation = product.variations.find(v => v.size === selectedSize);
                if (!selectedVariation) {
                    return response.status(404).json({
                        message: `Size "${selectedSize}" not available for this product`,
                        error: true,
                        success: false
                    });
                }
            }

            // Check if variation is out of stock
            if (selectedVariation.stock <= 0) {
                return response.status(400).json({
                    message: `This size (${selectedVariation.size}) is out of stock`,
                    error: true,
                    success: false
                });
            }

            // Check if this product with this specific variation is already in cart
            const checkItemCart = await CartProductModel.findOne({
                userId: userId,
                productId: productId,
                variationId: selectedVariation._id
            });

            if (checkItemCart) {
                // If already in cart, check if increasing quantity exceeds stock
                if (checkItemCart.quantity >= selectedVariation.stock) {
                    return response.status(400).json({
                        message: `Cannot add more of this size. Only ${selectedVariation.stock} available in stock.`,
                        error: true,
                        success: false
                    });
                }
                
                // If stock is sufficient, increase quantity by 1
                const updatedCart = await CartProductModel.findByIdAndUpdate(
                    checkItemCart._id,
                    { $inc: { quantity: 1 } },
                    { new: true }
                );
                
                return response.json({
                    data: updatedCart,
                    message: `Item quantity increased`,
                    error: false,
                    success: true
                });
            }

            // If not in cart yet, create new cart item with variation details
            const cartItem = new CartProductModel({
                quantity: 1,
                userId: userId,
                productId: productId,
                variationId: selectedVariation._id,
                selectedSize: selectedVariation.size
            });
            
            const save = await cartItem.save();

            // Update user's shopping cart
            const updateCartUser = await UserModel.updateOne(
                { _id: userId },
                { $push: { shopping_cart: save._id } }
            );

            return response.json({
                data: save,
                message: "Item added to cart",
                error: false,
                success: true
            });
        } 
        // Handle standard product without variations
        else {
            // Check if product is out of stock
            if (product.stock !== null && product.stock <= 0) {
                return response.status(400).json({
                    message: "Product is out of stock",
                    error: true,
                    success: false
                });
            }

            // Check if this product is already in cart
            const checkItemCart = await CartProductModel.findOne({
                userId: userId,
                productId: productId,
                variationId: null // Ensure we're getting the non-variation version
            });

            if (checkItemCart) {
                // If already in cart, check if increasing quantity exceeds stock
                if (product.stock !== null && checkItemCart.quantity >= product.stock) {
                    return response.status(400).json({
                        message: `Cannot add more items. Only ${product.stock} available in stock.`,
                        error: true,
                        success: false
                    });
                }
                
                // If stock is sufficient, increase quantity by 1
                const updatedCart = await CartProductModel.findByIdAndUpdate(
                    checkItemCart._id,
                    { $inc: { quantity: 1 } },
                    { new: true }
                );
                
                return response.json({
                    data: updatedCart,
                    message: "Item quantity increased",
                    error: false,
                    success: true
                });
            }

            // If not in cart yet, create new cart item
            const cartItem = new CartProductModel({
                quantity: 1,
                userId: userId,
                productId: productId,
                variationId: null,
                selectedSize: null
            });
            
            const save = await cartItem.save();

            // Update user's shopping cart
            const updateCartUser = await UserModel.updateOne(
                { _id: userId },
                { $push: { shopping_cart: save._id } }
            );

            return response.json({
                data: save,
                message: "Item added to cart",
                error: false,
                success: true
            });
        }
    } catch (error) {
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

export const getCartItemController = async(request,response)=>{
    try {
        const userId = request.userId

        const cartItem =  await CartProductModel.find({
            userId : userId
        }).populate('productId')

        return response.json({
            data : cartItem,
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

export const updateCartItemQtyController = async(request,response)=>{
    try {
        const userId = request.userId 
        const { _id, qty } = request.body

        if(!_id ||  !qty){
            return response.status(400).json({
                message : "provide _id, qty"
            })
        }

        // Find the cart item first to get product info
        const cartItem = await CartProductModel.findOne({
            _id: _id,
            userId: userId
        });

        if (!cartItem) {
            return response.status(404).json({
                message: "Cart item not found",
                error: true,
                success: false
            });
        }

        // Check product stock availability
        const product = await ProductModel.findById(cartItem.productId);
        if (!product) {
            return response.status(404).json({
                message: "Product not found",
                error: true,
                success: false
            });
        }

        // If product has stock limit, validate requested quantity
        if (product.stock !== null && qty > product.stock) {
            return response.status(400).json({
                message: `Cannot update quantity. Only ${product.stock} items available in stock.`,
                error: true,
                success: false
            });
        }

        const updateCartitem = await CartProductModel.updateOne({
            _id : _id,
            userId : userId
        },{
            quantity : qty
        })

        return response.json({
            message : "Update cart",
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

export const deleteCartItemQtyController = async(request,response)=>{
    try {
      const userId = request.userId // middleware
      const { _id } = request.body 
      
      if(!_id){
        return response.status(400).json({
            message : "Provide _id",
            error : true,
            success : false
        })
      }

      const deleteCartItem  = await CartProductModel.deleteOne({_id : _id, userId : userId })

      return response.json({
        message : "Item remove",
        error : false,
        success : true,
        data : deleteCartItem
      })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}
