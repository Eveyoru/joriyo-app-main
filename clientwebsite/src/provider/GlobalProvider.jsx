import { createContext, useContext, useEffect, useState } from "react";
import Axios from "../utils/Axios";
import SummaryApi from "../common/SummaryApi";
import { useDispatch, useSelector } from "react-redux";
import { handleAddItemCart } from "../store/cartProduct";
import AxiosToastError from "../utils/AxiosToastError";
import toast from "react-hot-toast";
import { pricewithDiscount } from "../utils/PriceWithDiscount";
import { handleAddAddress } from "../store/addressSlice";
import { setOrder } from "../store/orderSlice";

export const GlobalContext = createContext(null)

export const useGlobalContext = () => useContext(GlobalContext)

const GlobalProvider = ({children}) => {
    const dispatch = useDispatch()
    const [totalPrice, setTotalPrice] = useState(0)
    const [notDiscountTotalPrice, setNotDiscountTotalPrice] = useState(0)
    const [totalQty, setTotalQty] = useState(0)
    const cartItem = useSelector(state => state.cartItem.cart)
    const user = useSelector(state => state?.user)
    
    // Check if user is authenticated
    const isAuthenticated = user && user._id;

    // Fetch cart items
    const fetchCartItem = async() => {
        try {
            // Don't attempt to fetch cart if user isn't authenticated
            if (!isAuthenticated) {
                console.log('Not fetching cart: user not authenticated');
                return { success: false, authenticated: false };
            }
            
            const response = await Axios({
                ...SummaryApi.getCartItem
            });
            
            const { data: responseData } = response;
            
            // Check if response indicates authentication required
            if (responseData.authenticated === false) {
                console.log('Authentication required to fetch cart');
                return { success: false, authenticated: false };
            }
            
            if (responseData.success) {
                dispatch(handleAddItemCart(responseData.data));
                return responseData;
            }
            
            return { success: false };
        } catch (error) {
            console.log('Error fetching cart:', error);
            return { success: false, error };
        }
    }

    // Update cart item quantity
    const updateCartItem = async(id, qty) => {
        try {
            // Don't attempt to update cart if user isn't authenticated
            if (!isAuthenticated) {
                console.log('Not updating cart: user not authenticated');
                return { success: false, authenticated: false };
            }
            
            // Ensure qty is a number value, not an object
            const quantity = typeof qty === 'object' && qty.quantity !== undefined ? qty.quantity : qty;
            
            console.log('Updating cart with ID:', id, 'New quantity:', quantity);
            
            const response = await Axios({
                ...SummaryApi.updateCartItemQty,
                data: {
                    _id: id,
                    qty: quantity
                }
            });
            
            const { data: responseData } = response;
            
            // Check if response indicates authentication required
            if (responseData.authenticated === false) {
                console.log('Authentication required to update cart');
                return { success: false, authenticated: false };
            }
            
            if (responseData.success) {
                fetchCartItem();
                return responseData;
            }
            
            return { success: false };
        } catch (error) {
            console.log('Error updating cart:', error);
            AxiosToastError(error);
            return { success: false, error };
        }
    }
    
    // Delete cart item
    const deleteCartItem = async(cartId) => {
        try {
            // Don't attempt to delete cart item if user isn't authenticated
            if (!isAuthenticated) {
                console.log('Not deleting cart item: user not authenticated');
                return { success: false, authenticated: false };
            }
            
            const response = await Axios({
                ...SummaryApi.deleteCartItem,
                data: {
                    _id: cartId
                }
            });
            
            const { data: responseData } = response;
            
            // Check if response indicates authentication required
            if (responseData.authenticated === false) {
                console.log('Authentication required to delete cart item');
                return { success: false, authenticated: false };
            }
            
            if (responseData.success) {
                toast.success(responseData.message);
                fetchCartItem();
                return responseData;
            }
            
            return { success: false };
        } catch (error) {
            console.log('Error deleting cart item:', error);
            return { success: false, error };
        }
    }

    // Calculate cart summary values when cart items change
    useEffect(() => {
        if (!cartItem || !Array.isArray(cartItem)) return;
        
        const qty = cartItem.reduce((preve, curr) => {
            return preve + curr.quantity;
        }, 0);
        setTotalQty(qty);
        
        const tPrice = cartItem.reduce((preve, curr) => {
            // For products with variations
            if (curr?.productId?.hasVariations && curr?.variationId) {
                // Find the correct variation
                const variation = curr?.productId?.variations?.find(v => 
                    v._id.toString() === curr.variationId.toString() || 
                    (curr.selectedSize && v.size === curr.selectedSize)
                );
                
                if (variation) {
                    const variationDiscountedPrice = pricewithDiscount(variation.price, curr?.productId?.discount);
                    return preve + (variationDiscountedPrice * curr.quantity);
                }
            }
            
            // For standard products or fallback
            const priceAfterDiscount = pricewithDiscount(curr?.productId?.price, curr?.productId?.discount);
            return preve + (priceAfterDiscount * curr.quantity);
        }, 0);
        setTotalPrice(tPrice);

        const notDiscountPrice = cartItem.reduce((preve, curr) => {
            // For products with variations
            if (curr?.productId?.hasVariations && curr?.variationId) {
                // Find the correct variation
                const variation = curr?.productId?.variations?.find(v => 
                    v._id.toString() === curr.variationId.toString() || 
                    (curr.selectedSize && v.size === curr.selectedSize)
                );
                
                if (variation) {
                    return preve + (variation.price * curr.quantity);
                }
            }
            
            // For standard products or fallback
            return preve + (curr?.productId?.price * curr.quantity);
        }, 0);
        setNotDiscountTotalPrice(notDiscountPrice);
    }, [cartItem]);

    // Clear user data on logout
    const handleLogoutOut = () => {
        if (!isAuthenticated) {
            localStorage.clear();
            dispatch(handleAddItemCart([]));
        }
    }

    // Fetch addresses
    const fetchAddress = async() => {
        try {
            // Don't attempt to fetch addresses if user isn't authenticated
            if (!isAuthenticated) {
                console.log('Not fetching addresses: user not authenticated');
                return { success: false, authenticated: false };
            }
            
            const response = await Axios({
                ...SummaryApi.getAddress
            });
            
            const { data: responseData } = response;
            
            // Check if response indicates authentication required
            if (responseData.authenticated === false) {
                console.log('Authentication required to fetch addresses');
                return { success: false, authenticated: false };
            }
            
            if (responseData.success) {
                dispatch(handleAddAddress(responseData.data));
                return responseData;
            }
            
            return { success: false };
        } catch (error) {
            console.log('Error fetching addresses:', error);
            return { success: false, error };
        }
    }
    
    // Fetch orders
    const fetchOrder = async() => {
        try {
            // Don't attempt to fetch orders if user isn't authenticated
            if (!isAuthenticated) {
                console.log('Not fetching orders: user not authenticated');
                return { success: false, authenticated: false };
            }
            
            const response = await Axios({
                ...SummaryApi.getOrderItems,
            });
            
            const { data: responseData } = response;
            
            // Check if response indicates authentication required
            if (responseData.authenticated === false) {
                console.log('Authentication required to fetch orders');
                return { success: false, authenticated: false };
            }
            
            if (responseData.success) {
                dispatch(setOrder(responseData.data));
                return responseData;
            }
            
            return { success: false };
        } catch (error) {
            console.log('Error fetching orders:', error);
            return { success: false, error };
        }
    }

    // Fetch user data when user changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchCartItem();
            fetchAddress();
            fetchOrder();
        } else {
            handleLogoutOut();
        }
    }, [user]);
    
    return (
        <GlobalContext.Provider value={{
            fetchCartItem,
            updateCartItem,
            deleteCartItem,
            fetchAddress,
            totalPrice,
            totalQty,
            notDiscountTotalPrice,
            fetchOrder,
            isAuthenticated
        }}>
            {children}
        </GlobalContext.Provider>
    )
}

export default GlobalProvider