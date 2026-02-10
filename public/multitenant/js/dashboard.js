document.addEventListener('DOMContentLoaded', () => {
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

  // ✅ Function to load partials dynamically (global)
  window.loadPage = async (page) => {
    try {
      const response = await fetch(`/partials/${page}`);
      const html = await response.text();
      dynamicContent.innerHTML = html;
    } catch (err) {
      dynamicContent.innerHTML = `<div class="card"><p>Error loading ${page}.</p></div>`;
      console.error(err);
    }
  };

  // Sidebar menu click events
  document.querySelectorAll('.menu a').forEach(item => {
    item.addEventListener('click', (e) => {
      const page = e.target.getAttribute('data-page');
      loadPage(page);
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    });
  });
 // ===== Flyout Modal Controller =====
window.openModal = function (id) {
  const modal = document.getElementById(id);
  if (!modal) {
    console.warn('Modal not found:', id);
    return;
  }
  modal.classList.add('active');
};

window.closeModal = function (id) {
  const modal = document.getElementById(id);
  if (!modal) return;
  modal.classList.remove('active');
};
function renderDomainRow({ domain, available, price }) {
  return `
    <div class="domain-row">
      <div class="domain-info">
        <div class="domain-name">${domain}</div>
        <div class="domain-status ${available ? 'available' : 'unavailable'}">
          ${available ? 'Available' : 'Not available'}
        </div>
      </div>

      <div class="domain-action">
        <div class="domain-price">
          ${available ? price : '—'}
        </div>
        <button
          class="${available ? 'buy-btn' : 'disabled-btn'}"
          ${available ? '' : 'disabled'}
        >
          ${available ? 'Select' : 'Unavailable'}
        </button>
      </div>
    </div>
  `;
}





  // Load dashboard by default
  loadPage('overview');
});
