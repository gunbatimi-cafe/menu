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
getDoc
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


// ödeme modal

const paymentModal = document.getElementById("paymentModal");
const paymentTableName = document.getElementById("paymentTableName");

const confirmPayment = document.getElementById("confirmPayment");
const deleteOrderBtn = document.getElementById("deleteOrder");
const cancelPayment = document.getElementById("cancelPayment");



// Ürünleri yükle

async function loadProducts(){


    products = await getProducts();


    productsDiv.innerHTML="";


    products.forEach(product=>{


        const div=document.createElement("div");


        div.className="product";


        div.innerHTML=`

        <h3>${product.name}</h3>

        <p>${product.price} TL</p>

        `;


        div.onclick=()=>{


            addCart(product);


        };


        productsDiv.appendChild(div);


    });


}




// Masaları yükle

async function loadTables(){


    const snapshot = await getDocs(
        collection(db,"tables")
    );


    tablesDiv.innerHTML="";



    let tables=[];


    snapshot.forEach(docSnap=>{


        tables.push({

            id:docSnap.id,

            ...docSnap.data()

        });


    });



    tables.sort(

        (a,b)=>a.number-b.number

    );



    tables.forEach(table=>{


        const div=document.createElement("div");


        div.className="product";



        let statusText =
        table.status==="open"
        ? "Açık"
        : "Boş";



        div.innerHTML=`

        <h3>${table.name}</h3>

        <p>${statusText}</p>

        `;



        div.onclick=()=>{


            selectedTable={

                id:table.id,

                name:table.name,

                number:table.number

            };


            selectedTableDiv.innerText=
            "Seçilen Masa: "+table.name;



            if(table.status==="open"){

                loadOpenOrder(table.name);

            }
            else{


                cart=[];

                currentOrderId=null;

                renderCart();


            }



        };



        tablesDiv.appendChild(div);



    });



}



// Açık siparişi bul

async function findOpenOrder(tableName){


    const q=query(

        collection(db,"orders"),

        where("table","==",tableName),

        where("status","==","open")

    );


    const snapshot = await getDocs(q);



    if(snapshot.empty){

        return null;

    }



    const orderDoc=snapshot.docs[0];


    return {

        id:orderDoc.id,

        ...orderDoc.data()

    };


}



// Masanın açık adisyonunu yükle

async function loadOpenOrder(tableName){


    const order = await findOpenOrder(tableName);



    if(!order){

        cart=[];

        currentOrderId=null;

        renderCart();

        return;

    }



    currentOrderId=order.id;



    cart=order.items || [];


    renderCart();


}// Sepeti göster

function renderCart(){


    cartDiv.innerHTML="";


    let total=0;



    cart.forEach((item,index)=>{


        total += item.price * item.qty;



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



    totalDiv.innerText =
    total+" TL";


}



// Ürün sepete ekleme

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




// Sipariş kaydet

saveBtn.onclick=async()=>{


    if(!selectedTable){

        alert("Masa seçiniz");

        return;

    }



    if(cart.length===0){

        alert("Ürün seçiniz");

        return;

    }




    let total = cart.reduce(

        (sum,item)=>

        sum+(item.price*item.qty),

        0

    );




    const oldOrder =
    await findOpenOrder(selectedTable.name);




    // açık sipariş varsa güncelle

    if(oldOrder){


        await updateDoc(

            doc(db,"orders",oldOrder.id),

            {

                items:cart,

                total:total

            }

        );


        currentOrderId=oldOrder.id;



    }

    else{



        const newOrder =
        await addDoc(

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



        currentOrderId=newOrder.id;



        await updateDoc(

            doc(db,"tables",selectedTable.id),

            {

                status:"open"

            }

        );


    }



    await loadTables();


    alert("Adisyon güncellendi");


};






// Sepetteki ürün azalt artır

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





// Ödeme penceresini aç

const closeTableBtn =
document.getElementById("closeTable");

if(!paymentModal){
    console.log("Ödeme modal bulunamadı");
}

if(!confirmPayment){
    console.log("Ödeme butonu bulunamadı");
}

if(closeTableBtn){


closeTableBtn.onclick=()=>{


    if(!currentOrderId){

        alert("Açık masa seçiniz");

        return;

    }



    paymentTableName.innerText =
    selectedTable.name;



    paymentModal.style.display="flex";



};



}






// Ödemeyi tamamla

confirmPayment.onclick=async()=>{


    const payment =
    document.querySelector(
        'input[name="payment"]:checked'
    ).value;



    await updateDoc(

        doc(db,"orders",currentOrderId),

        {

            status:"closed",

            paymentType:payment,

            closedAt:serverTimestamp()

        }

    );



    await updateDoc(

        doc(db,"tables",selectedTable.id),

        {

            status:"empty"

        }

    );



    closePaymentWindow();


};






// Masayı sil (ciroya girmez)

deleteOrderBtn.onclick=async()=>{


    let ok =
    confirm(
    "Bu sipariş silinecek ve ciroya eklenmeyecek. Emin misiniz?"
    );



    if(!ok) return;




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



    closePaymentWindow();


};





// ödeme penceresi kapat

function closePaymentWindow(){


    paymentModal.style.display="none";


    cart=[];


    currentOrderId=null;
    selectedTable=null;

selectedTableDiv.innerText =
"Seçilen Masa: Yok";


    renderCart();


    loadTables();
    


}





cancelPayment.onclick=()=>{


    paymentModal.style.display="none";


};






// Başlat

loadTables();

loadProducts();
