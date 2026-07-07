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
let currentOrderId = null;


const productsDiv = document.getElementById("products");
const cartDiv = document.getElementById("cart");
const totalDiv = document.getElementById("total");
const saveBtn = document.getElementById("saveOrder");
const tablesDiv = document.getElementById("tables");
const selectedTableDiv = document.getElementById("selectedTable");
const closeBtn = document.getElementById("closeTable");


// Ürünleri yükle

async function loadProducts(){

    products = await getProducts();

    productsDiv.innerHTML = "";

    products.forEach(product=>{

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


    snapshot.forEach(docSnap=>{

        const table = docSnap.data();


        const div = document.createElement("div");

        div.className="product";


        div.innerHTML=`

        <h3>${table.name}</h3>
        <p>${table.status}</p>

        `;


        div.onclick=()=>{


            selectedTable={

                id:docSnap.id,

                name:table.name

            };


            selectedTableDiv.innerText =
            "Seçilen Masa: "+table.name;


            showTableOrder(table.name);


        };


        tablesDiv.appendChild(div);


    });


}



// Sepete ürün ekleme

function addCart(product){


    const exist = cart.find(
        item=>item.id===product.id
    );


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



// Sepeti göster

function renderCart(){


    cartDiv.innerHTML="";

    let total=0;


    cart.forEach((item,index)=>{


        total += item.price*item.qty;



        cartDiv.innerHTML += `

        <div class="cart-item">

        <span>
        ${item.name} x${item.qty}
        </span>


        <div>

        <button onclick="changeQty(${index},-1)">
        -
        </button>


        <button onclick="changeQty(${index},1)">
        +
        </button>


        <button onclick="removeItem(${index})">
        🗑
        </button>

        </div>

        </div>

        `;


    });


    totalDiv.innerText=total+" TL";


}



// Sipariş kaydet

saveBtn.onclick=async()=>{


    if(!selectedTable){

        alert("Masa seçiniz");
        return;

    }


    if(cart.length===0){

        alert("Sepet boş");
        return;

    }



    let total = cart.reduce(

        (sum,item)=>sum+(item.price*item.qty),

        0

    );



    await addDoc(collection(db,"orders"),{

        table:selectedTable.name,

        items:cart,

        total:total,

        status:"open",

        createdAt:serverTimestamp()

    });



    await updateDoc(

        doc(db,"tables",selectedTable.id),

        {

            status:"open"

        }

    );



    cart=[];

    renderCart();


    await loadTables();


    alert("Sipariş kaydedildi");


};




// Masadaki siparişi göster

async function showTableOrder(tableName){


    const snapshot = await getDocs(collection(db,"orders"));


    cartDiv.innerHTML="";


    let total=0;



    snapshot.forEach(docSnap=>{


        const order=docSnap.data();



        if(order.table===tableName && order.status==="open"){


            currentOrderId=docSnap.id;



            order.items.forEach((item,index)=>{


                total += item.price*item.qty;



                cartDiv.innerHTML += `


                <div class="cart-item">


                <span>
                ${item.name} x${item.qty}
                </span>


                <div>


                <button onclick="editOrderQty(${index},-1)">
                -
                </button>


                <button onclick="editOrderQty(${index},1)">
                +
                </button>


                <button onclick="deleteOrderItem(${index})">
                🗑
                </button>


                </div>


                </div>


                `;


            });


        }


    });



    totalDiv.innerText=total+" TL";


}



// Açık siparişte adet değiştir

window.editOrderQty=async function(index,amount){


    const orderRef=doc(db,"orders",currentOrderId);


    const snap=await getDocs(collection(db,"orders"));


    snap.forEach(async d=>{


        if(d.id===currentOrderId){


            let order=d.data();


            order.items[index].qty += amount;



            if(order.items[index].qty<=0){

                order.items.splice(index,1);

            }



            order.total=order.items.reduce(

                (sum,item)=>sum+(item.price*item.qty),

                0

            );



            await updateDoc(orderRef,{

                items:order.items,

                total:order.total

            });



            showTableOrder(order.table);


        }


    });


};




// Ürün sil

window.deleteOrderItem=async function(index){


    const orderRef=doc(db,"orders",currentOrderId);


    const snap=await getDocs(collection(db,"orders"));


    snap.forEach(async d=>{


        if(d.id===currentOrderId){


            let order=d.data();


            order.items.splice(index,1);



            order.total=order.items.reduce(

                (sum,item)=>sum+(item.price*item.qty),

                0

            );



            await updateDoc(orderRef,{

                items:order.items,

                total:order.total

            });



            showTableOrder(order.table);


        }


    });


};



// Sepette adet değiştir

window.changeQty=function(index,amount){


    cart[index].qty += amount;


    if(cart[index].qty<=0){

        cart.splice(index,1);

    }


    renderCart();


};



// Sepetten sil

window.removeItem=function(index){


    cart.splice(index,1);


    renderCart();


};



// Masa kapat / ödeme al

if(closeBtn){

closeBtn.onclick=async()=>{


    if(!currentOrderId || !selectedTable){

        alert("Açık masa seçiniz");

        return;

    }



    await updateDoc(

        doc(db,"orders",currentOrderId),

        {

            status:"closed"

        }

    );



    await updateDoc(

        doc(db,"tables",selectedTable.id),

        {

            status:"empty"

        }

    );



    currentOrderId=null;


    cartDiv.innerHTML="";

    totalDiv.innerText="0 TL";


    await loadTables();


    alert("Masa kapatıldı");


};


}



// Başlat

loadTables();

loadProducts();
