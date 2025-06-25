import mongoose from "mongoose";

const featuredCategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    coverImage: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    products: [
        {
            type: mongoose.Schema.ObjectId,
            ref: "product"
        }
    ],
    displayOrder: {
        type: Number,
        default: 0
    },
    active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const FeaturedCategoryModel = mongoose.model('featuredCategory', featuredCategorySchema);

export default FeaturedCategoryModel; 