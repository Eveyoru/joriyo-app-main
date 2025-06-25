import React, { useState } from 'react'
import { IoClose } from "react-icons/io5";
import uploadImage from '../utils/UploadImage';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import toast from 'react-hot-toast'
import AxiosToastError from '../utils/AxiosToastError';

const EditCategory = ({close, fetchData,data : CategoryData}) => {
    const [data,setData] = useState({
        _id : CategoryData._id,
        name : CategoryData.name,
        image : CategoryData.image,
        displayOrder: CategoryData.displayOrder
    })
    const [loading,setLoading] = useState(false)

    const handleOnChange = (e)=>{
        const { name, value} = e.target

        setData((preve)=>{
            return{
                ...preve,
                [name] : value
            }
        })
    }
    const handleSubmit = async(e)=>{
        e.preventDefault()


        try {
            setLoading(true)
            const response = await Axios({
                ...SummaryApi.updateCategory,
                data : data
            })
            const { data : responseData } = response

            if(responseData.success){
                toast.success(responseData.message)
                close()
                fetchData()
            }
        } catch (error) {
            AxiosToastError(error)
        }finally{
            setLoading(false)
        }
    }
    const handleUploadCategoryImage = async(e)=>{
        const file = e.target.files[0]

        if(!file){
            return
        }
        setLoading(true)
        const response = await uploadImage(file)
        const { data : ImageResponse } = response
        setLoading(false)
        
        setData((preve)=>{
            return{
                ...preve,
                image : ImageResponse.data.url
            }
        })
    }

    const getNextDisplayOrder = async () => {
        try {
            const response = await Axios({
                ...SummaryApi.getCategory
            });
            const categories = response.data.data;
            const maxOrder = Math.max(...categories.map(cat => cat.displayOrder), -1);
            return maxOrder + 1;
        } catch (error) {
            return 0;
        }
    };

    const handleAutoAssignOrder = async () => {
        const nextOrder = await getNextDisplayOrder();
        setData(prev => ({
            ...prev,
            displayOrder: nextOrder
        }));
    };

  return (
    <section className='fixed top-0 bottom-0 left-0 right-0 p-4 bg-neutral-800 bg-opacity-60 flex items-center justify-center'>
    <div className='bg-white max-w-4xl w-full p-4 rounded'>
        <div className='flex items-center justify-between'>
            <h1 className='font-semibold'>Update Category</h1>
            <button onClick={close} className='w-fit block ml-auto'>
                <IoClose size={25}/>
            </button>
        </div>
        <form className='my-3 grid gap-2' onSubmit={handleSubmit}>
            <div className='grid gap-1'>
                <label id='categoryName'>Name</label>
                <input
                    type='text'
                    id='categoryName'
                    placeholder='Enter category name'
                    value={data.name}
                    name='name'
                    onChange={handleOnChange}
                    className='bg-blue-50 p-2 border border-blue-100 focus-within:border-primary-200 outline-none rounded'
                />
            </div>
            <div className='grid gap-1'>
                <label id='displayOrder'>Display Order</label>
                <div className='flex gap-2'>
                    <input
                        type='number'
                        id='displayOrder'
                        placeholder='Enter display order'
                        value={data.displayOrder}
                        name='displayOrder'
                        onChange={handleOnChange}
                        className='flex-1 bg-blue-50 p-2 border border-blue-100 focus-within:border-primary-200 outline-none rounded'
                    />
                    <button
                        type="button"
                        onClick={handleAutoAssignOrder}
                        className='px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm'
                    >
                        Auto-assign
                    </button>
                </div>
                <p className='text-xs text-gray-500'>Lower numbers will display first</p>
            </div>
            <div className='grid gap-1'>
                <p>Image</p>
                <div className='flex gap-4 flex-col lg:flex-row items-center'>
                    <div className='border bg-blue-50 h-36 w-full lg:w-36 flex items-center justify-center rounded'>
                        {
                            data.image ? (
                                <img
                                    alt='category'
                                    src={data.image}
                                    className='w-full h-full object-scale-down'
                                />
                            ) : (
                                <p className='text-sm text-neutral-500'>No Image</p>
                            )
                        }
                        
                    </div>
                    <label htmlFor='uploadCategoryImage'>
                        <div  className={`
                        ${!data.name ? "bg-gray-300" : "border-primary-200 hover:bg-primary-100" }  
                            px-4 py-2 rounded cursor-pointer border font-medium
                        `}>
                            {
                                loading ? "Loading..." : "Upload Image"
                            }
                           
                        </div>

                        <input disabled={!data.name} onChange={handleUploadCategoryImage} type='file' id='uploadCategoryImage' className='hidden'/>
                    </label>
                    
                </div>
            </div>

            <button
                className={`
                ${data.name && data.image ? "bg-primary-200 hover:bg-primary-100" : "bg-gray-300 "}
                py-2    
                font-semibold 
                `}
            >Update Category</button>
        </form>
    </div>
    </section>
  )
}

export default EditCategory
