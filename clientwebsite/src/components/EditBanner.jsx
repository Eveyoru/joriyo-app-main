import React, { useState } from 'react';
import Loading from './Loading';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';

const EditBanner = ({ close, fetchData, data }) => {
    const [image, setImage] = useState(data.image || "");
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState(data.title || "");
    const [description, setDescription] = useState(data.description || "");
    const [link, setLink] = useState(data.link || "");
    const [displayOrder, setDisplayOrder] = useState(data.displayOrder || 0);
    const [isActive, setIsActive] = useState(data.isActive !== undefined ? data.isActive : true);
    const [loading, setLoading] = useState(false);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const selectedFile = e.target.files[0];
            console.log("Selected file:", selectedFile.name, selectedFile.type, selectedFile.size);
            
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result);
            };
            reader.readAsDataURL(selectedFile);
            setFile(selectedFile);
        }
    };

    const handleUploadImage = async () => {
        if (!file) {
            return image; // If no new file selected, use existing image
        }

        try {
            setLoading(true);
            const formData = new FormData();
            
            // Removing Content-Type header from client side
            // Let the browser handle the proper multipart/form-data boundary
            formData.append("image", file);  
            
            console.log("Uploading file:", file.name, file.type, file.size);

            const response = await Axios({
                ...SummaryApi.uploadImage,
                data: formData
            });

            const { data: responseData } = response;
            console.log("Upload response:", responseData);
            
            if (responseData.success) {
                return responseData.data.secure_url;  
            }
            return image; // Fallback to existing image on error
        } catch (error) {
            console.error("Upload error:", error);
            AxiosToastError(error);
            return image; // Fallback to existing image on error
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title) {
            return toast.error("Title is required");
        }

        if (!image) {
            return toast.error("Image is required");
        }

        try {
            setLoading(true);
            const imageUrl = await handleUploadImage();

            if (!imageUrl) {
                setLoading(false);
                return toast.error("Failed to upload image");
            }

            const response = await Axios({
                ...SummaryApi.updateBanner,
                data: {
                    _id: data._id,
                    title,
                    image: imageUrl,
                    description,
                    link,
                    displayOrder: parseInt(displayOrder),
                    isActive
                }
            });

            const { data: responseData } = response;

            if (responseData.success) {
                toast.success(responseData.message || "Banner updated successfully");
                fetchData();
                close();
            }
        } catch (error) {
            AxiosToastError(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={(e) => e.target === e.currentTarget && close()}>
            <div className="bg-white rounded-lg p-5 w-full max-w-xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10">
                    <h2 className="text-lg font-semibold">Edit Banner</h2>
                    <button 
                        type="button"
                        onClick={close} 
                        className="text-gray-500 hover:text-gray-700 z-20"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Title <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            placeholder="Enter banner title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            className="w-full border rounded px-3 py-2"
                            placeholder="Enter banner description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows="3"
                        ></textarea>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Link URL</label>
                        <input
                            type="text"
                            className="w-full border rounded px-3 py-2"
                            placeholder="https://example.com/page"
                            value={link}
                            onChange={(e) => setLink(e.target.value)}
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Display Order</label>
                        <input
                            type="number"
                            className="w-full border rounded px-3 py-2"
                            value={displayOrder}
                            onChange={(e) => setDisplayOrder(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">Lower numbers will display first</p>
                    </div>

                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                checked={isActive}
                                onChange={(e) => setIsActive(e.target.checked)}
                                className="mr-2"
                            />
                            <span className="text-sm">Active</span>
                        </label>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Banner Image <span className="text-red-500">*</span></label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center relative">
                            <div className="relative">
                                {image && (
                                    <>
                                        <button
                                            type="button"
                                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 z-10"
                                            onClick={() => {
                                                setImage("");
                                                setFile(null);
                                            }}
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                        <img src={image} alt="Banner Preview" className="mx-auto max-h-64 object-contain" />
                                    </>
                                )}
                                
                                <div className="mt-3 text-xs bg-blue-50 p-2 rounded border border-blue-100">
                                    <p className="font-medium text-blue-700">Recommended Banner Sizes:</p>
                                    <p className="text-blue-600 mt-1">Desktop: 1280×400 pixels (16:5 ratio)</p>
                                    <p className="text-blue-600">Mobile: 640×640 pixels (1:1 ratio)</p>
                                </div>
                                
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={close}
                            className="px-4 py-2 border rounded text-gray-600 hover:bg-gray-100 z-10"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-primary-200 text-white rounded hover:bg-primary-300 disabled:opacity-70 z-10"
                            disabled={loading}
                        >
                            {loading ? "Updating..." : "Update Banner"}
                        </button>
                    </div>
                </form>
            </div>
            {loading && <Loading />}
        </div>
    );
};

export default EditBanner;
