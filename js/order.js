import { getProducts } from "./firestore.js";
import { db } from "./firebase.js";

import {
    collection,
    addDoc,
    serverTimestamp,
    updateDoc,
    doc,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

let products = [];
let cart = [];
let selectedTable = null;
let currentOrderId = null;

const productsDiv = document.getElementById("products");
const cartDiv = document.getElementById("cart");
const totalDiv = document.getElementById("total");

const saveBtn = document.getElementById("saveOrder");

const tablesDiv = document.getElementById("tables");
const selectedTableDiv = document.getElementById("selectedTable");

const paymentModal = document.getElementById("paymentModal");
const paymentTableName = document.getElementById("paymentTableName");

const confirmPayment = document.getElementById("confirmPayment");
const deleteOrderBtn = document.getElementById("deleteOrder");
const cancelPayment = document.getElementById("cancelPayment");

const closeTableBtn = document.getElementById("closeTable");
const orderSection = document.getElementById("orderSection");

async function loadProducts() {

    products = await getProducts();

    productsDiv.innerHTML = "";

    let currentCategory = "";

    products.forEach(product => {

        if (currentCategory !== product.category) {

            currentCategory = product.category;

            const title = document.createElement("div");

title.className = "category-title";

title.textContent = currentCategory;

productsDiv.appendChild(title);

        }

        const div = document.createElement("div");

        div.className = "product";

        div.innerHTML = `
            <h3>${product.name}</h3>
            <p>${product.price} TL</p>
        `;

        div.onclick = () => addCart(product);

        productsDiv.appendChild(div);

    });

}

async function loadTables() {

    try {

        const snapshot = await getDocs(collection(db, "tables"));

        tablesDiv.innerHTML = "";

        let tables = [];

        snapshot.forEach(docSnap => {

            tables.push({
                id: docSnap.id,
                ...docSnap.data()
            });

        });

        tables.sort((a, b) => a.number - b.number);

        tables.forEach(table => {

            const div = document.createElement("div");

            div.className = "product";

            let statusText = "Boş";

            if (table.status === "open") statusText = "🔴 Açık";

            if (
                selectedTable &&
                selectedTable.id === table.id
            ) {
                statusText = "🟡 Seçili";
            }

            div.innerHTML = `
                <h3>${table.name}</h3>
                <p>${statusText}</p>
            `;

            div.onclick = async () => {

                selectedTable = {
                    id: table.id,
                    name: table.name,
                    number: table.number
                };

                selectedTableDiv.innerText =
                    "Seçilen Masa: " + table.name;
                
                

                
                await loadOpenOrder(table.name);

                orderSection.style.display =
                    "block";
                
                await loadTables();

            };

            tablesDiv.appendChild(div);

        });

    } catch (e) {

        console.error(e);
        alert("Masalar yüklenemedi.");

    }

}

async function findOpenOrder(tableName) {

    const q = query(
        collection(db, "orders"),
        where("table", "==", tableName),
        where("status", "==", "open")
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null;
    }

    const orderDoc = snapshot.docs[0];

    return {
        id: orderDoc.id,
        ...orderDoc.data()
    };

}

async function loadOpenOrder(tableName) {

    const order = await findOpenOrder(tableName);

    if (!order) {

        cart = [];
        currentOrderId = null;

        renderCart();

        return;

    }

    currentOrderId = order.id;

    cart = [...order.items];

    renderCart();

}
// Sepeti çiz
function renderCart() {

    cartDiv.innerHTML = "";

    let total = 0;

    cart.forEach((item, index) => {

        total += item.price * item.qty;

        cartDiv.innerHTML += `
        <div class="cart-item">

            <span>${item.name} x${item.qty}</span>

            <div class="cart-buttons">

                <button class="mini-btn"
                    onclick="changeQty(${index},-1)">−</button>

                <button class="mini-btn"
                    onclick="changeQty(${index},1)">+</button>

                <button class="mini-btn danger"
                    onclick="removeItem(${index})">🗑</button>

            </div>

        </div>
        `;

    });

    totalDiv.innerText = total + " TL";

}



// Ürün ekle
function addCart(product){

    const exist = cart.find(i => i.id === product.id);

    if(exist){

        exist.qty++;

    }else{

        cart.push({

            id:product.id,
            name:product.name,
            price:product.price,
            qty:1

        });

    }

    renderCart();

}



// Firestore güncelle
async function syncOrder(){

    if(!currentOrderId) return;

    // Sepet tamamen boşaldıysa
    if(cart.length===0){

        await updateDoc(

            doc(db,"orders",currentOrderId),

            {

                status:"cancelled",

                closedAt:serverTimestamp()

            }

        );

        await updateDoc(

            doc(db,"tables",selectedTable.id),

            {

                status:"empty"

            }

        );

        cart=[];

        currentOrderId=null;

        selectedTable=null;

        selectedTableDiv.innerText="Seçilen Masa: Yok";

        renderCart();

        await loadTables();

        return;

    }

    const total = cart.reduce(

        (sum,item)=>sum + item.price*item.qty,

        0

    );

    await updateDoc(

        doc(db,"orders",currentOrderId),

        {

            items:cart,

            total:total

        }

    );

}



// Sipariş Kaydet
saveBtn.onclick = async()=>{

    saveBtn.disabled = true;

    try{

        if(!selectedTable){

            alert("Masa seçiniz");

            return;

        }

        if(cart.length===0){

            alert("Ürün seçiniz");
            return;

        }

        const total = cart.reduce(

            (sum,item)=>sum + item.price * item.qty,

            0

        );

        const oldOrder = await findOpenOrder(selectedTable.name);

        if(oldOrder){

            await updateDoc(

                doc(db,"orders",oldOrder.id),

                {

                    items:cart,

                    total:total

                }

            );

            currentOrderId = oldOrder.id;

        }else{

            const newOrder = await addDoc(

                collection(db,"orders"),

                {

                    table:selectedTable.name,

                    tableNumber:selectedTable.number,

                    items:cart,

                    total:total,

                    status:"open",

                    createdAt:serverTimestamp()

                }

            );

            currentOrderId = newOrder.id;

        }

        // Masa HER ZAMAN açık yapılır
        await updateDoc(

            doc(db,"tables",selectedTable.id),

            {

                status:"open"

            }

        );

        await loadTables();

        alert("Adisyon kaydedildi.");

    }catch(err){

    console.error(err);

    alert("Sipariş kaydedilemedi.");

}finally{

    saveBtn.disabled = false;

}

};



// +
window.changeQty = async function(index, amount){

    const newQty = cart[index].qty + amount;

    if(newQty < 1){
        return;
    }

    cart[index].qty = newQty;

    renderCart();

    await syncOrder();

};



// 🗑
window.removeItem = async function(index){

    const ok = confirm(
        "Bu ürünü adisyondan silmek istediğinize emin misiniz?"
    );

    if(!ok) return;

    cart.splice(index,1);

    renderCart();

    await syncOrder();

};

// Ödeme penceresini aç
if (closeTableBtn) {

    closeTableBtn.onclick = () => {

        if (!selectedTable || !currentOrderId) {
            alert("Açık masa seçiniz");
            return;
        }

        paymentTableName.innerText = selectedTable.name;
        paymentModal.style.display = "flex";

    };

}



// Ödeme Al
confirmPayment.onclick = async () => {

    if (!currentOrderId || !selectedTable) {
        alert("Açık sipariş bulunamadı.");
        return;
    }

    try {

        const payment =
            document.querySelector(
                'input[name="payment"]:checked'
            ).value;

        await updateDoc(
            doc(db, "orders", currentOrderId),
            {
                status: "closed",
                paymentType: payment,
                closedAt: serverTimestamp()
            }
        );

        await updateDoc(
            doc(db, "tables", selectedTable.id),
            {
                status: "empty"
            }
        );

        closePaymentWindow();

        alert("Ödeme tamamlandı.");

    } catch (e) {

        console.error(e);
        alert("Ödeme alınamadı.");

    }

};



// Masayı Sil
deleteOrderBtn.onclick = async () => {

    // Güvenlik kontrolü
    if (!currentOrderId || !selectedTable) {
        alert("Silinecek açık sipariş bulunamadı.");
        return;
    }

    const ok = confirm(
        "Bu sipariş ciroya eklenmeden silinecek. Emin misiniz?"
    );

    if (!ok) return;

    try {

        await updateDoc(
            doc(db, "orders", currentOrderId),
            {
                status: "cancelled",
                closedAt: serverTimestamp()
            }
        );

        await updateDoc(
            doc(db, "tables", selectedTable.id),
            {
                status: "empty"
            }
        );

        closePaymentWindow();

        alert("Masa silindi.");

    } catch (e) {

        console.error(e);
        alert("Silme işlemi başarısız.");

    }

};



// Modal kapat
cancelPayment.onclick = () => {

    paymentModal.style.display = "none";

};



// Temizle
function closePaymentWindow() {

    paymentModal.style.display = "none";

    cart = [];
    currentOrderId = null;
    selectedTable = null;

    selectedTableDiv.innerText =
        "Seçilen Masa: Yok";

    renderCart();
    
    orderSection.style.display = "none";
    
    loadTables();

}



// Başlat
window.onload = async () => {

    orderSection.style.display = "none";

    await loadProducts();
    await loadTables();

};
