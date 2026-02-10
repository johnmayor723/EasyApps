// Sidebar toggle
  function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('hidden');
  }

  // Show content based on menu click
  function showContent(section) {
    const content = document.getElementById("main-content");
    let html = "";

    switch(section) {
      case "orders":
        html = `<h3>Orders</h3><p>Manage your customer orders here.</p>`;
        break;
      case "products":
        html = `<h3>Products</h3><p>View and manage your products.</p>`;
        break;
      case "customers":
        html = `<h3>Customers</h3><p>All customer details and interactions.</p>`;
        break;
      case "analytics":
        html = `<h3>Analytics</h3><p>Business performance insights and reports.</p>`;
        break;
      case "marketing":
        html = `<h3>Marketing</h3><p>Run campaigns, promotions, and more.</p>`;
        break;
      case "discounts":
        html = `<h3>Discounts</h3><p>Manage coupons and discounts.</p>`;
        break;
      case "settings":
        html = `<h3>Settings</h3><p>Update business settings and preferences.</p>`;
        break;
      default:
        html = document.getElementById("dashboard-content").outerHTML;
    }

    content.innerHTML = html;

    // Re-render chart if dashboard
    if(section === "dashboard") {
      renderChart();
    }
  }

  // Render chart
  function renderChart() {
    const ctx = document.getElementById('salesChart').getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [{
          label: 'Online Sales',
          data: [1200, 1900, 3000, 2500, 3200, 2800, 3500, 4000],
          backgroundColor: '#2D7B30'
        },
        {
          label: 'POS Sales',
          data: [800, 600, 1500, 1000, 1800, 1200, 2000, 1500],
          backgroundColor: '#FE9801'
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } }
      }
    });
  }

  // Initialize chart
  renderChart();