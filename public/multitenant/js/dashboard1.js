    //import { customerDetails } from "./customerDetails.js";

    const hamburger = document.getElementById('hamburger');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const dynamicContent = document.getElementById('dynamic-content');

    // Toggle Sidebar
    hamburger.addEventListener('click', () => {
      sidebar.classList.toggle('active');
      overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });

    // Content for pages
    const pages = {
      dashboard: `
        <div style="margin-bottom: 30px;">
          <h3 style="color:#000;">
            <a href="https://mayowaandrews723.takeapp.com" target="_blank" style="color:#000; text-decoration:none;">
              Welcome back, <%=user.name %> 👋
            </a>
          </h3>
        </div>
        <div class="jumbotron">
          <p><strong>Last 30 days</strong> <span style="float:right; cursor:pointer;">📅</span></p>
          <p>September 1, 2025 – September 16, 2025</p>
        </div>
        <div class="card">
          <div class="stats">
            <div class="stat"><h4>Views</h4><p>6</p></div>
            <div class="stat"><h4>Orders</h4><p>1</p></div>
            <div class="stat"><h4>Sales</h4><p>₦0.00</p></div>
          </div>
        </div>
        <div class="card orders">
          <h4>Orders (Last 30 days)</h4>
          <div class="order-item">1 pending order</div>
          <div class="order-item">1 unpaid order</div>
        </div>
      `,
      orders: `<div class="orders-container">
      <div style="margin-bottom: 10px;><h2 >Orders</h2></div>

    <div class="jumbotrons">
      <a href="#pending-orders" class="jumbotron">
        <h3>⏳ Pending Orders</h3>
        <p>Orders awaiting payment or confirmation.</p>
      </a>

      <a href="#paid-orders" class="jumbotron">
        <h3>💳 Paid Orders</h3>
        <p>Orders that have been paid successfully.</p>
      </a>

      <a href="#deleted-orders" class="jumbotron">
        <h3>🗑️ Deleted Orders</h3>
        <p>Orders that were removed or cancelled.</p>
      </a>

      <a href="#completed-orders" class="jumbotron">
        <h3>✅ Completed Orders</h3>
        <p>Orders that have been fulfilled successfully.</p>
      </a>
    </div>
  </div>`,
      products: `<div class="products-container">
    <h2>Products</h2>

    <div class="jumbotrons">
      <a href="#view-products" class="jumbotron">
        <h3>📦 View All Products</h3>
        <p>See all your listed products in one place.</p>
      </a>

      <a href="/multitenant/add-products" class="jumbotron">
        <h3>➕ Add Product</h3>
        <p>Add a new product to your store catalog.</p>
      </a>
    </div>
  </div>`,
   
   customers: `<div class="customers-container">
  <h2>Customers</h2>

  <div class="jumbotrons">
    <% if (customers && customers.length > 0) { %>
      <% customers.forEach(function(customer, index) { %>
        <div class="jumbotron customer" data-id="<%= index + 1 %>">
          <h3><%= customer.name %></h3>
          <p><%= customer.email %></p>
        </div>
      <% }); %>
    <% } else { %>
      <p>No customers available.</p>
    <% } %>
  </div>
</div>
`,
    analytics: `<div class="card"><h3>Analytics</h3><p>Analytics content will go here.</p></div>`,
  chats: `<div class="card"><h3>Chats</h3><p>Chats content will go here.</p></div>`,
      chats: `<div class="card"><h3>Chats</h3><p>Chats content will go here.</p></div>`,
      design: `<div class="card"><h3>Design</h3><p>Design tools will go here.</p></div>`,
      settings: `<div class="card"><h3>Settings</h3><p>Settings content will go here.</p></div>`,
      marketing: `<div class="card"><h3>Marketing</h3><p>Marketing tools will go here.</p></div>`
    };

    // Load content dynamically
    document.querySelectorAll('.menu a').forEach(item => {
      item.addEventListener('click', (e) => {
        const page = e.target.getAttribute('data-page');
        dynamicContent.innerHTML = pages[page];
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
      });
    });