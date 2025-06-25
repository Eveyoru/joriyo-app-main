import { useEffect, useState } from 'react';
import { IoClose } from 'react-icons/io5';
import Loading from './Loading';

const ProductVariationModal = ({ product, onClose, onAddToCart }) => {
  const [selectedVariation, setSelectedVariation] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Set the default variation when modal opens
  useEffect(() => {
    if (product && product.variations && product.variations.length > 0) {
      // First check if there's a default size to select (like 'L')
      const defaultSizes = ['L', 'M', 'Medium', 'Regular', 'Standard'];
      
      // Try to find one of the default sizes with stock
      let selectedVariation = null;
      
      for (const defaultSize of defaultSizes) {
        const variation = product.variations.find(v => 
          v.size === defaultSize && v.stock > 0
        );
        if (variation) {
          selectedVariation = variation;
          console.log(`Found default size ${defaultSize} with stock, selecting it`);
          break;
        }
      }
      
      // If no default size with stock was found, find the lowest price variation with stock
      if (!selectedVariation) {
        // Filter variations with stock > 0
        const inStockVariations = product.variations.filter(v => v.stock > 0);
        
        if (inStockVariations.length > 0) {
          // Sort by price and get the lowest price variation
          selectedVariation = [...inStockVariations].sort((a, b) => a.price - b.price)[0];
          console.log('Selected lowest price variation with stock:', selectedVariation.size);
        } else {
          // No variations with stock, just select the lowest price one
          selectedVariation = [...product.variations].sort((a, b) => a.price - b.price)[0];
          console.log('No variations with stock, selected lowest price variation:', selectedVariation.size);
        }
      }
      
      setSelectedVariation(selectedVariation);
    }
  }, [product]);

  if (!product) return null;

  const handleSelectVariation = (variation, e) => {
    // Stop event propagation to prevent navigation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedVariation(variation);
  };

  const handleAddToCart = async (e) => {
    // Stop event propagation to prevent navigation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!selectedVariation) return;
    
    setLoading(true);
    try {
      await onAddToCart(selectedVariation);
      onClose();
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prevent click from bubbling up to parent elements
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // Calculate final price after applying product discount
  const calculateFinalPrice = (variation) => {
    if (!variation) return 0;
    
    const productDiscount = product.discount || 0;
    const price = variation.price || 0;
    
    return price - (price * (productDiscount / 100));
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={handleModalClick}
    >
      <div 
        className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-auto"
        onClick={handleModalClick}
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-medium">{product.name}</h3>
          <button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onClose();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <IoClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <h4 className="font-medium mb-3">Select size</h4>
          
          {/* Variations */}
          <div className="space-y-4">
            {product.variations && product.variations.map((variation) => {
              const finalPrice = calculateFinalPrice(variation);
              const hasDiscount = (product.discount || 0) > 0;
              
              return (
                <div 
                  key={variation._id || variation.size}
                  className={`border rounded-lg p-3 flex justify-between items-center cursor-pointer transition-colors ${
                    selectedVariation && selectedVariation.size === variation.size 
                      ? 'border-green-500' 
                      : 'border-gray-200 hover:border-gray-300'
                  } ${variation.stock <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (variation.stock > 0) handleSelectVariation(variation, e);
                  }}
                >
                  <div className="flex items-center gap-3">
                    {/* Optional: Show product thumbnail */}
                    {product.image && product.image[0] && (
                      <div className="w-12 h-12 min-w-12 bg-gray-100 rounded overflow-hidden">
                        <img 
                          src={product.image[0]} 
                          alt={product.name} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{variation.size}</p>
                      {variation.stock <= 0 && (
                        <p className="text-red-500 text-xs">Out of stock</p>
                      )}
                      {variation.stock > 0 && variation.stock <= 5 && (
                        <p className="text-orange-500 text-xs">Only {variation.stock} left</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {hasDiscount ? (
                      <>
                        <div className="font-bold text-green-600">₹{Math.round(finalPrice)}</div>
                        <div className="text-xs flex items-center gap-1">
                          <span className="text-gray-500 line-through">₹{variation.price}</span>
                          <span className="bg-green-100 text-green-700 px-1 rounded-sm">{product.discount}% off</span>
                        </div>
                      </>
                    ) : (
                      <div className="font-bold">₹{variation.price}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t">
          <button
            onClick={handleAddToCart}
            disabled={loading || !selectedVariation || selectedVariation.stock <= 0}
            className={`w-full py-3 rounded-lg font-medium ${
              loading || !selectedVariation || selectedVariation.stock <= 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {loading ? <Loading /> : 'ADD'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductVariationModal; 