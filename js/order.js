import { getProducts } from "./firestore.js";
import { db } from "./firebase.js";

import {
collection,
addDoc,
serverTimestamp,
getDocs,
updateDoc,
doc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


let products = [];
let cart = [];
let selectedTable = null;


const productsDiv = document.getElementById("products");
const cartDiv = document.getElementById("cart");
const totalDiv = document.getElementById("total");
const saveBtn = document.getElementById("saveOrder");
const tablesDiv = document.getElementById("tables");
const selectedTableDiv = document.getElementById("selectedTable");


// Ürünleri yükle

async function loadProducts(){

    products = await getProducts();

    productsDiv.innerHTML = "";

    products.forEach(product => {

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
// Masaları yükle

async function loadTables(){

    const snapshot = await getDocs(collection(db,"tables"));

    tablesDiv.innerHTML = "";

    snapshot.forEach(doc=>{

        const table = doc.data();

        const div = document.createElement("div");

        div.className = "product";

        div.innerHTML = `
            <h3>${table.name}</h3>
            <p>${table.status}</p>
        `;


        // Masa seçme

        div.onclick = () => {

            selectedTable = {
                id: doc.id,
                name: table.name
            };

            selectedTableDiv.innerText =
            "Seçilen Masa: " + table.name;
            
            showTableOrder(table.name);

        };


        tablesDiv.appendChild(div);

    });

}
// Sepete ekle

function addCart(product){

    const exist = cart.find(item => item.id === product.id);


    if(exist){

        exist.qty++;

    }else{

        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            qty: 1
        });

    }


    renderCart();

}


// Sepeti göster

function renderCart(){

    cartDiv.innerHTML = "";

    let total = 0;


    cart.forEach((item,index) => {

        total += item.price * item.qty;


        cartDiv.innerHTML += `
        <div class="cart-item">

            <span>
            ${item.name}
            </span>

            <div>
                <button onclick="changeQty(${index}, -1)">-</button>

                <span style="margin:0 8px;">
                ${item.qty}
                </span>

                <button onclick="changeQty(${index}, 1)">+</button>

                <button onclick="removeItem(${index})">
                🗑
                </button>
            </div>

        </div>
        `;

    });


    totalDiv.innerText = total + " TL";

}



// Sipariş kaydet

saveBtn.onclick = async () => {


    const table = selectedTable?.name;


    if(!selectedTable){

        alert("Masa seçiniz");
        return;

    }


    if(cart.length === 0){

        alert("Sepet boş");
        return;

    }


    let total = cart.reduce(
        (sum,item)=> sum + (item.price * item.qty),
        0
    );


    await addDoc(collection(db,"orders"),{

        table: table,

        items: cart,

        total: total,

        status:"open",

        createdAt: serverTimestamp()

    });

// Masayı dolu yap

await updateDoc(
    doc(db,"tables",selectedTable.id),
    {
        status:"open"
    }
);
    await loadTables();
    alert("Sipariş kaydedildi");


    cart = [];

    renderCart();

};

window.changeQty = function(index, amount){

    cart[index].qty += amount;


    if(cart[index].qty <= 0){

        cart.splice(index,1);

    }


    renderCart();

};


window.removeItem = function(index){

    cart.splice(index,1);

    renderCart();

};

async function showTableOrder(tableName){

    const snapshot = await getDocs(collection(db,"orders"));

    let text = "Seçilen Masa: " + tableName + "\n\n";

    snapshot.forEach(doc=>{

        const order = doc.data();

        if(order.table === tableName && order.status === "open"){

            order.items.forEach(item=>{

                text += 
                item.name + 
                " x" + item.qty + 
                "\n";

            });

            text += "\nToplam: " + order.total + " TL";

        }

    });

    alert(text);

}
// Sayfa açılışında yükle


loadTables();
loadProducts();
