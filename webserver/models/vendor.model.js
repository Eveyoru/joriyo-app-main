import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Vendor name is required'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String,
        required: [true, 'Vendor image is required']
    },
    coverImageUrl: {
        type: String
    },
    status: {
        type: Boolean,
        default: true
    },
    displayOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const VendorModel = mongoose.model('vendor', vendorSchema);

export default VendorModel; 