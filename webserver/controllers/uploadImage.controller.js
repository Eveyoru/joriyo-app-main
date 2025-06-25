import uploadImageClodinary from "../utils/uploadImageClodinary.js"

const uploadImageController = async(request, response) => {
    try {
        const file = request.file
        
        if (!file) {
            return response.status(400).json({
                message: "No image provided",
                error: true,
                success: false
            });
        }

        // Log for debugging
        console.log("File received:", {
            fieldname: file.fieldname,
            mimetype: file.mimetype,
            size: file.size
        });

        const uploadImage = await uploadImageClodinary(file)

        return response.json({
            message: "Upload done",
            data: uploadImage,
            success: true,
            error: false
        })
    } catch (error) {
        console.error("Image upload error:", error);
        return response.status(500).json({
            message: error.message || error,
            error: true,
            success: false
        })
    }
}

export default uploadImageController