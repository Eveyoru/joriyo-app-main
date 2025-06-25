import React, { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import SummaryApi from '../common/SummaryApi'
import Axios from '../utils/Axios'
import AxiosToastError from '../utils/AxiosToastError'
import { FaAngleRight,FaAngleLeft, FaStore } from "react-icons/fa6";
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import Divider from '../components/Divider'
import image1 from '../assets/minute_delivery.png'
import image2 from '../assets/Best_Prices_Offers.png'
import image3 from '../assets/Wide_Assortment.png'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import AddToCartButton from '../components/AddToCartButton'
import { useGlobalContext } from '../provider/GlobalProvider'

const ProductDisplayPage = () => {
  const params = useParams()
  let productId = params?.product?.split("-")?.slice(-1)[0]
  const [data,setData] = useState({
    name: "",
    image: [],
    hasVariations: false,
    variations: []
  })
  const [image,setImage] = useState(0)
  const [loading,setLoading] = useState(false)
  const imageContainer = useRef()
  const [selectedVariation, setSelectedVariation] = useState(null)
  const { updateGlobalData } = useGlobalContext()

  const fetchProductDetails = async()=>{
    try {
        setLoading(true);
        const response = await Axios({
          ...SummaryApi.getProductDetails,
          data : {
            productId : productId 
          }
        })

        const { data : responseData } = response

        if(responseData.success){
          console.log("Product details:", responseData.data);
          // Check vendor data specifically
          if (responseData.data.vendor) {
            console.log("Vendor data:", responseData.data.vendor);
          } else {
            console.log("No vendor data available for this product");
          }
          setData(responseData.data)
          
          // If product has variations, select the first available one by default
          if (responseData.data.hasVariations && responseData.data.variations && responseData.data.variations.length > 0) {
            // First try to find a variation with stock
            const inStockVariation = responseData.data.variations.find(v => v.stock > 0);
            
            // If we can't find one with stock, or if we want to select the lowest price variation instead
            if (inStockVariation) {
              setSelectedVariation(inStockVariation);
            } else {
              // Find the variation with the lowest price
              const lowestPriceVariation = [...responseData.data.variations].sort((a, b) => a.price - b.price)[0];
              setSelectedVariation(lowestPriceVariation);
            }
          }
        }
    } catch (error) {
      console.error("Error fetching product details:", error);
      AxiosToastError(error)
    }finally{
      setLoading(false)
    }
  }

  useEffect(()=>{
    fetchProductDetails()
  },[params])
  
  const handleScrollRight = ()=>{
    imageContainer.current.scrollLeft += 100
  }
  const handleScrollLeft = ()=>{
    imageContainer.current.scrollLeft -= 100
  }
  
  // Handle variation selection
  const handleSelectVariation = (variation) => {
    setSelectedVariation(variation);
  }
  
  // Get the price to display based on whether the product has variations
  const getDisplayPrice = () => {
    if (data.hasVariations) {
      if (selectedVariation) {
        return pricewithDiscount(selectedVariation.price, data.discount);
      }
      
      // If no variation is selected but we have variations, show the lowest price
      if (data.variations && data.variations.length > 0) {
        const lowestPrice = Math.min(...data.variations.map(v => v.price));
        return pricewithDiscount(lowestPrice, data.discount);
      }
      
      return 0; // No variations available
    } else {
      return pricewithDiscount(data.price, data.discount);
    }
  }
  
  // Get the original price (before discount)
  const getOriginalPrice = () => {
    if (data.hasVariations) {
      if (selectedVariation) {
        return selectedVariation.price;
      }
      
      // If no variation is selected but we have variations, show the lowest price
      if (data.variations && data.variations.length > 0) {
        return Math.min(...data.variations.map(v => v.price));
      }
      
      return 0; // No variations available
    } else {
      return data.price;
    }
  }
  
  // Check if the product or selected variation is in stock
  const isInStock = () => {
    if (data.hasVariations) {
      return selectedVariation && selectedVariation.stock > 0;
    } else {
      return data.stock > 0;
    }
  }
  
  // Get the stock count
  const getStockCount = () => {
    if (data.hasVariations) {
      return selectedVariation ? selectedVariation.stock : 0;
    } else {
      return data.stock;
    }
  }
  
  // Prepare product data for AddToCartButton with the selected variation
  const getProductWithSelectedVariation = () => {
    if (data.hasVariations && selectedVariation) {
      return {
        ...data,
        selectedVariationId: selectedVariation._id,
        selectedSize: selectedVariation.size
      };
    }
    return data;
  }
  
  console.log("product data",data)
  
  return (
    <section className='grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-4'>
        <div className='p-2 lg:p-5 grid gap-3'>
            <div className='min-h-64 max-h-64 flex justify-center overflow-hidden rounded'>
                <img 
                    src={data.image[image]}
                    className='rounded w-full h-full object-contain'
                />
            </div>
            <div className='relative'>
                <div ref={imageContainer} className='py-1 overflow-x-auto flex gap-4 lg:justify-center'>
                    {
                        data.image.map((element,index)=>{
                            return(
                                <img 
                                    key={index}
                                    src={element}
                                    onClick={()=>setImage(index)}
                                    className={`w-16 h-16 cursor-pointer object-cover border-2 rounded ${index === image ? "border-green-600" : "border-transparent"}` }
                                />
                            )
                        })
                    }
                </div>
                <div className='w-full -ml-3 h-full hidden lg:flex justify-between absolute  items-center'>
                    <button onClick={handleScrollLeft} className='z-10 bg-white relative p-1 rounded-full shadow-lg'>
                        <FaAngleLeft/>
                    </button>
                    <button onClick={handleScrollRight} className='z-10 bg-white relative p-1 rounded-full shadow-lg'>
                        <FaAngleRight/>
                    </button>
                </div>
            </div>
            <div>
            </div>

            <div className='my-4  hidden lg:grid gap-3 '>
                <div>
                    <p className='font-semibold'>Description</p>
                    <p className='text-base'>{data.description}</p>
                </div>
                <div>
                    <p className='font-semibold'>Unit</p>
                    <p className='text-base'>{data.unit}</p>
                </div>
                {
                  data?.more_details && Object.keys(data?.more_details).map((element,index)=>{
                    return(
                      <div>
                          <p className='font-semibold'>{element}</p>
                          <p className='text-base'>{data?.more_details[element]}</p>
                      </div>
                    )
                  })
                }
            </div>
        </div>


        <div className='p-4 lg:pl-7 text-base lg:text-lg'>
            <p className='bg-green-300 w-fit px-2 rounded-full'>10 Min</p>
            <h2 className='text-lg font-semibold lg:text-3xl'>{data.name}</h2>  
            <p className=''>{data.unit}</p> 
            <Divider/>
            
            {/* Size variations selection */}
            {data.hasVariations && data.variations && data.variations.length > 0 && (
              <div className="mb-4">
                <p className="font-medium mb-2">Select Size:</p>
                <div className="flex flex-wrap gap-2">
                  {data.variations
                    // Sort by price to show lowest prices first
                    .sort((a, b) => a.price - b.price)
                    .map((variation) => (
                      <button
                        key={variation._id}
                        onClick={() => handleSelectVariation(variation)}
                        className={`px-4 py-2 border rounded-md ${
                          selectedVariation && selectedVariation._id === variation._id
                            ? 'bg-green-600 text-white'
                            : 'bg-white'
                        } ${
                          variation.stock <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-50'
                        }`}
                        disabled={variation.stock <= 0}
                      >
                        {variation.size}
                        {variation.stock <= 0 && <span className="ml-1">(Out of stock)</span>}
                        <div className="text-xs mt-1">₹{variation.price}</div>
                      </button>
                    ))}
                </div>
              </div>
            )}
            
            <div>
              <p className=''>Price</p> 
              <div className='flex items-center gap-2 lg:gap-4'>
                <div className='border border-green-600 px-4 py-2 rounded bg-green-50 w-fit'>
                    <p className='font-semibold text-lg lg:text-xl'>{DisplayPriceInRupees(getDisplayPrice())}</p>
                </div>
                {
                  data.discount && (
                    <p className='line-through'>{DisplayPriceInRupees(getOriginalPrice())}</p>
                  )
                }
                {
                  data.discount && (
                    <p className="font-bold text-green-600 lg:text-2xl">{data.discount}% <span className='text-base text-neutral-500'>Discount</span></p>
                  )
                }
              </div>

              {/* Stock information */}
              <div className='my-2'>
                {getStockCount() <= 0 ? (
                  <p className='text-red-500 font-medium'>Out of stock</p>
                ) : getStockCount() <= 5 ? (
                  <p className='text-orange-500 font-medium'>Only {getStockCount()} left in stock - order soon</p>
                ) : (
                  <p className='text-green-600 font-medium'>In Stock</p>
                )}
              </div>

              {/* Add to cart button */}
              <div className='my-4'>
                {isInStock() ? (
                  <AddToCartButton 
                    data={{
                      ...data,
                      selectedVariationId: selectedVariation?._id,
                      selectedSize: selectedVariation?.size,
                      // Pass a flag to indicate we want to skip the modal
                      skipVariationModal: data.hasVariations && selectedVariation != null
                    }} 
                  />
                ) : (
                  <button disabled className='bg-gray-400 text-white px-6 py-2 rounded opacity-70 cursor-not-allowed'>
                    Out of Stock
                  </button>
                )}
              </div>

              {data.vendor && typeof data.vendor === 'object' && (
                <div className="my-4 p-3 border rounded-md bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <FaStore className="text-gray-600" />
                    <h3 className="font-medium">Sold by: {data.vendor.name}</h3>
                  </div>
                  {data.vendor.description && (
                    <p className="text-sm text-gray-600">{data.vendor.description}</p>
                  )}
                  <Link 
                    to={`/vendor/${data.vendor._id}`}
                    className="mt-2 text-sm text-blue-600 hover:underline inline-block"
                  >
                    View all products from this vendor
                  </Link>
                </div>
              )}

              <div className='flex items-center my-5 gap-3 justify-around'>
                <img src={image1} className='w-16 h-16 min-w-16 min-h-16' alt='delivery image' />
                <img src={image2} className='w-16 h-16 min-w-16 min-h-16' alt='prices image' />
                <img src={image3} className='w-16 h-16 min-w-16 min-h-16' alt='assortment image' />
              </div>
            </div>

            <div className='my-4 grid gap-3 '>
                <div>
                    <p className='font-semibold'>Description</p>
                    <p className='text-base'>{data.description}</p>
                </div>
                <div>
                    <p className='font-semibold'>Unit</p>
                    <p className='text-base'>{data.unit}</p>
                </div>
                {
                  data?.more_details && Object.keys(data?.more_details).map((element,index)=>{
                    return(
                      <div>
                          <p className='font-semibold'>{element}</p>
                          <p className='text-base'>{data?.more_details[element]}</p>
                      </div>
                    )
                  })
                }
            </div>
        </div>
    </section>
  )
}

export default ProductDisplayPage
