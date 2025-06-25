import React, { useEffect, useState } from 'react'
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees'
import { Link } from 'react-router-dom'
import { valideURLConvert } from '../utils/valideURLConvert'
import { pricewithDiscount } from '../utils/PriceWithDiscount'
import SummaryApi from '../common/SummaryApi'
import AxiosToastError from '../utils/AxiosToastError'
import Axios from '../utils/Axios'
import toast from 'react-hot-toast'
import { useGlobalContext } from '../provider/GlobalProvider'
import AddToCartButton from './AddToCartButton'

const CardProduct = ({data}) => {
    const url = `/product/${valideURLConvert(data.name)}-${data._id}`
    const [processedData, setProcessedData] = useState(data)
    
    // Process the product data to add default variation information
    useEffect(() => {
      try {
        // Make a copy of the original data
        const updatedData = {...data}
        
        // If the product has variations, find the default variation to use
        if (data.hasVariations === true && Array.isArray(data.variations) && data.variations.length > 0) {
          // Define default sizes to look for first (matching the product detail page)
          const defaultSizes = ['L', 'M', 'Medium', 'Regular', 'Standard']
          
          // Try to find a default size with stock
          let defaultVariation = null
          
          for (const defaultSize of defaultSizes) {
            const variation = data.variations.find(v => 
              v.size === defaultSize && v.stock > 0
            )
            if (variation) {
              defaultVariation = variation
              break
            }
          }
          
          // If no default size with stock found, find the lowest price variation with stock
          if (!defaultVariation) {
            const inStockVariations = data.variations.filter(v => v.stock > 0)
            
            if (inStockVariations.length > 0) {
              // Sort by price and get the lowest price variation
              defaultVariation = [...inStockVariations].sort((a, b) => a.price - b.price)[0]
            } else {
              // No variations with stock, just select the lowest price one
              defaultVariation = [...data.variations].sort((a, b) => a.price - b.price)[0]
            }
          }
          
          // Add the default variation to the product data
          if (defaultVariation) {
            updatedData.selectedVariationId = defaultVariation._id
            updatedData.selectedSize = defaultVariation.size
            updatedData.defaultVariation = defaultVariation
            
            // Determine if this product is out of stock based on variations
            updatedData.isOutOfStock = !data.variations.some(v => v.stock > 0)
          }
        }
        
        setProcessedData(updatedData)
      } catch (error) {
        console.error('Error processing product data:', error)
      }
    }, [data])
    
    // Debug product data when component mounts
    useEffect(() => {
      console.log('CardProduct data:', {
        id: processedData._id,
        name: processedData.name,
        hasVariations: processedData.hasVariations,
        selectedSize: processedData.selectedSize,
        variationsCount: processedData.variations ? processedData.variations.length : 0,
        isOutOfStock: isOutOfStock()
      })
    }, [processedData])
    
    // Get the display price based on variations
    const getDisplayPrice = () => {
      try {
        // If product has variations, use the default one or find the lowest price
        if (processedData.hasVariations === true && Array.isArray(processedData.variations) && processedData.variations.length > 0) {
          // If we have a default variation, use its price
          if (processedData.defaultVariation) {
            return pricewithDiscount(processedData.defaultVariation.price, processedData.discount)
          }
          
          // Otherwise get the lowest variation price
          const lowestPrice = Math.min(...processedData.variations.map(v => v.price || 0))
          return pricewithDiscount(lowestPrice, processedData.discount)
        }
        // Otherwise use the product's main price
        return pricewithDiscount(processedData.price, processedData.discount)
      } catch (error) {
        console.error('Error calculating display price:', error)
        // Fallback to product price if there's an error
        return processedData.price || 0
      }
    }
    
    // Get the original price (before discount)
    const getOriginalPrice = () => {
      try {
        // If product has variations, use the default one or find the lowest price
        if (processedData.hasVariations === true && Array.isArray(processedData.variations) && processedData.variations.length > 0) {
          // If we have a default variation, use its price
          if (processedData.defaultVariation) {
            return processedData.defaultVariation.price
          }
          
          return Math.min(...processedData.variations.map(v => v.price || 0))
        }
        return processedData.price || 0
      } catch (error) {
        console.error('Error calculating original price:', error)
        return processedData.price || 0
      }
    }
    
    // Determine if the product is out of stock
    const isOutOfStock = () => {
      try {
        // If we already calculated this in the processed data, use that
        if (typeof processedData.isOutOfStock === 'boolean') {
          return processedData.isOutOfStock
        }
        
        // For products with variations
        if (processedData.hasVariations === true && Array.isArray(processedData.variations) && processedData.variations.length > 0) {
          // If we have a default variation, check its stock
          if (processedData.defaultVariation) {
            return processedData.defaultVariation.stock <= 0
          }
          
          // Otherwise check if any variation has stock
          return !processedData.variations.some(v => v.stock > 0)
        }
        
        // For regular products
        return processedData.stock === 0
      } catch (error) {
        console.error('Error determining stock status:', error)
        return false // Default to in-stock if we can't determine
      }
    }
  
  return (
    <div className='border py-2 lg:p-4 grid gap-1 lg:gap-3 min-w-36 lg:min-w-52 rounded cursor-pointer bg-white'>
      <Link to={url} className='contents'>
        <div className='min-h-20 w-full max-h-24 lg:max-h-32 rounded overflow-hidden'>
          <img 
              src={processedData.image[0]}
              className='w-full h-full object-scale-down lg:scale-125'
          />
        </div>
        <div className='flex items-center gap-1'>
          <div className='rounded text-xs w-fit p-[1px] px-2 text-green-600 bg-green-50'>
                10 min 
          </div>
          <div>
              {
                Boolean(processedData.discount) && (
                  <p className='text-green-600 bg-green-100 px-2 w-fit text-xs rounded-full'>{processedData.discount}% discount</p>
                )
              }
          </div>
        </div>
        <div className='px-2 lg:px-0 font-medium text-ellipsis text-sm lg:text-base line-clamp-2'>
          {processedData.name}
        </div>
      </Link>
      <div className='px-2 lg:px-0 flex items-center justify-between gap-1 lg:gap-3 text-sm lg:text-base min-h-[3rem]'>
        <Link to={url} className='flex-1'>
          <div className='flex flex-col gap-0.5'>
            <div className='font-semibold'>
              {processedData.hasVariations === true && Array.isArray(processedData.variations) && processedData.variations.length > 0 ? (
                <span>From {DisplayPriceInRupees(getDisplayPrice())}</span>
              ) : (
                <span>{DisplayPriceInRupees(getDisplayPrice())}</span>
              )}
            </div>
            {Boolean(processedData.discount) && (
              <div className='text-gray-400 line-through text-xs'>
                {DisplayPriceInRupees(getOriginalPrice())}
              </div>
            )}
          </div>
        </Link>
        <div className='z-10'>
          {
            isOutOfStock() ? (
              <p className='text-red-500 text-sm text-center'>Out of stock</p>
            ) : (
              <AddToCartButton data={processedData} />
            )
          }
        </div>
      </div>
    </div>
  )
}

export default CardProduct
