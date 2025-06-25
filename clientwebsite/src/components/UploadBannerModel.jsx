import React, { useState } from 'react';
import Loading from './Loading';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import toast from 'react-hot-toast';

const UploadBannerModel = ({ close, fetchData }) => {
    const [image, setImage] = useState("");
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [link, setLink] = useState("");
    const [displayOrder, setDisplayOrder] = useState(0);
    const [isActive, setIsActive] = useState(true);
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
            return toast.error("Please select an image");
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
            return null;
        } catch (error) {
            console.error("Upload error:", error);
            AxiosToastError(error);
            return null;
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
                ...SummaryApi.addBanner,
                data: {
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
                toast.success(responseData.message || "Banner added successfully");
                setTitle("");
                setImage("");
                setFile(null);
                setDescription("");
                setLink("");
                setDisplayOrder(0);
                setIsActive(true);
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
                    <h2 className="text-lg font-semibold">Add Banner</h2>
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
                            {!image ? (
                                <div className="text-center cursor-pointer">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto text-gray-400">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                                    </svg>
                                    <p className="mt-2 text-sm text-gray-500">Click or drag an image to upload</p>
                                    <p className="text-xs text-gray-400 mt-1">PNG, JPG, GIF up to 5MB</p>
                                    <div className="mt-3 text-xs bg-blue-50 p-2 rounded border border-blue-100">
                                        <p className="font-medium text-blue-700">Recommended Banner Sizes:</p>
                                        <p className="text-blue-600 mt-1">Desktop: 1280×400 pixels (16:5 ratio)</p>
                                        <p className="text-blue-600">Mobile: 640×640 pixels (1:1 ratio)</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="relative">
                                    <button
                                        type="button"
                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                        onClick={() => {
                                            setImage(null);
                                            setFile(null);
                                        }}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                    <img src={image} alt="Preview" className="w-full h-auto rounded" />
                                    <div className="mt-2 text-xs bg-blue-50 p-2 rounded border border-blue-100">
                                        <p className="font-medium text-blue-700">Recommended Banner Sizes:</p>
                                        <p className="text-blue-600 mt-1">Desktop: 1280×400 pixels (16:5 ratio)</p>
                                        <p className="text-blue-600">Mobile: 640×640 pixels (1:1 ratio)</p>
                                    </div>
                                </div>
                            )}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-0"
                            />
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
                            {loading ? "Saving..." : "Save Banner"}
                        </button>
                    </div>
                </form>
            </div>
            {loading && <Loading />}
        </div>
    );
};

export default UploadBannerModel;
