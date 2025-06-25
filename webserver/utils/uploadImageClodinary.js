import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLOUD_NAME,
    api_key : process.env.CLOUDINARY_API_KEY,
    api_secret : process.env.CLOUDINARY_API_SECRET_KEY
})

const uploadImageClodinary = async(image)=>{
    if (!image) {
        throw new Error('No image provided');
    }
    
    // Use the buffer if available, otherwise check for arrayBuffer
    let buffer;
    
    if (image.buffer) {
        buffer = image.buffer;
    } else if (typeof image.arrayBuffer === 'function') {
        try {
            buffer = Buffer.from(await image.arrayBuffer());
        } catch (error) {
            throw new Error('Failed to process image buffer: ' + error.message);
        }
    } else {
        throw new Error('Invalid image format: No buffer available');
    }

    const uploadImage = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            { folder: "binkeyit" },
            (error, uploadResult) => {
                if (error) {
                    return reject(error);
                }
                return resolve(uploadResult);
            }
        ).end(buffer);
    });

    return uploadImage;
}

export default uploadImageClodinary
