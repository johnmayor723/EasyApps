// Function to generate email HTML content
const generateOrderEmailHTML = (  cartItems, orderDetails, isAdmin = false ) => {
        const itemsRows = cartItems.items.map(item => `
            <tr style="border: 1px solid gray;">
                <td style="padding: 10px; text-align: center;"><img src="${item.imageUrl}" alt="${item.name}" width="50"></td>
                <td style="padding: 10px; text-align: center;">${item.name}</td>
                <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; text-align: center;">₦${item.price}</td>
            </tr>
        `).join('');

        return `
          <div style="backgound-color:green;">
            <div style="text-align: center; padding: 0px;border-bottom: 1px solid gray;">
                <h1><img src="https://firebasestorage.googleapis.com/v0/b/fooddeck-fc840.appspot.com/o/Logo-removebg-preview%20(3).png?alt=media&token=e3635a63-8ba2-40c8-a3fc-1d068979c172" alt="Company Logo" width="100"></h1>
            </div>
            <div style="border-bottom: 1px solid gray;">
                <h3>${isAdmin ? 'New Order Notification' : 'Order Confirmation'}</h3>
                <p>Order Details:</p>
                
                <div style="margin:2px;">
                 <p>
            ${isAdmin 
                ? 'A new order was made. Please review the order details below:' 
                : `Hello ${orderDetails.name},<br>
                
                   Thank you for placing an order! Your order has been successfully placed. You can review your order details below. Our sales agent will contact you soon for confirmation.`
            }
        </p>
        </div>
                 
                
                <table style="width: 100%; border-collapse: collapse;">
                
                    <thead>
                        <tr style="border: 1px solid gray;">
                            <th style="padding: 10px; text-align: center;">Image</th>
                            <th style="padding: 10px; text-align: center;">Name</th>
                            <th style="padding: 10px; text-align: center;">Quantity</th>
                            <th style="padding: 10px; text-align: center;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsRows}
                    </tbody>
                </table>
         <p><strong>Total Quantity:</strong> ${cartItems.totalQty}</p>
        <p><strong>Total Amount:</strong> ₦${cartItems.totalAmount}</p>
        <p><strong>Order Notes:</strong> ${orderDetails.ordernotes}</p>
            </div>
            <div style="text-align: left;padding-top:20px; border-top: 1px solid gray;">
              <p>
                Contact us:<br>
                phone: 09123907060 <br>
                Email: info@fooddeck.com.ng<br>
                Website: www.fooddeck.com.ng
              </p>
            </div>
            </div>
        `;
    };
    

    

module.exports = {
    generateOrderEmailHTML,
    
    
};