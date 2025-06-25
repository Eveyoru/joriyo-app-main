import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    },
    link: {
        type: String,
        default: ""
    },
    displayOrder: {
        type: Number,
        default: 0
    }
},{
    timestamps: true
});

const BannerModel = mongoose.model('banner', bannerSchema);

export default BannerModel;
