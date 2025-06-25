import { createBrowserRouter } from "react-router-dom";
import App from "../App";
import Home from "../pages/Home";
import SearchPage from "../pages/SearchPage";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import OtpVerification from "../pages/OtpVerification";
import ResetPassword from "../pages/ResetPassword";
import UserMenuMobile from "../pages/UserMenuMobile";
import Dashboard from "../layouts/Dashboard";
import Profile from "../pages/Profile";
import MyOrders from "../pages/MyOrders";
import Address from "../pages/Address";
import CategoryPage from "../pages/CategoryPage";
import SubCategoryPage from "../pages/SubCategoryPage";
import UploadProduct from "../pages/UploadProduct";
import ProductAdmin from "../pages/ProductAdmin";
import AdminPermision from "../layouts/AdminPermision";
import ProductListPage from "../pages/ProductListPage";
import ProductDisplayPage from "../pages/ProductDisplayPage";
import CartMobile from "../pages/CartMobile";
import CheckoutPage from "../pages/CheckoutPage";
import Success from "../pages/Success";
import Cancel from "../pages/Cancel";
import AllOrders from "../components/AllOrders";
import OrderDetails from "../pages/OrderDetails";
import Customers from "../components/Customers";
import BannerPage from "../pages/BannerPage";
import FeaturedCategoryPage from "../pages/FeaturedCategoryPage";
import FeaturedCategoryProductsPage from "../pages/FeaturedCategoryProductsPage";
import VendorPage from "../pages/VendorPage";
import AuthCheck from "../utils/AuthCheck";
import VendorDetailPage from "../pages/VendorDetailPage";
// import NotFound from "../pages/NotFound";

const router = createBrowserRouter([
    {
        path : "/",
        element : <App/>,
        children : [
            {
                path : "",
                element : <Home/>
            },
            {
                path : "search",
                element : <SearchPage/>
            },
            {
                path : 'login',
                element : <Login/>
            },
            {
                path : "register",
                element : <Register/>
            },
            {
                path : "forgot-password",
                element : <ForgotPassword/>
            },
            {
                path : "verification-otp",
                element : <OtpVerification/>
            },
            {
                path : "reset-password",
                element : <ResetPassword/>
            },
            {
                path : "user",
                element : <AuthCheck><UserMenuMobile/></AuthCheck>
            },
            {
                path : "featured-category/:id",
                element : <FeaturedCategoryProductsPage/>
            },
            {
                path : "dashboard",
                element : <AuthCheck><Dashboard/></AuthCheck>,
                children : [
                    {
                        path : "profile",
                        element : <Profile/>
                    },
                    {
                        path : "myorders",
                        element : <MyOrders/>
                    },
                    {
                        path : "address",
                        element : <Address/>
                    },
                    {
                        path : 'category',
                        element : <AdminPermision><CategoryPage/></AdminPermision>
                    },
                    {
                        path : "subcategory",
                        element : <AdminPermision><SubCategoryPage/></AdminPermision>
                    },
                    {
                        path : 'upload-product',
                        element : <AdminPermision><UploadProduct/></AdminPermision>
                    },
                    {
                        path : 'product',
                        element : <AdminPermision><ProductAdmin/></AdminPermision>
                    },
                    {
                        path: "banners",
                        element: (
                            <AdminPermision>
                                <BannerPage/>
                            </AdminPermision>
                        )
                    },
                    {
                        path: "featured-categories",
                        element: (
                            <AdminPermision>
                                <FeaturedCategoryPage/>
                            </AdminPermision>
                        )
                    },
                    {
                        path: "vendors",
                        element: (
                            <AdminPermision>
                                <VendorPage/>
                            </AdminPermision>
                        )
                    },
                    {
                        path: "allorders",
                        element: (
                            <AdminPermision>
                                <AllOrders/>
                            </AdminPermision>
                        )
                    },
                    {
                        path: "customers",
                        element: (
                            <AdminPermision>
                                <Customers/>
                            </AdminPermision>
                        )
                    }
                ]
            },
            {
                path : ":category",
                children : [
                    {
                        path : ":subCategory",
                        element : <ProductListPage/>
                    }
                ]
            },
            {
                path : "product/:product",
                element : <ProductDisplayPage/>
            },
            {
                path : 'cart',
                element : <AuthCheck><CartMobile/></AuthCheck>
            },
            {
                path : "checkout",
                element : <AuthCheck><CheckoutPage/></AuthCheck>
            },
            {
                path : "success",
                element : <Success/>
            },
            {
                path : 'cancel',
                element : <Cancel/>
            },
            {
                path : "order-details/:orderId",
                element : <AuthCheck><OrderDetails/></AuthCheck>
            },
            {
                path: "vendor/:id",
                element: <VendorDetailPage />,
            }
        ]
    }
])

export default router