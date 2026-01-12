// ====== GLOBAL VARIABLES ======
let products = JSON.parse(localStorage.getItem('products')) || [
  { id: 1, name: "Phone", price: 15000, reviews: [] },
  { id: 2, name: "Laptop", price: 45000, reviews: [] },
  { id: 3, name: "Headphones", price: 3000, reviews: [] }
];

let cart = JSON.parse(localStorage.getItem('cart')) || [];
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let orders = JSON.parse(localStorage.getItem('orders')) || [];

// ====== DOM ELEMENTS ======
const productsDiv = document.getElementById('products');
const cartDiv = document.getElementById('cart');
const totalP = document.getElementById('total');
const loginSection = document.getElementById('loginSection');
const adminPanel = document.getElementById('adminPanel');
const loginMessage = document.getElementById('loginMessage');
const welcomeUser = document.getElementById('welcomeUser');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const cartCountSpan = document.getElementById('cartCount');
const adminProductsList = document.getElementById('adminProductsList');
const orderHistoryDiv = document.getElementById('orderHistory');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');

// ====== FUNCTIONS ======

// Fix missing reviews array if any
function fixProductsReviews() {
  let changed = false;
  products = products.map(p => {
    if (!p.reviews) {
      p.reviews = [];
      changed = true;
    }
    return p;
  });
  if (changed) {
    localStorage.setItem('products', JSON.stringify(products));
  }
}

// Display products list
function displayProducts(list = products) {
  productsDiv.innerHTML = '';
  list.forEach(product => {
    const avgRating = calculateAverageRating(product.reviews || []);
    productsDiv.innerHTML += `
      <div class="product">
        <h3>${product.name}</h3>
        <p>KES ${product.price.toLocaleString()}</p>
        <p>Rating: ${renderStars(avgRating)} (${product.reviews.length})</p>
        <button onclick="addToCart(${product.id})">Add to Cart</button>
        <button onclick="showReviewForm(${product.id})">Reviews</button>
        <div id="reviewForm${product.id}" style="display:none; margin-top:10px;">
          <textarea id="reviewText${product.id}" rows="3" cols="30" placeholder="Write a review..."></textarea>
          <br />
          <select id="reviewRating${product.id}">
            <option value="5">5 - Excellent</option>
            <option value="4">4 - Good</option>
            <option value="3">3 - Average</option>
            <option value="2">2 - Poor</option>
            <option value="1">1 - Terrible</option>
          </select>
          <br />
          <button onclick="addReview(${product.id})">Submit Review</button>
          <button onclick="hideReviewForm(${product.id})">Cancel</button>
          <div id="reviewError${product.id}" style="color:red;"></div>
          <div id="reviewList${product.id}" style="margin-top:10px; max-height:150px; overflow-y:auto;"></div>
        </div>
      </div>
    `;
    renderReviewList(product.id);
  });
}

function renderStars(rating) {
  if (!rating) return 'No ratings';
  const fullStars = Math.round(rating);
  let stars = '';
  for (let i = 0; i < fullStars; i++) {
    stars += '⭐';
  }
  return stars;
}

function calculateAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return sum / reviews.length;
}

function addReview(productId) {
  if (!currentUser) {
    alert('Please login to submit a review.');
    showLogin();
    return;
  }

  const textEl = document.getElementById(`reviewText${productId}`);
  const ratingEl = document.getElementById(`reviewRating${productId}`);
  const errorEl = document.getElementById(`reviewError${productId}`);
  errorEl.textContent = '';

  const reviewText = textEl.value.trim();
  const reviewRating = Number(ratingEl.value);

  if (!reviewText) {
    errorEl.textContent = 'Review text cannot be empty.';
    return;
  }

  const product = products.find(p => p.id === productId);
  if (!product) return;

  product.reviews.push({
    username: currentUser.username,
    text: reviewText,
    rating: reviewRating,
    date: new Date().toISOString()
  });

  localStorage.setItem('products', JSON.stringify(products));

  textEl.value = '';
  ratingEl.value = '5';
  hideReviewForm(productId);
  displayProducts();
  alert('Thank you for your review!');
}

function showReviewForm(productId) {
  document.getElementById(`reviewForm${productId}`).style.display = 'block';
}

function hideReviewForm(productId) {
  document.getElementById(`reviewForm${productId}`).style.display = 'none';
}

function renderReviewList(productId) {
  const product = products.find(p => p.id === productId);
  const reviewListDiv = document.getElementById(`reviewList${productId}`);
  if (!product || !reviewListDiv) return;

  if (product.reviews.length === 0) {
    reviewListDiv.innerHTML = '<p>No reviews yet.</p>';
    return;
  }

  reviewListDiv.innerHTML = product.reviews
    .map(
      r =>
        `<p><strong>${r.username}</strong> (${new Date(r.date).toLocaleDateString()}): ${r.text} — ${renderStars(r.rating)}</p>`
    )
    .join('');
}

function addToCart(id) {
  if (!currentUser) {
    alert('Please login before adding items to cart.');
    showLogin();
    return;
  }
  const cartItem = cart.find(item => item.id === id);
  if (cartItem) {
    cartItem.qty++;
  } else {
    cart.push({ id: id, qty: 1 });
  }
  saveCart();
  updateCartDisplay();
  updateCartCount();
}

function updateCartDisplay() {
  cartDiv.innerHTML = '';
  if (cart.length === 0) {
    cartDiv.innerHTML = '<p>Your cart is empty.</p>';
    totalP.textContent = '';
    return;
  }
  let total = 0;
  cart.forEach(item => {
    const product = products.find(p => p.id === item.id);
    if (!product) return;
    const itemTotal = product.price * item.qty;
    total += itemTotal;
    cartDiv.innerHTML += `
      <div>
        <strong>${product.name}</strong> - KES ${product.price.toLocaleString()} x ${item.qty}
        <button onclick="changeQty(${item.id}, 1)">+</button>
        <button onclick="changeQty(${item.id}, -1)">-</button>
        <button onclick="removeFromCart(${item.id})">Remove</button>
      </div>
    `;
  });
  totalP.textContent = `Total: KES ${total.toLocaleString()}`;
}

function changeQty(id, amount) {
  const cartItem = cart.find(item => item.id === id);
  if (!cartItem) return;
  cartItem.qty += amount;
  if (cartItem.qty <= 0) {
    cart = cart.filter(item => item.id !== id);
  }
  saveCart();
  updateCartDisplay();
  updateCartCount();
}

function removeFromCart(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
  updateCartDisplay();
  updateCartCount();
}

function saveCart() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function checkout() {
  if (!currentUser) {
    alert('Please login before checkout.');
    showLogin();
    return;
  }
  if (cart.length === 0) {
    alert('Your cart is empty.');
    return;
  }
  const order = {
    id: Date.now(),
    user: currentUser.username,
    items: [...cart],
    date: new Date().toISOString()
  };
  orders.push(order);
  localStorage.setItem('orders', JSON.stringify(orders));
  alert('Checkout successful! Thank you for your purchase.');
  cart = [];
  saveCart();
  updateCartDisplay();
  updateCartCount();
  renderOrderHistory();
}

function login() {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    loginMessage.textContent = 'Please enter username and password.';
    return;
  }

  // Simple hardcoded auth for demo
  if (username === 'admin' && password === 'admin123') {
    currentUser = { username, role: 'admin' };
  } else {
    currentUser = { username, role: 'user' };
  }

  localStorage.setItem('currentUser', JSON.stringify(currentUser));
  loginMessage.textContent = '';
  usernameInput.value = '';
  passwordInput.value = '';
  updateUIAfterLogin();
}

function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  updateUIAfterLogout();
}

function updateUIAfterLogin() {
  loginSection.style.display = 'none';
  loginBtn.style.display = 'none';
  logoutBtn.style.display = 'inline-block';
  welcomeUser.style.display = 'inline-block';
  welcomeUser.textContent = `Welcome, ${currentUser.username}`;

  if (currentUser.role === 'admin') {
    adminPanel.style.display = 'block';
    renderAdminProducts();
  } else {
    adminPanel.style.display = 'none';
  }

  updateCartCount();
  updateCartDisplay();
  renderOrderHistory();
}

function updateUIAfterLogout() {
  loginSection.style.display = 'none';
  loginBtn.style.display = 'inline-block';
  logoutBtn.style.display = 'none';
  welcomeUser.style.display = 'none';
  welcomeUser.textContent = '';
  adminPanel.style.display = 'none';

  updateCartCount();
  updateCartDisplay();
  orderHistoryDiv.innerHTML = '';
}

function showLogin() {
  loginSection.style.display = 'block';
  loginBtn.style.display = 'none';
  logoutBtn.style.display = 'none';
  welcomeUser.style.display = 'none';
  adminPanel.style.display = 'none';
}

function addProduct() {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Admin access only.');
    return;
  }
  const name = document.getElementById('adminProductName').value.trim();
  const price = Number(document.getElementById('adminProductPrice').value);

  if (!name || price <= 0) {
    alert('Enter valid product name and price.');
    return;
  }

  const newProduct = {
    id: Date.now(),
    name,
    price,
    reviews: []
  };

  products.push(newProduct);
  localStorage.setItem('products', JSON.stringify(products));
  document.getElementById('adminProductName').value = '';
  document.getElementById('adminProductPrice').value = '';
  renderAdminProducts();
  displayProducts();
}

function renderAdminProducts() {
  adminProductsList.innerHTML = '';
  products.forEach(product => {
    adminProductsList.innerHTML += `
      <div class="admin-product-item">
        <span>${product.name} - KES ${product.price.toLocaleString()}</span>
        <button onclick="deleteProduct(${product.id})">Delete</button>
      </div>
    `;
  });
}

function deleteProduct(id) {
  if (!currentUser || currentUser.role !== 'admin') {
    alert('Admin access only.');
    return;
  }
  products = products.filter(p => p.id !== id);
  localStorage.setItem('products', JSON.stringify(products));
  renderAdminProducts();
  displayProducts();
}

function updateCartCount() {
  const count = cart.reduce((acc, item) => acc + item.qty, 0);
  cartCountSpan.textContent = `Cart (${count})`;
}

function searchProducts() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = products.filter(p => p.name.toLowerCase().includes(query));
  displayProducts(filtered);
}

// Initial Setup
fixProductsReviews();
displayProducts();
updateCartCount();
updateCartDisplay();

if (currentUser) {
  updateUIAfterLogin();
} else {
  updateUIAfterLogout();
}  function renderOrderHistory() {
  orderHistoryDiv.innerHTML = '';
  if (!currentUser) {
    orderHistoryDiv.innerHTML = '<p>Please login to see order history.</p>';
    return;
  }
  const userOrders = orders.filter(o => o.user === currentUser.username);
  if (userOrders.length === 0) {
    orderHistoryDiv.innerHTML = '<p>No orders yet.</p>';
    return;
  }
  userOrders.forEach(order => {
    let orderItemsHtml = '<ul>';
    order.items.forEach(item => {
      const product = products.find(p => p.id === item.id);
      if (!product) return;
      orderItemsHtml += `<li>${product.name} x ${item.qty} - KES ${(product.price * item.qty).toLocaleString()}</li>`;
    });
    orderItemsHtml += '</ul>';
    orderHistoryDiv.innerHTML += `
      <div class="order-item">
        <p><strong>Order #${order.id}</strong> - ${new Date(order.date).toLocaleString()}</p>
        ${orderItemsHtml}
      </div>
    `;
  });
} 