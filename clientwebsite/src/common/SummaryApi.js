export const baseURL = import.meta.VITE_API_URL

const SummaryApi = {
    register : {
        url : '/api/user/register',
        method : 'post'
    },
    login : {
        url : '/api/user/login',
        method : 'post'
    },
    forgot_password : {
        url : "/api/user/forgot-password",
        method : 'put'
    },
    forgot_password_otp_verification : {
        url : 'api/user/verify-forgot-password-otp',
        method : 'put'
    },
    resetPassword : {
        url : "/api/user/reset-password",
        method : 'put'
    },
    refreshToken : {
        url : 'api/user/refresh-token',
        method : 'post'
    },
    userDetails : {
        url : '/api/user/user-details',
        method : "get"
    },
    logout : {
        url : "/api/user/logout",
        method : 'get'
    },
    uploadAvatar : {
        url : "/api/user/upload-avatar",
        method : 'put'
    },
    updateUserDetails : {
        url : '/api/user/update-user',
        method : 'put'
    },
    addCategory : {
        url : '/api/category/add-category',
        method : 'post'
    },
    uploadImage : {
        url : '/api/file/upload',
        method : 'post'
    },
    getCategory : {
        url : '/api/category/get',
        method : 'get'
    },
    updateCategory : {
        url : '/api/category/update',
        method : 'put'
    },
    deleteCategory : {
        url : '/api/category/delete',
        method : 'delete'
    },
    createSubCategory : {
        url : '/api/subcategory/create',
        method : 'post'
    },
    getSubCategory : {
        url : '/api/subcategory/get',
        method : 'post'
    },
    updateSubCategory : {
        url : '/api/subcategory/update',
        method : 'put'
    },
    deleteSubCategory : {
        url : '/api/subcategory/delete',
        method : 'delete'
    },
    createProduct : {
        url : '/api/product/create',
        method : 'post'
    },
    getProduct : {
        url : '/api/product/get',
        method : 'post'
    },
    getProductByCategory : {
        url : '/api/product/get-product-by-category',
        method : 'post'
    },
    getProductByCategoryAndSubCategory : {
        url : '/api/product/get-pruduct-by-category-and-subcategory',
        method : 'post'
    },
    getProductDetails : {
        url : '/api/product/get-product-details',
        method : 'post'
    },
    updateProductDetails : {
        url : "/api/product/update-product-details",
        method : 'put'
    },
    deleteProduct : {
        url : "/api/product/delete-product",
        method : 'delete'
    },
    searchProduct : {
        url : '/api/product/search-product',
        method : 'post'
    },
    addTocart : {
        url : "/api/cart/create",
        method : 'post'
    },
    getCartItem : {
        url : '/api/cart/get',
        method : 'get'
    },
    updateCartItemQty : {
        url : '/api/cart/update-qty',
        method : 'put'
    },
    deleteCartItem : {
        url : '/api/cart/delete-cart-item',
        method : 'delete'
    },
    createAddress : {
        url : '/api/address/create',
        method : 'post'
    },
    getAddress : {
        url : '/api/address/get',
        method : 'get'
    },
    updateAddress : {
        url : '/api/address/update',
        method : 'put'
    },
    disableAddress : {
        url : '/api/address/disable',
        method : 'delete'
    },
    CashOnDeliveryOrder : {
        url : "/api/order/cash-on-delivery",
        method : 'post'
    },
    payment_url : {
        url : "/api/order/checkout",
        method : 'post'
    },
    getOrderItems : {
        url : '/api/order/order-list',
        method : 'get'
    },
    getAllOrders: {
        url: '/api/order/all',
        method: 'get'
    },
    updateOrderStatus: {
        getUrl: (orderId) => `/api/order/update-status/${orderId}`,
        method: 'put'
    },
    getAllCustomers: {
        url: '/api/user/customers',
        method: 'get'
    },
    // Banner Management API Endpoints
    getBanners: {
        url: '/api/banner/get',
        method: 'get'
    },
    getActiveBanners: {
        url: '/api/banner/get-active',
        method: 'get'
    },
    updateBanner: {
        url: '/api/banner/update',
        method: 'put'
    },
    deleteBanner: {
        url: '/api/banner/delete',
        method: 'delete'
    },
    addBanner: {
        url: '/api/banner/add',
        method: 'post'
    },
    // Featured Category API Endpoints
    addFeaturedCategory: {
        url: '/api/featured-category/add',
        method: 'post'
    },
    getFeaturedCategories: {
        url: '/api/featured-category/get-all',
        method: 'get'
    },
    getActiveFeaturedCategories: {
        url: '/api/featured-category/get-active',
        method: 'get'
    },
    getFeaturedCategoryById: {
        getUrl: (id) => `/api/featured-category/get/${id}`,
        method: 'get'
    },
    updateFeaturedCategory: {
        url: '/api/featured-category/update',
        method: 'put'
    },
    deleteFeaturedCategory: {
        url: '/api/featured-category/delete',
        method: 'delete'
    },
    
    // Vendor API Endpoints
    addVendor: {
        url: '/api/vendor/add',
        method: 'post'
    },
    getVendors: {
        url: '/api/vendor/get-all',
        method: 'get'
    },
    getActiveVendors: {
        url: '/api/vendor/get-active',
        method: 'get'
    },
    getVendorById: {
        url: '/api/vendor/get-by-id',
        method: 'post'
    },
    updateVendor: {
        url: '/api/vendor/update',
        method: 'put'
    },
    deleteVendor: {
        url: '/api/vendor/delete',
        method: 'delete'
    },
    // Products by vendor
    getProductsByVendor: {
        url: '/api/product/get-products-by-vendor',
        method: 'post'
    }
}

export default SummaryApi