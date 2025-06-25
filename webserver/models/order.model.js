import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.ObjectId,
        ref : 'User'
    },
    orderId : {
        type : String,
        required : [true, "Provide orderId"],
        unique : true
    },
    products : [{
        productId : {
            type : mongoose.Schema.ObjectId,
            ref : "product"
        },
        name : String,
        image : Array,
        quantity : {
            type : Number,
            default : 1
        },
        price : {
            type : Number,
            default : 0
        },
        variationId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        selectedSize: {
            type: String,
            default: null
        }
    }],
    paymentId : {
        type : String,
        default : ""
    },
    payment_status : {
        type : String,
        default : ""
    },
    status : {
        type : String,
        enum: ['pending', 'processing', 'delivered', 'cancelled'],
        default : 'pending'
    },
    delivery_address : {
        type : mongoose.Schema.ObjectId,
        ref : 'address'
    },
    subTotalAmt : {
        type : Number,
        default : 0
    },
    totalAmt : {
        type : Number,
        default : 0
    },
    invoice_receipt : {
        type : String,
        default : ""
    }
},{
    timestamps : true
})

const OrderModel = mongoose.model('order',orderSchema)

export default OrderModel