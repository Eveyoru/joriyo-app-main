import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'
import SummaryApi from '../common/SummaryApi'
import CardLoading from './CardLoading'
import CardProduct from './CardProduct'
import { FaAngleLeft, FaAngleRight } from "react-icons/fa6";
import { useSelector } from 'react-redux'
import { valideURLConvert } from '../utils/valideURLConvert'
import { toast } from 'react-hot-toast'

const CategoryWiseProductDisplay = ({ id, name }) => {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const containerRef = useRef()
    const subCategoryData = useSelector(state => state.product.allSubCategory)
    const loadingCardNumber = new Array(6).fill(null)
    const navigate = useNavigate()

    const fetchCategoryWiseProduct = async () => {
        try {
            setLoading(true)
            console.log("Fetching products for category:", id)
            const response = await Axios({
                ...SummaryApi.getProductByCategory,
                data: {
                    categoryId: [id],
                    page: 1,
                    limit: 10
                }
            })

            const { data: responseData } = response
            console.log("Category products response:", responseData)

            if (responseData.success) {
                setData(responseData.data)
            }
        } catch (error) {
            console.error("Error fetching category products:", error)
            AxiosToastError(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (id) {
            fetchCategoryWiseProduct()
        } else {
            fetchAllCategories()
        }
    }, [id])

    const fetchAllCategories = async () => {
        try {
            setLoading(true)
            const response = await Axios.get('/api/category/get-active')
            
            if (response.data.success) {
                const categories = response.data.data
                console.log("Categories data:", categories)
                
                if (categories && categories.length > 0) {
                    // Select first category and fetch its products
                    const firstCategory = categories[0]
                    console.log("Selected first category:", firstCategory)
                    
                    // Update component state to show category name
                    setData({ name: firstCategory.name })
                    
                    // Fetch products for this category
                    const productsResponse = await Axios({
                        ...SummaryApi.getProductByCategory,
                        data: {
                            categoryId: [firstCategory._id],
                            page: 1,
                            limit: 10
                        }
                    })
                    
                    console.log("Products response:", productsResponse.data)
                    
                    if (productsResponse.data.success) {
                        setData(productsResponse.data.data)
                    }
                }
            } else {
                console.error("Failed to fetch categories:", response.data.message)
                toast.error('Failed to fetch categories')
            }
        } catch (error) {
            console.error('Error fetching categories:', error)
            toast.error('Something went wrong while fetching categories')
        } finally {
            setLoading(false)
        }
    }

    const handleScrollRight = () => {
        containerRef.current.scrollLeft += 200
    }

    const handleScrollLeft = () => {
        containerRef.current.scrollLeft -= 200
    }

    const handleRedirectProductListpage = () => {
        // Find subcategory with lowest displayOrder for this category
        const subcategory = subCategoryData.filter(s => {
            return s.category.some(c => c._id === id);
        }).sort((a, b) => a.displayOrder - b.displayOrder)[0];

        if (subcategory) {
            const url = `/${valideURLConvert(name)}-${id}/${valideURLConvert(subcategory.name)}-${subcategory._id}`;
            return url;
        }
        return '#';
    }

    const handleViewAllProduct = () => {
        navigate(`/product-list/${id}/${name}`)
    }

    const redirectURL = handleRedirectProductListpage()

    if (loading) {
        return (
            <div className="container mx-auto px-4 my-8 animate-pulse">
                <div className="h-8 w-48 bg-gray-200 rounded mb-4"></div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, index) => (
                        <div key={index} className="bg-gray-200 h-64 rounded"></div>
                    ))}
                </div>
            </div>
        )
    }

    if (!data || data.length === 0) {
        return null; // Don't show empty categories
    }

    return (
        <div>
            <div className='container mx-auto p-4 flex items-center justify-between gap-4'>
                <h3 className='font-semibold text-lg md:text-xl'>{name}</h3>
                {id && (
                    <button
                        onClick={handleViewAllProduct}
                        className='text-green-600 hover:text-green-800 text-sm font-medium'
                    >
                        View All
                    </button>
                )}
            </div>
            <div className='relative flex items-center '>
                <div className=' flex gap-4 md:gap-6 lg:gap-8 container mx-auto px-4 overflow-x-scroll scrollbar-none scroll-smooth' ref={containerRef}>
                    {loading &&
                        loadingCardNumber.map((_, index) => {
                            return (
                                <CardLoading key={"CategorywiseProductDisplay123" + index} />
                            )
                        })
                    }

                    {
                        data.map((p, index) => {
                            return (
                                <CardProduct
                                    data={p}
                                    key={p._id + "CategorywiseProductDisplay" + index}
                                />
                            )
                        })
                    }

                </div>
                <div className='w-full left-0 right-0 container mx-auto  px-2  absolute hidden lg:flex justify-between'>
                    <button onClick={handleScrollLeft} className='z-10 relative bg-white hover:bg-gray-100 shadow-lg text-lg p-2 rounded-full'>
                        <FaAngleLeft />
                    </button>
                    <button onClick={handleScrollRight} className='z-10 relative  bg-white hover:bg-gray-100 shadow-lg p-2 text-lg rounded-full'>
                        <FaAngleRight />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default CategoryWiseProductDisplay
