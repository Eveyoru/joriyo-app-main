import React from 'react';
import { IoClose } from 'react-icons/io5';
import { DisplayPriceInRupees } from '../utils/DisplayPriceInRupees';

const OrderDetailsModal = ({ order, onClose }) => {
  if (!order) return null;

  // Helper function to determine if order uses new structure with products array
  const isNewOrderStructure = () => {
    return Array.isArray(order.products) && order.products.length > 0;
  };

  // Get products based on order structure
  const getProducts = () => {
    if (isNewOrderStructure()) {
      return order.products;
    } else if (order.product_details) {
      // Old structure with single product
      return [{
        name: order.product_details.name,
        image: order.product_details.image,
        price: order.totalAmt,
        quantity: 1
      }];
    } else if (order.list_items && Array.isArray(order.list_items)) {
      // Admin structure with list_items
      return order.list_items.map(item => ({
        name: item.productId?.name || 'Unknown Product',
        image: item.productId?.image || [],
        price: item.productId?.price || 0,
        quantity: item.quantity || 1,
        selectedSize: item.selectedSize,
        variationId: item.variationId
      }));
    }
    return [];
  };

  const products = getProducts();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold">Order Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <IoClose size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Order Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Order ID:</span> {order.orderId}</p>
                  <p><span className="font-medium">Date:</span> {new Date(order.createdAt).toLocaleString()}</p>
                  <p><span className="font-medium">Payment Status:</span> {order.payment_status}</p>
                  <p><span className="font-medium">Order Status:</span> {order.status || 'Pending'}</p>
                  {order.paymentId && (
                    <p><span className="font-medium">Payment ID:</span> {order.paymentId}</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Customer Information</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p><span className="font-medium">Name:</span> {order.userId?.name || 'N/A'}</p>
                  <p><span className="font-medium">Email:</span> {order.userId?.email || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Shipping Address</h3>
              {order.delivery_address ? (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <p>{order.delivery_address.address_line}</p>
                  <p>{order.delivery_address.city}, {order.delivery_address.state}</p>
                  <p>{order.delivery_address.country} - {order.delivery_address.pincode}</p>
                  <p><span className="font-medium">Phone:</span> {order.delivery_address.mobile}</p>
                </div>
              ) : (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-500">No address information available</p>
                </div>
              )}
            </div>
          </div>

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold mb-2">Order Items</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size/Variant</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product, index) => {
                    const productPrice = product.price || 0;
                    const quantity = product.quantity || 1;
                    const totalPrice = productPrice * quantity;
                    
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {product.image && product.image[0] && (
                              <div className="flex-shrink-0 h-10 w-10 mr-4">
                                <img className="h-10 w-10 rounded-full object-cover" src={product.image[0]} alt="" />
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {product.selectedSize || product.size ? (
                            <span className="inline-block px-3 py-2 rounded-md text-sm font-medium bg-blue-100 text-blue-800 border-2 border-blue-300">
                              {product.selectedSize || product.size}
                            </span>
                          ) : (
                            <span className="text-gray-400">Standard</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {DisplayPriceInRupees(productPrice)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {DisplayPriceInRupees(totalPrice)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-right font-medium">Subtotal:</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {DisplayPriceInRupees(order.subTotalAmt || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-right font-medium">Delivery Charge:</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      Free
                    </td>
                  </tr>
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-right font-medium">Total:</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {DisplayPriceInRupees(order.totalAmt || 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;
