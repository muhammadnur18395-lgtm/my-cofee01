
// DATABASE SEDERHANA
let users = JSON.parse(localStorage.getItem("mycofee_users")) || [
    {
        username: "admin",
        password: "admin123",
        role: "admin"
    }
];

let products = JSON.parse(localStorage.getItem("mycofee_products")) || [
    {
        name: "Espresso",
        price: 15000,
        image: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=500"
    },
    {
        name: "Cappuccino",
        price: 22000,
        image: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=500"
    },
    {
        name: "Cafe Latte",
        price: 20000,
        image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500"
    },
    {
        name: "Americano",
        price: 18000,
        image: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500"
    }
];

let orders = JSON.parse(localStorage.getItem("mycofee_orders")) || [];
let currentUser = null;
let cart = [];

function saveData() {
    localStorage.setItem("mycofee_users", JSON.stringify(users));
    localStorage.setItem("mycofee_products", JSON.stringify(products));
    localStorage.setItem("mycofee_orders", JSON.stringify(orders));
}

function money(value) {
    return "Rp" + value.toLocaleString("id-ID");
}

// PINDAH LOGIN DAN REGISTER
function showAuth(type) {
    document.getElementById("loginForm").hidden = type !== "login";
    document.getElementById("registerForm").hidden = type !== "register";
}

// REGISTER
document.getElementById("registerForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("regUsername").value.trim();
    const password = document.getElementById("regPassword").value;

    if (username.length < 3) {
        alert("Username minimal 3 karakter!");
        return;
    }

    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        alert("Username sudah digunakan!");
        return;
    }

    users.push({
        username,
        password,
        role: "user"
    });

    saveData();
    alert("Pendaftaran berhasil! Silakan login.");

    this.reset();
    showAuth("login");
});

// LOGIN
document.getElementById("loginForm").addEventListener("submit", function(e) {
    e.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value;

    const user = users.find(u =>
        u.username.toLowerCase() === username.toLowerCase()
        && u.password === password
    );

    if (!user) {
        alert("Username atau password salah!");
        return;
    }

    currentUser = user;
    cart = [];
    this.reset();
    openDashboard();
});

// DASHBOARD
function openDashboard() {
    document.getElementById("auth").hidden = true;
    document.getElementById("dashboard").hidden = false;

    document.getElementById("navUser").innerHTML =
        "Halo, " + currentUser.username;

    document.getElementById("profileInfo").innerHTML =
        "Username: <b>" + currentUser.username +
        "</b><br>Role: <b>" + currentUser.role + "</b>";

    const adminPanel = document.getElementById("adminPanel");

    adminPanel.hidden = currentUser.role !== "admin";

    tampilkanProduk();
    tampilkanKeranjang();
    tampilkanPesanan();
}

// MENAMPILKAN PRODUK
function tampilkanProduk() {
    const tempat = document.getElementById("products");

    tempat.innerHTML = products.map((p, i) => `
        <div class="card">
            <img src="${escapeHTML(p.image)}"
                 alt="${escapeHTML(p.name)}">
            <h3>${escapeHTML(p.name)}</h3>
            <p>${money(p.price)}</p>
            <button onclick="addCart(${i})">
                + Tambah Keranjang
            </button>
            ${currentUser.role === "admin"
                ? `<button onclick="hapusProduk(${i})">Hapus</button>`
                : ""}
        </div>
    `).join("");
}

// TAMBAH PRODUK (ADMIN)
document.getElementById("productForm").addEventListener("submit", function(e) {
    e.preventDefault();

    if (!currentUser || currentUser.role !== "admin") return;

    const name = document.getElementById("productName").value.trim();
    const price = Number(document.getElementById("productPrice").value);
    const image = document.getElementById("productImage").value.trim()
        || "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=500";

    if (!name || !Number.isFinite(price) || price <= 0) return;

    products.push({name, price, image});

    saveData();
    this.reset();
    tampilkanProduk();

    alert("Produk berhasil ditambahkan!");
});

// HAPUS PRODUK (ADMIN)
function hapusProduk(index) {
    if (currentUser?.role !== "admin") return;

    if (confirm("Hapus produk ini?")) {
        products.splice(index, 1);
        saveData();
        tampilkanProduk();
    }
}

// KERANJANG
function addCart(index) {
    const product = products[index];
    if (!product) return;

    const item = cart.find(x => x.name === product.name);

    if (item) {
        item.qty++;
    } else {
        cart.push({
            name: product.name,
            price: product.price,
            qty: 1
        });
    }

    tampilkanKeranjang();
}

function tampilkanKeranjang() {
    const tempat = document.getElementById("cartItems");

    if (!cart.length) {
        tempat.innerHTML = "Keranjang masih kosong.";
    } else {
        tempat.innerHTML = cart.map((item, i) => `
            <div class="cart-item">
                <div>
                    <b>${escapeHTML(item.name)}</b><br>
                    ${money(item.price)} x ${item.qty}
                </div>
                <button onclick="hapusCart(${i})">Hapus</button>
            </div>
        `).join("");
    }

    const total = cart.reduce(
        (sum, item) => sum + item.price * item.qty, 0
    );

    document.getElementById("cartTotal").innerText =
        "Total: " + money(total);
}

function hapusCart(index) {
    cart.splice(index, 1);
    tampilkanKeranjang();
}

// CHECKOUT
function checkout() {
    if (!cart.length) {
        alert("Keranjang masih kosong!");
        return;
    }

    const order = {
        id: Date.now(),
        username: currentUser.username,
        items: cart.map(item => ({...item})),
        total: cart.reduce(
            (sum, item) => sum + item.price * item.qty, 0
        ),
        status: "Menunggu konfirmasi"
    };

    orders.push(order);
    saveData();

    alert("Pesanan berhasil dibuat!");

    cart = [];
    tampilkanKeranjang();
    tampilkanPesanan();
}

// PESANAN ADMIN
function tampilkanPesanan() {
    if (currentUser.role !== "admin") return;

    const tempat = document.getElementById("adminOrders");

    if (!orders.length) {
        tempat.innerHTML = "Belum ada pesanan.";
        return;
    }

    tempat.innerHTML = orders.map((order, i) => `
        <div class="order-item">
            <div>
                <b>${escapeHTML(order.username)}</b><br>
                ${order.items.map(item =>
                    escapeHTML(item.name) + " x " + item.qty
                ).join(", ")}
                <br>${money(order.total)}
                <br>Status: ${escapeHTML(order.status)}
            </div>
            <button onclick="selesaikanPesanan(${i})">
                Selesaikan
            </button>
        </div>
    `).join("");
}

function selesaikanPesanan(index) {
    if (currentUser?.role !== "admin") return;

    orders[index].status = "Selesai";
    saveData();
    tampilkanPesanan();
}

// LOGOUT
function logout() {
    currentUser = null;
    cart = [];

    document.getElementById("auth").hidden = false;
    document.getElementById("dashboard").hidden = true;
    document.getElementById("navUser").innerHTML = "";

    showAuth("login");
}

// ESCAPE TEKS
function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

saveData();
showAuth("login");
