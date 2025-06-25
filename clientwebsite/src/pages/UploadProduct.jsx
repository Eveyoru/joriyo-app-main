import React, { useState, useEffect } from 'react'
import { FaCloudUploadAlt, FaPlus, FaTrash } from "react-icons/fa";
import uploadImage from '../utils/UploadImage';
import Loading from '../components/Loading';
import ViewImage from '../components/ViewImage';
import { MdDelete } from "react-icons/md";
import { useSelector } from 'react-redux'
import { IoClose } from "react-icons/io5";
import AddFieldComponent from '../components/AddFieldComponent';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import successAlert from '../utils/SuccessAlert';

// Predefined size templates
const SIZE_TEMPLATES = {
  clothing: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
  shoes: ['6', '7', '8', '9', '10', '11', '12']
};

const UploadProduct = () => {
  const [data,setData] = useState({
      name : "",
      image : [],
      category : [],
      subCategory : [],
      vendor: null,
      unit : "",
      stock : "",
      price : "",
      discount : "",
      description : "",
      more_details : {},
      hasVariations: false,
      variations: [],
      sizingType: 'none'
  })
  const [imageLoading,setImageLoading] = useState(false)
  const [ViewImageURL,setViewImageURL] = useState("")
  const allCategory = useSelector(state => state.product.allCategory)
  const [selectCategory,setSelectCategory] = useState("")
  const [selectSubCategory,setSelectSubCategory] = useState("")
  const allSubCategory = useSelector(state => state.product.allSubCategory)
  const [vendors, setVendors] = useState([])
  const [loadingVendors, setLoadingVendors] = useState(false)
  const [selectVendor, setSelectVendor] = useState("")

  const [openAddField,setOpenAddField] = useState(false)
  const [fieldName,setFieldName] = useState("")

  // Add new state for custom template options
  const [templateOptions, setTemplateOptions] = useState({
    shoesStart: 6,
    shoesEnd: 12,
    shoesIncrement: 1,
    clothingSizes: 'XS,S,M,L,XL,XXL'
  });

  useEffect(() => {
    fetchVendors()
  }, [])

  const fetchVendors = async () => {
    try {
      setLoadingVendors(true)
      const response = await Axios({
        ...SummaryApi.getVendors
      })
      const { data: responseData } = response
      if (responseData.success) {
        setVendors(responseData.data)
      }
    } catch (error) {
      AxiosToastError(error)
    } finally {
      setLoadingVendors(false)
    }
  }

  const handleChange = (e)=>{
    const { name, value} = e.target 

    setData((preve)=>{
      return{
          ...preve,
          [name]  : value
      }
    })
  }

  const handleUploadImage = async(e)=>{
    const file = e.target.files[0]

    if(!file){
      return 
    }
    setImageLoading(true)
    const response = await uploadImage(file)
    const { data : ImageResponse } = response
    const imageUrl = ImageResponse.data.url 

    setData((preve)=>{
      return{
        ...preve,
        image : [...preve.image,imageUrl]
      }
    })
    setImageLoading(false)

  }

  const handleDeleteImage = async(index)=>{
      data.image.splice(index,1)
      setData((preve)=>{
        return{
            ...preve
        }
      })
  }

  const handleRemoveCategory = async(index)=>{
    data.category.splice(index,1)
    setData((preve)=>{
      return{
        ...preve
      }
    })
  }
  const handleRemoveSubCategory = async(index)=>{
      data.subCategory.splice(index,1)
      setData((preve)=>{
        return{
          ...preve
        }
      })
  }

  const handleAddField = ()=>{
    setData((preve)=>{
      return{
          ...preve,
          more_details : {
            ...preve.more_details,
            [fieldName] : ""
          }
      }
    })
    setFieldName("")
    setOpenAddField(false)
  }

  const handleSubmit = async(e)=>{
    e.preventDefault()
    console.log("data",data)

    try {
      const response = await Axios({
          ...SummaryApi.createProduct,
          data : data
      })
      const { data : responseData} = response

      if(responseData.success){
          successAlert(responseData.message)
          setData({
            name : "",
            image : [],
            category : [],
            subCategory : [],
            vendor: null,
            unit : "",
            stock : "",
            price : "",
            discount : "",
            description : "",
            more_details : {},
            hasVariations: false,
            variations: [],
            sizingType: 'none'
          })

      }
    } catch (error) {
        AxiosToastError(error)
    }


  }

  const handleVendorSelect = () => {
    if (selectVendor) {
      setData(prev => ({
        ...prev,
        vendor: selectVendor
      }))
      setSelectVendor("")
    }
  }

  // Function to generate custom size ranges
  const generateSizeRange = (type) => {
    if (type === 'shoes') {
      const sizes = [];
      for (
        let size = Number(templateOptions.shoesStart); 
        size <= Number(templateOptions.shoesEnd); 
        size += Number(templateOptions.shoesIncrement)
      ) {
        // Handle half sizes correctly
        sizes.push(Number.isInteger(size) ? size.toString() : size.toFixed(1));
      }
      return sizes;
    } else if (type === 'clothing') {
      return templateOptions.clothingSizes.split(',').map(size => size.trim());
    }
    return [];
  };

  // Modified function to handle template selection with custom options
  const handleTemplateSelection = (type) => {
    let newVariations = [];
    
    if (type === 'clothing' || type === 'shoes') {
      const sizes = generateSizeRange(type);
      newVariations = sizes.map(size => ({
        size,
        price: data.price || 0,
        stock: 0
      }));
    }
    
    setData(prev => ({
      ...prev,
      sizingType: type,
      variations: newVariations
    }));
  };

  return (
    <section className=''>
        <div className='p-2   bg-white shadow-md flex items-center justify-between'>
            <h2 className='font-semibold'>Upload Product</h2>
        </div>
        <div className='grid p-3'>
            <form className='grid gap-4' onSubmit={handleSubmit}>
                <div className='grid gap-1'>
                  <label htmlFor='name' className='font-medium'>Name</label>
                  <input 
                    id='name'
                    type='text'
                    placeholder='Enter product name'
                    name='name'
                    value={data.name}
                    onChange={handleChange}
                    required
                    className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded'
                  />
                </div>
                <div className='grid gap-1'>
                  <label htmlFor='description' className='font-medium'>Description</label>
                  <textarea 
                    id='description'
                    type='text'
                    placeholder='Enter product description'
                    name='description'
                    value={data.description}
                    onChange={handleChange}
                    required
                    multiple 
                    rows={3}
                    className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded resize-none'
                  />
                </div>
                <div>
                    <p className='font-medium'>Image</p>
                    <div>
                      <label htmlFor='productImage' className='bg-blue-50 h-24 border rounded flex justify-center items-center cursor-pointer'>
                          <div className='text-center flex justify-center items-center flex-col'>
                            {
                              imageLoading ?  <Loading/> : (
                                <>
                                   <FaCloudUploadAlt size={35}/>
                                   <p>Upload Image</p>
                                </>
                              )
                            }
                          </div>
                          <input 
                            type='file'
                            id='productImage'
                            className='hidden'
                            accept='image/*'
                            onChange={handleUploadImage}
                          />
                      </label>
                      {/**display uploded image*/}
                      <div className='flex flex-wrap gap-4'>
                        {
                          data.image.map((img,index) =>{
                              return(
                                <div key={img+index} className='h-20 mt-1 w-20 min-w-20 bg-blue-50 border relative group'>
                                  <img
                                    src={img}
                                    alt={img}
                                    className='w-full h-full object-scale-down cursor-pointer' 
                                    onClick={()=>setViewImageURL(img)}
                                  />
                                  <div onClick={()=>handleDeleteImage(index)} className='absolute bottom-0 right-0 p-1 bg-red-600 hover:bg-red-600 rounded text-white hidden group-hover:block cursor-pointer'>
                                    <MdDelete/>
                                  </div>
                                </div>
                              )
                          })
                        }
                      </div>
                    </div>

                </div>
                <div className='grid md:grid-cols-2 gap-3'>
                  <div className='grid gap-1'>
                    <label htmlFor='unit' className='font-medium'>Unit</label>
                    <input 
                      id='unit'
                      type='text'
                      placeholder='Enter product unit'
                      name='unit'
                      value={data.unit}
                      onChange={handleChange}
                      required
                      className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded'
                    />
                  </div>
                  
                  {/* Product Variations Toggle */}
                  <div className="flex items-center mb-2 mt-2">
                    <label className="inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={data.hasVariations}
                        onChange={() => {
                          setData(prev => ({
                            ...prev,
                            hasVariations: !prev.hasVariations
                          }));
                        }}
                      />
                      <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ms-3 text-sm font-medium">Product Has Size Variations</span>
                    </label>
                  </div>
                  
                  {/* Show size options if variations are enabled */}
                  {data.hasVariations && (
                    <div className="border p-4 rounded-md bg-gray-50">
                      <h3 className="font-semibold text-lg mb-3">Size Variations</h3>
                      
                      {/* Sizing Type Selection */}
                      <div className="mb-4">
                        <label className="block mb-2 font-medium">Select Size Type</label>
                        <select
                          value={data.sizingType}
                          onChange={(e) => {
                            const selectedType = e.target.value;
                            setData(prev => ({
                              ...prev,
                              sizingType: selectedType
                            }));
                            if (selectedType !== 'custom') {
                              handleTemplateSelection(selectedType);
                            }
                          }}
                          className="bg-blue-50 p-2 w-full outline-none border focus-within:border-primary-200 rounded"
                        >
                          <option value="custom">Custom Sizes</option>
                          <option value="clothing">Clothing Sizes</option>
                          <option value="shoes">Shoe Sizes</option>
                        </select>
                      </div>
                      
                      {/* Template Customization */}
                      {data.sizingType === 'shoes' && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-md">
                          <h4 className="font-medium mb-2">Customize Shoe Sizes</h4>
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="block text-sm mb-1">Start Size</label>
                              <input
                                type="number"
                                step="0.5"
                                value={templateOptions.shoesStart}
                                onChange={(e) => {
                                  setTemplateOptions({
                                    ...templateOptions,
                                    shoesStart: e.target.value
                                  });
                                }}
                                className="bg-white p-2 w-full outline-none border focus-within:border-primary-200 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-sm mb-1">End Size</label>
                              <input
                                type="number"
                                step="0.5"
                                value={templateOptions.shoesEnd}
                                onChange={(e) => {
                                  setTemplateOptions({
                                    ...templateOptions,
                                    shoesEnd: e.target.value
                                  });
                                }}
                                className="bg-white p-2 w-full outline-none border focus-within:border-primary-200 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-sm mb-1">Increment</label>
                              <input
                                type="number"
                                step="0.5"
                                value={templateOptions.shoesIncrement}
                                onChange={(e) => {
                                  setTemplateOptions({
                                    ...templateOptions,
                                    shoesIncrement: e.target.value
                                  });
                                }}
                                className="bg-white p-2 w-full outline-none border focus-within:border-primary-200 rounded"
                              />
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleTemplateSelection('shoes')}
                            className="mt-3 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            Generate Sizes
                          </button>
                        </div>
                      )}
                      
                      {data.sizingType === 'clothing' && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-md">
                          <h4 className="font-medium mb-2">Customize Clothing Sizes</h4>
                          <div>
                            <label className="block text-sm mb-1">Size List (comma-separated)</label>
                            <input
                              type="text"
                              value={templateOptions.clothingSizes}
                              onChange={(e) => {
                                setTemplateOptions({
                                  ...templateOptions,
                                  clothingSizes: e.target.value
                                });
                              }}
                              className="bg-white p-2 w-full outline-none border focus-within:border-primary-200 rounded"
                              placeholder="XS,S,M,L,XL,XXL"
                            />
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleTemplateSelection('clothing')}
                            className="mt-3 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            Generate Sizes
                          </button>
                        </div>
                      )}
                      
                      {/* Custom Size Form */}
                      {data.sizingType === 'custom' && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Add Custom Size</h4>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <div>
                              <label className="block text-sm mb-1">Size</label>
                              <input
                                type="text"
                                placeholder="Size (e.g. M, XL, 42)"
                                value={data.newSize || ""}
                                onChange={(e) => setData({...data, newSize: e.target.value})}
                                className="bg-blue-50 p-2 w-full outline-none border focus-within:border-primary-200 rounded"
                              />
                            </div>
                            <div>
                              <label className="block text-sm mb-1">Price</label>
                              <input
                                type="number"
                                placeholder="Price"
                                value={data.newPrice || ""}
                                onChange={(e) => setData({...data, newPrice: e.target.value})}
                                className="bg-blue-50 p-2 w-full outline-none border focus-within:border-primary-200 rounded"
                                min="0"
                              />
                            </div>
                            <div>
                              <label className="block text-sm mb-1">Stock</label>
                              <input
                                type="number"
                                placeholder="Stock"
                                value={data.newStock || ""}
                                onChange={(e) => setData({...data, newStock: e.target.value})}
                                className="bg-blue-50 p-2 w-full outline-none border focus-within:border-primary-200 rounded"
                                min="0"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (!data.newSize || !data.newPrice) {
                                alert("Size and price are required");
                                return;
                              }
                              
                              // Check if size already exists
                              if (data.variations.some(v => v.size === data.newSize)) {
                                alert(`Size "${data.newSize}" already exists`);
                                return;
                              }
                              
                              const newVariation = {
                                size: data.newSize,
                                price: Number(data.newPrice),
                                stock: Number(data.newStock || 0)
                              };
                              
                              setData(prev => ({
                                ...prev,
                                variations: [...prev.variations, newVariation],
                                newSize: "",
                                newPrice: "",
                                newStock: ""
                              }));
                            }}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 mt-2"
                          >
                            Add Size
                          </button>
                        </div>
                      )}
                      
                      {/* Variations List */}
                      {data.variations.length > 0 ? (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Size Variations</h4>
                          <div className="grid grid-cols-4 gap-2 font-medium mb-1 px-2">
                            <div>Size</div>
                            <div>Price</div>
                            <div>Stock</div>
                            <div>Actions</div>
                          </div>
                          {data.variations.map((variation, index) => (
                            <div key={`variation-${index}`} className="grid grid-cols-4 gap-2 mb-2 items-center bg-white p-2 rounded">
                              <div>
                                <input
                                  type="text"
                                  value={variation.size}
                                  onChange={(e) => {
                                    const updatedVariations = [...data.variations];
                                    updatedVariations[index].size = e.target.value;
                                    setData({...data, variations: updatedVariations});
                                  }}
                                  className="bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded w-full"
                                  placeholder="Size name"
                                />
                              </div>
                              <input
                                type="number"
                                value={variation.price}
                                onChange={(e) => {
                                  const updatedVariations = [...data.variations];
                                  updatedVariations[index].price = Number(e.target.value);
                                  setData({...data, variations: updatedVariations});
                                }}
                                className="bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded"
                                min="0"
                              />
                              <input
                                type="number"
                                value={variation.stock}
                                onChange={(e) => {
                                  const updatedVariations = [...data.variations];
                                  updatedVariations[index].stock = Number(e.target.value);
                                  setData({...data, variations: updatedVariations});
                                }}
                                className="bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded"
                                min="0"
                              />
                              <div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updatedVariations = [...data.variations];
                                    updatedVariations.splice(index, 1);
                                    setData({...data, variations: updatedVariations});
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 italic">No variations added yet</p>
                      )}
                    </div>
                  )}
                  
                  {/* Only show stock and price fields if variations are disabled */}
                  {!data.hasVariations && (
                    <>
                      <div className='grid gap-1'>
                        <label htmlFor='stock' className='font-medium flex items-center'>
                          Stock* <span className="text-xs text-gray-500 ml-1">(Required)</span>
                        </label>
                        <div className="relative">
                          <input 
                            id='stock'
                            type='number'
                            placeholder='Enter available stock quantity'
                            name='stock'
                            value={data.stock}
                            onChange={handleChange}
                            required
                            min="0"
                            className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded w-full'
                          />
                          <div className="text-xs text-gray-500 mt-1">
                            Set to 0 for out-of-stock products. Stock will decrease automatically as orders are placed.
                          </div>
                        </div>
                      </div>
                      
                      <div className='grid gap-1'>
                        <label htmlFor='price' className='font-medium'>Price</label>
                        <input 
                          id='price'
                          type='number'
                          placeholder='Enter product price'
                          name='price'
                          value={data.price}
                          onChange={handleChange}
                          required
                          className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded'
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className='grid gap-1'>
                  <label className='font-medium'>Category</label>
                  <div>
                    <select
                      className='bg-blue-50 border w-full p-2 rounded'
                      value={selectCategory}
                      onChange={(e)=>{
                        const value = e.target.value 
                        const category = allCategory.find(el => el._id === value )
                        
                        setData((preve)=>{
                          return{
                            ...preve,
                            category : [...preve.category,category],
                          }
                        })
                        setSelectCategory("")
                      }}
                    >
                      <option value={""}>Select Category</option>
                      {
                        allCategory.map((c,index)=>{
                          return(
                            <option value={c?._id}>{c.name}</option>
                          )
                        })
                      }
                    </select>
                    <div className='flex flex-wrap gap-3'>
                      {
                        data.category.map((c,index)=>{
                          return(
                            <div key={c._id+index+"productsection"} className='text-sm flex items-center gap-1 bg-blue-50 mt-2'>
                              <p>{c.name}</p>
                              <div className='hover:text-red-500 cursor-pointer' onClick={()=>handleRemoveCategory(index)}>
                                <IoClose size={20}/>
                              </div>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>
                </div>
                <div className='grid gap-1'>
                  <label className='font-medium'>Sub Category</label>
                  <div>
                    <select
                      className='bg-blue-50 border w-full p-2 rounded'
                      value={selectSubCategory}
                      onChange={(e)=>{
                        const value = e.target.value 
                        const subCategory = allSubCategory.find(el => el._id === value )

                        setData((preve)=>{
                          return{
                            ...preve,
                            subCategory : [...preve.subCategory,subCategory]
                          }
                        })
                        setSelectSubCategory("")
                      }}
                    >
                      <option value={""} className='text-neutral-600'>Select Sub Category</option>
                      {
                        allSubCategory.map((c,index)=>{
                          return(
                            <option value={c?._id}>{c.name}</option>
                          )
                        })
                      }
                    </select>
                    <div className='flex flex-wrap gap-3'>
                      {
                        data.subCategory.map((c,index)=>{
                          return(
                            <div key={c._id+index+"productsection"} className='text-sm flex items-center gap-1 bg-blue-50 mt-2'>
                              <p>{c.name}</p>
                              <div className='hover:text-red-500 cursor-pointer' onClick={()=>handleRemoveSubCategory(index)}>
                                <IoClose size={20}/>
                              </div>
                            </div>
                          )
                        })
                      }
                    </div>
                  </div>
                </div>

                <div className='grid gap-1'>
                  <label htmlFor='discount' className='font-medium'>Discount</label>
                  <input 
                    id='discount'
                    type='number'
                    placeholder='Enter product discount'
                    name='discount'
                    value={data.discount}
                    onChange={handleChange}
                    required
                    className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded'
                  />
                </div>

                <div className='grid gap-1 mt-3'>
                  <label htmlFor='vendor' className='font-medium text-sm'>
                    Select Vendor
                  </label>
                  <div className='flex gap-2'>
                    <select
                      className='bg-gray-100 py-2 px-3 rounded w-full'
                      id='vendor'
                      value={selectVendor}
                      onChange={(e) => setSelectVendor(e.target.value)}
                    >
                      <option value=''>Select Vendor</option>
                      {vendors.map((vendor) => (
                        <option key={vendor._id} value={vendor._id}>
                          {vendor.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type='button'
                      onClick={handleVendorSelect}
                      className='bg-green-600 hover:bg-green-700 text-white p-2 rounded'
                    >
                      Select
                    </button>
                  </div>
                  {data.vendor && (
                    <div className='flex items-center gap-1 mt-1 bg-gray-100 py-1 px-3 rounded w-fit'>
                      <p className='text-sm'>
                        {vendors.find(v => v._id === data.vendor)?.name || "Unknown Vendor"}
                      </p>
                      <button
                        type='button'
                        className='text-red-500'
                        onClick={() => setData(prev => ({ ...prev, vendor: null }))}
                      >
                        <IoClose />
                      </button>
                    </div>
                  )}
                </div>

                {/**add more field**/}
                  {
                    Object?.keys(data?.more_details)?.map((k,index)=>{
                        return(
                          <div className='grid gap-1'>
                            <label htmlFor={k} className='font-medium'>{k}</label>
                            <input 
                              id={k}
                              type='text'
                              value={data?.more_details[k]}
                              onChange={(e)=>{
                                  const value = e.target.value 
                                  setData((preve)=>{
                                    return{
                                        ...preve,
                                        more_details : {
                                          ...preve.more_details,
                                          [k] : value
                                        }
                                    }
                                  })
                              }}
                              required
                              className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded'
                            />
                          </div>
                        )
                    })
                  }

                <div onClick={()=>setOpenAddField(true)} className=' hover:bg-primary-200 bg-white py-1 px-3 w-32 text-center font-semibold border border-primary-200 hover:text-neutral-900 cursor-pointer rounded'>
                  Add Fields
                </div>

                <button
                  className='bg-primary-100 hover:bg-primary-200 py-2 rounded font-semibold'
                >
                  Submit
                </button>
            </form>
        </div>

        {
          ViewImageURL && (
            <ViewImage url={ViewImageURL} close={()=>setViewImageURL("")}/>
          )
        }

        {
          openAddField && (
            <AddFieldComponent 
              value={fieldName}
              onChange={(e)=>setFieldName(e.target.value)}
              submit={handleAddField}
              close={()=>setOpenAddField(false)} 
            />
          )
        }
    </section>
  )
}

export default UploadProduct
