// Products Controller
class ProductsManager {
    constructor() {
        this.products = [];
        this.init();
    }

    init() {
        this.setupSearch();
        this.setupFilter();
    }

    setupSearch() {
        const searchInput = document.getElementById('productSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterProducts(e.target.value);
            });
        }
    }

    setupFilter() {
        const filterSelect = document.getElementById('categoryFilter');
        if (filterSelect) {
            filterSelect.addEventListener('change', (e) => {
                this.filterByCategory(e.target.value);
            });
        }
    }

    filterProducts(query) {
        console.log('Searching:', query);
    }

    filterByCategory(category) {
        console.log('Filtering by category:', category);
    }

    loadProducts() {
        // Fetch products from API
    }

    renderProducts(products) {
        const tbody = document.querySelector('#productsTable tbody');
        if (!tbody) return;

        tbody.innerHTML = products.map((product, index) => `
            <tr>
                <td>${index + 1}</td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.price}</td>
                <td>${product.stock}</td>
                <td><span class="badge badge-${product.stock > 0 ? 'success' : 'danger'}">${product.stock > 0 ? 'موجود' : 'ناموجود'}</span></td>
                <td>
                    <button class="btn-icon" onclick="productsManager.editProduct('${product.id}')">✏️</button>
                    <button class="btn-icon" onclick="productsManager.deleteProduct('${product.id}')">🗑️</button>
                </td>
            </tr>
        `).join('');
    }

    addProduct(product) {
        this.products.push(product);
        this.renderProducts(this.products);
    }

    editProduct(id) {
        console.log('Edit product:', id);
    }

    deleteProduct(id) {
        this.products = this.products.filter(p => p.id !== id);
        this.renderProducts(this.products);
    }
}

const productsManager = new ProductsManager();
