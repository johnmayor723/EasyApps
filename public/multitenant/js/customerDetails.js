// customerDetails.js
export function customerDetailsPage(customerId) {
  const customerData = {
    1: {
      name: "John Doe",
      email: "johndoe@email.com",
      phone: "+234 801 234 5678",
      address: "123 Lagos Street, Lagos, Nigeria",
      transactions: [
        { id: "TXN001", amount: "₦10,000", status: "Completed" },
        { id: "TXN002", amount: "₦5,500", status: "Pending" }
      ]
    },
    2: {
      name: "Jane Smith",
      email: "janesmith@email.com",
      phone: "+234 809 876 5432",
      address: "456 Abuja Road, Abuja, Nigeria",
      transactions: [
        { id: "TXN003", amount: "₦7,200", status: "Completed" }
      ]
    },
    3: {
      name: "Mike Johnson",
      email: "mikejohnson@email.com",
      phone: "+234 803 112 3344",
      address: "789 Port Harcourt Ave, Rivers State, Nigeria",
      transactions: [
        { id: "TXN004", amount: "₦2,800", status: "Deleted" },
        { id: "TXN005", amount: "₦12,000", status: "Completed" }
      ]
    }
  };

  const customer = customerData[customerId];
  if (!customer) return `<p>Customer not found.</p>`;

  const transactionsHTML = customer.transactions.map(txn => `
    <tr>
      <td>${txn.id}</td>
      <td>${txn.amount}</td>
      <td>${txn.status}</td>
    </tr>
  `).join("");

  return `
    <div class="customer-details">
      <h2>Customer Details</h2>
      <p><strong>Name:</strong> ${customer.name}</p>
      <p><strong>Email:</strong> ${customer.email}</p>
      <p><strong>Phone:</strong> ${customer.phone}</p>
      <p><strong>Address:</strong> ${customer.address}</p>

      <h3>Transactions</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="width:100%; border-collapse: collapse;">
        <thead>
          <tr>
            <th>Transaction ID</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${transactionsHTML}
        </tbody>
      </table>
    </div>
  `;
}
