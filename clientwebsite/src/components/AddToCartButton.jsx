import React, { useEffect, useState } from 'react'
import { useGlobalContext } from '../provider/GlobalProvider'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError'
import Loading from './Loading'
import { useSelector } from 'react-redux'
import { FaMinus, FaPlus } from "react-icons/fa6";
import { useNavigate } from 'react-router-dom'
import ProductVariationModal from './ProductVariationModal'

const AddToCartButton = ({ data }) => {
    const { fetchCartItem, updateCartItem, deleteCartItem } = useGlobalContext()
    const [loading, setLoading] = useState(false)
    const cartItem = useSelector(state => state.cartItem.cart)
    const user = useSelector(state => state.user)
    const [isAvailableCart, setIsAvailableCart] = useState(false)
    const [qty, setQty] = useState(0)
    const [cartItemDetails, setCartItemsDetails] = useState()
    const navigate = useNavigate()
    const [showVariationModal, setShowVariationModal] = useState(false)
    
    // Debug: Log the product data to help troubleshoot
    useEffect(() => {
        console.log('Product data in AddToCartButton:', {
            id: data._id,
            name: data.name,
            hasVariations: data.hasVariations,
            variationsCount: data.variations ? data.variations.length : 0,
            variations: data.variations
        });
    }, [data]);
    
    // Check if user is logged in by looking at the user ID from Redux state
    const isLoggedIn = user && user._id ? true : false

    const handleLoginPrompt = () => {
        const userWantsToLogin = window.confirm("Please login to add items to your cart. Do you want to go to the login page?")
        if (userWantsToLogin) {
            navigate('/login')
        }
        return false
    }

    const handleADDTocart = async (e, selectedVariation = null) => {
        if (e) {
            e.preventDefault()
            e.stopPropagation()
        }

        // Check if user is logged in first
        if (!isLoggedIn) {
            return handleLoginPrompt()
        }

        try {
            setLoading(true)
            
            // Debug: Log variations data
            console.log('Adding to cart with data:', {
                hasVariations: data.hasVariations,
                variationsExist: data.variations && data.variations.length > 0,
                variationsCount: data.variations ? data.variations.length : 0,
                selectedVariation: selectedVariation
            });

            // Handle products with variations - use strict type checking
            if (data.hasVariations === true && Array.isArray(data.variations) && data.variations.length > 0) {
                let variationToUse = null;
                
                // If a specific variation was passed in
                if (selectedVariation) {
                    variationToUse = selectedVariation;
                    console.log('Using selected variation:', variationToUse);
                }
                // Use pre-selected variation from product page
                else if (data.selectedVariationId || data.selectedSize) {
                    variationToUse = data.variations.find(v => 
                        (data.selectedVariationId && v._id === data.selectedVariationId) || 
                        (data.selectedSize && v.size === data.selectedSize)
                    );
                    console.log('Using pre-selected variation:', variationToUse);
                }
                
                // If no variation selected, show the modal
                if (!variationToUse) {
                    console.log('No variation selected, showing modal');
                    setLoading(false);
                    setShowVariationModal(true);
                    return;
                }
                
                // Check if selected variation is out of stock
                if (variationToUse.stock <= 0) {
                    console.log('Selected variation is out of stock');
                    toast.error(`Sorry, ${variationToUse.size} is out of stock`);
                    setLoading(false);
                    return;
                }

                // Prepare cart data with variation
                const cartData = {
                    productId: data._id,
                    variationId: variationToUse._id,
                    selectedSize: variationToUse.size
                };

                const response = await Axios({
                    ...SummaryApi.addTocart,
                    data: cartData
                });

                if (response.data && response.data.success) {
                    console.log('Added to cart successfully');
                    toast.success(response.data.message || `Added ${variationToUse.size} to cart`);
                    // Fetch updated cart data
                    fetchCartItem();
                }
            } 
            // Handle regular products without variations
            else {
                if (data.stock <= 0) {
                    console.log('Product is out of stock');
                    toast.error("Sorry, this product is out of stock");
                    setLoading(false);
                    return;
                }

                const cartData = {
                    productId: data._id
                };

                const response = await Axios({
                    ...SummaryApi.addTocart,
                    data: cartData
                });

                if (response.data && response.data.success) {
                    console.log('Added to cart successfully');
                    toast.success(response.data.message || "Added to cart");
                    // Fetch updated cart data
                    fetchCartItem();
                }
            }
        } catch (error) {
            console.error("Error adding to cart:", error);
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    }

    // Check if this item is in cart
    useEffect(() => {
        if (!cartItem || !Array.isArray(cartItem)) return;
        
        let matchingItem;
        
        // For products with variations
        if (data.hasVariations && (data.selectedVariationId || data.selectedSize)) {
            matchingItem = cartItem.find(item => {
                const productMatch = item.productId && item.productId._id === data._id;
                
                const variationMatch = 
                    (data.selectedVariationId && item.variationId === data.selectedVariationId) ||
                    (data.selectedSize && item.selectedSize === data.selectedSize);
                
                return productMatch && variationMatch;
            });
        } 
        // For regular products
        else {
            matchingItem = cartItem.find(item => item.productId && item.productId._id === data._id);
        }
        
        setIsAvailableCart(!!matchingItem);
        setQty(matchingItem?.quantity || 0);
        setCartItemsDetails(matchingItem);
    }, [data, cartItem, data.selectedVariationId, data.selectedSize]);

    const handleIncreaseQuantity = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        await handleADDTocart(e);
    }

    const handleDecreaseQuantity = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isLoggedIn) {
            return handleLoginPrompt();
        }

        try {
            setLoading(true);

            if (qty === 1) {
                // If quantity is 1, remove the item
                await deleteCartItem(cartItemDetails?._id);
            } else {
                // Otherwise decrease the quantity
                await updateCartItem(cartItemDetails?._id, qty - 1);
            }

            // Refresh cart data
            fetchCartItem();
        } catch (error) {
            console.error("Error updating cart:", error);
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    }

    const handleAddFromModal = async (selectedVariation) => {
        await handleADDTocart(null, selectedVariation);
    };

    // Handle the button click
    const handleCartButtonClick = (e) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }
        
        // For products with variations
        if (data.hasVariations === true && Array.isArray(data.variations) && data.variations.length > 0) {
            // Check if we should skip the modal (for product detail page)
            if (data.skipVariationModal === true && (data.selectedVariationId || data.selectedSize)) {
                console.log('Skipping variation modal, using pre-selected variation');
                // Find the selected variation
                const selectedVariation = data.variations.find(v => 
                    (data.selectedVariationId && v._id === data.selectedVariationId) || 
                    (data.selectedSize && v.size === data.selectedSize)
                );
                
                if (selectedVariation) {
                    handleADDTocart(null, selectedVariation);
                    return;
                }
            }
            
            // Otherwise show the variation modal
            console.log('Product has variations, showing selection modal');
            setShowVariationModal(true);
            return;
        }
        
        // For regular products
        handleADDTocart(e);
    };

    return (
        <>
        {
            isAvailableCart ? (
                <div className='flex items-center justify-between border px-2 py-1 w-fit' onClick={(e) => e.stopPropagation()}>
                    <button onClick={handleDecreaseQuantity} disabled={loading}>
                        {qty === 1 ? 
                            <div className="p-1 hover:bg-red-600 hover:text-white transition-colors rounded">
                                <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32L53.2 467c1.6 25.3 22.6 45 47.9 45H346.9c25.3 0 46.3-19.7 47.9-45L416 128z"></path>
                                </svg>
                            </div>
                        : 
                            <FaMinus />
                        }
                    </button>
                    <div className='px-3'>
                        {loading ? <Loading/> : qty}
                    </div>
                    <button onClick={handleIncreaseQuantity} disabled={loading}>
                        <FaPlus />
                    </button>
                </div>
            ) : (
                <button 
                    onClick={handleCartButtonClick}
                    className='bg-green-600 text-white px-4 py-1 rounded font-medium'
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {loading ? <Loading /> : 'ADD'}
                </button>
            )
        }

        {/* Variation Selection Modal */}
        {showVariationModal && (
            <ProductVariationModal 
                product={data}
                onClose={(e) => {
                    if (e) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                    setShowVariationModal(false);
                }}
                onAddToCart={handleAddFromModal}
            />
        )}
        </>
    )
}

export default AddToCartButton
