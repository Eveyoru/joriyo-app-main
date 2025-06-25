import mongoose from "mongoose";

const productVariationSchema = new mongoose.Schema({
    size: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        default: 0
    },
    sku: {
        type: String,
        default: ""
    }
}, { _id: true });

const productSchema = new mongoose.Schema({
    name : {
        type : String,
    },
    image : {
        type : Array,
        default : []
    },
    category : [
        {
            type : mongoose.Schema.ObjectId,
            ref : 'category'
        }
    ],
    subCategory : [
        {
            type : mongoose.Schema.ObjectId,
            ref : 'subCategory'
        }
    ],
    vendor : {
        type : mongoose.Schema.ObjectId,
        ref : 'vendor',
        default : null
    },
    unit : {
        type : String,
        default : ""
    },
    stock : {
        type : Number,
        default : null
    },
    price : {
        type : Number,
        defualt : null
    },
    discount : {
        type : Number,
        default : null
    },
    description : {
        type : String,
        default : ""
    },
    more_details : {
        type : Object,
        default : {}
    },
    hasVariations: {
        type: Boolean,
        default: false
    },
    variations: {
        type: [productVariationSchema],
        default: []
    },
    sizingType: {
        type: String,
        enum: ['none', 'clothing', 'shoes', 'custom'],
        default: 'none'
    },
    publish : {
        type : Boolean,
        default : true
    }
},{
    timestamps : true
})

// Create text index
// productSchema.index({
//     name: 'text',
//     description: 'text'
// }, {
//     weights: {
//         name: 10,
//         description: 5
//     }
// });

const ProductModel = mongoose.model('product', productSchema);

// Ensure text index exists when the model is created
// ProductModel.createIndexes().then(() => {
//     console.log('Text search indexes created successfully');
// }).catch(err => {
//     console.error('Error creating text search indexes:', err);
// });

export default ProductModel;