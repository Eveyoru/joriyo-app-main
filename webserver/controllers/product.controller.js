import ProductModel from "../models/product.model.js";

export const createProductController = async(request,response)=>{
    try {
        const { 
            name,
            image,
            category,
            subCategory,
            vendor,
            unit,
            stock,
            price,
            discount,
            description,
            more_details,
            hasVariations,
            variations,
            sizingType
        } = request.body 

        // Base validation - either need main price/stock or variations
        if(!name || !image[0] || !category[0] || !subCategory[0] || !unit || !description) {
            return response.status(400).json({
                message: "Enter required fields: name, image, category, subcategory, unit, and description",
                error: true,
                success: false
            });
        }

        // If product has variations, validate them
        if (hasVariations) {
            // Variations are required when hasVariations is true
            if (!variations || !Array.isArray(variations) || variations.length === 0) {
                return response.status(400).json({
                    message: "Product variations are required when hasVariations is true",
                    error: true,
                    success: false
                });
            }

            // Validate each variation
            for (const variation of variations) {
                if (!variation.size || variation.price === undefined || variation.stock === undefined) {
                    return response.status(400).json({
                        message: "Each variation must include size, price, and stock",
                        error: true,
                        success: false
                    });
                }

                if (variation.price < 0) {
                    return response.status(400).json({
                        message: "Variation price cannot be negative",
                        error: true,
                        success: false
                    });
                }

                if (variation.stock < 0) {
                    return response.status(400).json({
                        message: "Variation stock cannot be negative",
                        error: true,
                        success: false
                    });
                }
            }
        } else {
            // If no variations, traditional validation for price and stock
            if (price === undefined) {
                return response.status(400).json({
                    message: "Price is required for products without variations",
                    error: true,
                    success: false
                });
            }

            // Validate price is not negative
            if (price < 0) {
                return response.status(400).json({
                    message: "Price cannot be negative",
                    error: true,
                    success: false
                });
            }

            // Validate stock is a non-negative number or null
            if (stock !== null && stock < 0) {
            return response.status(400).json({
                    message: "Stock cannot be negative",
                    error: true,
                    success: false
                });
            }
        }

        const product = new ProductModel({
            name,
            image,
            category,
            subCategory,
            vendor,
            unit,
            stock: hasVariations ? null : stock, // Use null for stock if product has variations
            price: hasVariations ? null : price, // Use null for price if product has variations
            discount,
            description,
            more_details,
            hasVariations,
            variations: hasVariations ? variations : [],
            sizingType: hasVariations ? (sizingType || 'custom') : 'none'
        });

        const saveProduct = await product.save();

        return response.json({
            message: "Product Created Successfully",
            data: saveProduct,
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

export const getProductController = async(request,response)=>{
    try {
        
        let { page, limit, search } = request.body 

        if(!page){
            page = 1
        }

        if(!limit){
            limit = 10
        }

        const query = search ? {
            $text : {
                $search : search
            }
        } : {}

        const skip = (page - 1) * limit

        const [data,totalCount] = await Promise.all([
            ProductModel.find(query).sort({createdAt : -1 }).skip(skip).limit(limit).populate('category subCategory vendor'),
            ProductModel.countDocuments(query)
        ])

        return response.json({
            message : "Product data",
            error : false,
            success : true,
            totalCount : totalCount,
            totalNoPage : Math.ceil( totalCount / limit),
            data : data
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const getProductByCategory = async(request,response)=>{
    try {
        const { id, categoryId, page = 1, limit = 15 } = request.body 
        const categoryIds = categoryId || id

        if(!categoryIds){
            return response.status(400).json({
                message : "provide category id",
                error : true,
                success : false
            })
        }

        console.log("Category IDs received:", categoryIds)

        const skip = (page - 1) * limit
        
        // First check if there are any products
        const totalProducts = await ProductModel.countDocuments({
            category: { $in: categoryIds },
            publish: true
        });
        
        console.log(`Total products for categories ${categoryIds}: ${totalProducts}`);
        
        if (totalProducts === 0) {
            // Return empty array early if no products
            return response.json({
                message: "No products found for this category",
                data: [],
                error: false,
                success: true,
                total: 0,
                totalPages: 0
            });
        }
        
        // Get products if they exist
        const product = await ProductModel.find({ 
            category : { $in : categoryIds },
            publish: true
        })
        .populate('vendor', 'name imageUrl description')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        
        console.log(`Found ${product.length} products for categories ${categoryIds}`);

        // Calculate total pages
        const totalPages = Math.ceil(totalProducts / limit);

        return response.json({
            message : "category product list",
            data : product,
            error : false,
            success : true,
            total: totalProducts,
            totalPages: totalPages
        })
    } catch (error) {
        console.error("Error in getProductByCategory:", error)
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export const getProductByCategoryAndSubCategory  = async(request,response)=>{
    try {
        const { categoryId,subCategoryId,page,limit } = request.body

        if(!categoryId || !subCategoryId){
            return response.status(400).json({
                message : "Provide categoryId and subCategoryId",
                error : true,
                success : false
            })
        }

        if(!page){
            page = 1
        }

        if(!limit){
            limit = 10
        }

        const query = {
            category : { $in :categoryId  },
            subCategory : { $in : subCategoryId }
        }

        const skip = (page - 1) * limit

        const [data,dataCount] = await Promise.all([
            ProductModel.find(query).sort({createdAt : -1 }).skip(skip).limit(limit).populate('category subCategory vendor'),
            ProductModel.countDocuments(query)
        ])

        return response.json({
            message : "Product list",
            data : data,
            totalCount : dataCount,
            page : page,
            limit : limit,
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

export const getProductDetails = async(request,response)=>{
    try {
        const { productId } = request.body 

        console.log("Fetching product details for ID:", productId);

        const product = await ProductModel.findOne({ _id : productId }).populate({
            path: 'vendor',
            select: 'name imageUrl description status _id'
        });

        // Log vendor data for debugging
        if (product && product.vendor) {
            console.log("Vendor data found:", {
                id: product.vendor._id,
                name: product.vendor.name,
                hasImage: !!product.vendor.imageUrl
            });
        } else {
            console.log("No vendor data found for product:", productId);
        }

        return response.json({
            message : "product details",
            data : product,
            error : false,
            success : true
        })

    } catch (error) {
        console.error("Error in getProductDetails:", error);
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//update product
export const updateProductDetails = async(request, response) => {
    try {
        const {
            productId,
            name,
            image,
            category,
            subCategory,
            vendor,
            unit,
            stock,
            price,
            discount,
            description,
            more_details,
            hasVariations,
            variations,
            sizingType,
            publish
        } = request.body;

        if (!productId) {
            return response.status(400).json({
                message: "Product ID is required",
                error: true,
                success: false
            });
        }

        // Find product first to check if it exists
        const existingProduct = await ProductModel.findById(productId);
        if (!existingProduct) {
            return response.status(404).json({
                message: "Product not found",
                error: true,
                success: false
            });
        }

        // Build update object based on fields that are provided
        const updateData = {};
        
        if (name !== undefined) updateData.name = name;
        if (image !== undefined) updateData.image = image;
        if (category !== undefined) updateData.category = category;
        if (subCategory !== undefined) updateData.subCategory = subCategory;
        if (vendor !== undefined) updateData.vendor = vendor;
        if (unit !== undefined) updateData.unit = unit;
        if (description !== undefined) updateData.description = description;
        if (more_details !== undefined) updateData.more_details = more_details;
        if (publish !== undefined) updateData.publish = publish;
        if (discount !== undefined) updateData.discount = discount;
        
        // Handle variations logic
        if (hasVariations !== undefined) {
            updateData.hasVariations = hasVariations;
            
            if (hasVariations) {
                // If switching to variations or updating variations
                if (variations && Array.isArray(variations)) {
                    // Validate each variation
                    for (const variation of variations) {
                        if (!variation.size || variation.price === undefined || variation.stock === undefined) {
                            return response.status(400).json({
                                message: "Each variation must include size, price, and stock",
                                error: true,
                                success: false
                            });
                        }

                        if (variation.price < 0) {
                            return response.status(400).json({
                                message: "Variation price cannot be negative",
                                error: true,
                                success: false
                            });
                        }

                        if (variation.stock < 0) {
                            return response.status(400).json({
                                message: "Variation stock cannot be negative",
                                error: true,
                                success: false
                            });
                        }
                    }
                    
                    updateData.variations = variations;
                    // When using variations, main price and stock are null
                    updateData.price = null;
                    updateData.stock = null;
                    
                    if (sizingType) {
                        updateData.sizingType = sizingType;
                    } else {
                        updateData.sizingType = 'custom';
                    }
                } else {
                    return response.status(400).json({
                        message: "Variations are required when hasVariations is true",
                        error: true,
                        success: false
                    });
                }
            } else {
                // If switching from variations to no variations
                updateData.variations = [];
                updateData.sizingType = 'none';
                
                // Require price when switching away from variations
                if (price === undefined) {
                    return response.status(400).json({
                        message: "Price is required when switching from variations to standard product",
                        error: true,
                        success: false
                    });
                }
                
                updateData.price = price;
                updateData.stock = stock;
            }
        } else {
            // If not changing the hasVariations flag
            if (existingProduct.hasVariations) {
                // Product uses variations, so update those if provided
                if (variations && Array.isArray(variations)) {
                    // Validate each variation
                    for (const variation of variations) {
                        if (!variation.size || variation.price === undefined || variation.stock === undefined) {
                            return response.status(400).json({
                                message: "Each variation must include size, price, and stock",
                                error: true,
                                success: false
                            });
                        }

                        if (variation.price < 0) {
                            return response.status(400).json({
                                message: "Variation price cannot be negative",
                                error: true,
                                success: false
                            });
                        }

                        if (variation.stock < 0) {
                            return response.status(400).json({
                                message: "Variation stock cannot be negative",
                                error: true,
                                success: false
                            });
                        }
                    }
                    
                    updateData.variations = variations;
                }
                
                if (sizingType) {
                    updateData.sizingType = sizingType;
                }
            } else {
                // Standard product, update price/stock if provided
                if (price !== undefined) {
                    if (price < 0) {
                        return response.status(400).json({
                            message: "Price cannot be negative",
                            error: true,
                            success: false
                        });
                    }
                    updateData.price = price;
                }
                
                if (stock !== undefined) {
                    if (stock !== null && stock < 0) {
                        return response.status(400).json({
                            message: "Stock cannot be negative",
                            error: true,
                            success: false
                        });
                    }
                    updateData.stock = stock;
                }
            }
        }

        const updatedProduct = await ProductModel.findByIdAndUpdate(
            productId,
            { $set: updateData },
            { new: true }
        );

        return response.json({
            message: "Product updated successfully",
            data: updatedProduct,
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

//delete product
export const deleteProductDetails = async(request,response)=>{
    try {
        const { _id } = request.body 

        if(!_id){
            return response.status(400).json({
                message : "provide _id ",
                error : true,
                success : false
            })
        }

        const deleteProduct = await ProductModel.deleteOne({_id : _id })

        return response.json({
            message : "Delete successfully",
            error : false,
            success : true,
            data : deleteProduct
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//search product
export const searchProduct = async(request,response)=>{
    try {
        let { search, page , limit } = request.body 

        if(!page){
            page = 1
        }
        if(!limit){
            limit  = 10
        }

        const query = search ? {
            $text : {
                $search : search
            }
        } : {}

        const skip = ( page - 1) * limit

        const [data,dataCount] = await Promise.all([
            ProductModel.find(query).sort({ createdAt  : -1 }).skip(skip).limit(limit).populate('category subCategory vendor'),
            ProductModel.countDocuments(query)
        ])

        return response.json({
            message : "Product data",
            error : false,
            success : true,
            data : data,
            totalCount :dataCount,
            totalPage : Math.ceil(dataCount/limit),
            page : page,
            limit : limit 
        })


    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

// Get products by vendor ID
export const getProductsByVendorController = async(request, response) => {
    try {
        const { vendorId } = request.params;
        let { page = 1, limit = 10 } = request.query;
        
        // Convert to numbers
        page = parseInt(page);
        limit = parseInt(limit);
        
        if(!vendorId) {
            return response.status(400).json({
                message: "Vendor ID is required",
                error: true,
                success: false
            });
        }
        
        const skip = (page - 1) * limit;
        
        const [products, totalCount] = await Promise.all([
            ProductModel.find({ vendor: vendorId, publish: true })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('category subCategory vendor'),
            ProductModel.countDocuments({ vendor: vendorId, publish: true })
        ]);
        
        return response.status(200).json({
            message: "Products retrieved successfully",
            error: false,
            success: true,
            data: products,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            page,
            limit
        });
    } catch (error) {
        console.error('Error retrieving products by vendor:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};

// Get products by vendor ID (POST version)
export const getProductsByVendorPost = async(request, response) => {
    try {
        const { vendor, page = 1, limit = 10 } = request.body;
        
        if(!vendor) {
            return response.status(400).json({
                message: "Vendor ID is required",
                error: true,
                success: false
            });
        }
        
        const skip = (page - 1) * limit;
        
        const [products, totalCount] = await Promise.all([
            ProductModel.find({ vendor: vendor, publish: true })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate('category subCategory vendor'),
            ProductModel.countDocuments({ vendor: vendor, publish: true })
        ]);
        
        return response.status(200).json({
            message: "Products retrieved successfully",
            error: false,
            success: true,
            data: products,
            totalCount,
            totalPages: Math.ceil(totalCount / limit),
            page,
            limit
        });
    } catch (error) {
        console.error('Error retrieving products by vendor:', error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        });
    }
};