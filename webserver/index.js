import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
dotenv.config()
import cookieParser from 'cookie-parser'
import morgan from 'morgan'
import helmet from 'helmet'
import connectDB from './config/connectDB.js'
import userRouter from './route/user.route.js'
import categoryRouter from './route/category.route.js'
import uploadRouter from './route/upload.router.js'
import subCategoryRouter from './route/subCategory.route.js'
import productRouter from './route/product.route.js'
import cartRouter from './route/cart.route.js'
import addressRouter from './route/address.route.js'
import orderRouter from './route/order.route.js'
import bannerRouter from './route/banner.route.js'
import featuredCategoryRouter from './route/featuredCategory.route.js'
import vendorRouter from './route/vendor.route.js'

const app = express()
const PORT = process.env.PORT || 8080

// CORS configuration for development
app.use(cors({
    credentials: true,
    origin: function(origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests)
        if (!origin) return callback(null, true);
        
        // In development, allow all localhost and local network origins
        const allowedOrigins = [
            'http://localhost:19006',     // Expo web
            'http://localhost:19000',     // Expo dev server
            'http://localhost:8081',      // Common dev server port
            'http://localhost:3000',      // Common React dev server
            'http://127.0.0.1:19006',
            'http://127.0.0.1:19000',
            'http://127.0.0.1:8081',
            'http://127.0.0.1:3000',
            'exp://',                     // All Expo URLs
            'http://192.168.1.',          // Common local network
            'http://192.168.0.',          // Common local network
            'http://10.0.2.2:8080',       // Android emulator to localhost
            'http://10.0.3.2:8080'        // Genymotion to localhost
        ];
        
        // Check if the origin matches any of the allowed patterns
        const isAllowed = allowedOrigins.some(allowedOrigin => 
            origin.startsWith(allowedOrigin)
        );
        
        if (isAllowed || process.env.NODE_ENV !== 'production') {
            callback(null, true);
        } else {
            console.log('Blocked by CORS:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
        'Content-Type', 
        'Authorization', 
        'Accept',
        'X-Requested-With',
        'Access-Control-Allow-Credentials'
    ],
    exposedHeaders: ['set-cookie'],
    maxAge: 86400
}));

app.use(express.json())
app.use(cookieParser())
app.use(morgan())
app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false
}))

// Add a health check endpoint
app.get("/",(request,response)=>{
    // Add CORS headers directly to this route for extra safety
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    
    ///server to client
    response.json({
        message: "Server is running on port " + PORT,
        status: "online"
    })
})

// Add health check route
app.get('/api/health', (req, res) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'Server is running',
    success: true,
    error: false
  });
});

// Add a specific banner test endpoint that bypasses authentication
app.get("/api/banner-test", (request, response) => {
    response.header("Access-Control-Allow-Origin", "*");
    response.json({
        data: [
            {
                _id: "test-banner-1",
                title: "Test Banner 1",
                image: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
                description: "Test banner description",
                link: "",
                isActive: true,
                displayOrder: 1,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ],
        success: true,
        error: false
    });
});

app.use('/api/user',userRouter)
app.use("/api/category",categoryRouter)
app.use("/api/file",uploadRouter)
app.use("/api/subcategory",subCategoryRouter)
app.use("/api/product",productRouter)
app.use("/api/cart",cartRouter)
app.use("/api/address",addressRouter)
app.use("/api/order",orderRouter)
app.use("/api/banner",bannerRouter)
app.use("/api/featured-category",featuredCategoryRouter)
app.use("/api/vendor",vendorRouter)

connectDB().then(()=>{
    app.listen(PORT,()=>{
        console.log("Server is running on port",PORT)
    })
})
