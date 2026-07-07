import { db } from "./firebase.js";

import {
collection,
addDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const products = [

/* KAHVELER */
{name:"Americano",price:160,category:"Kahveler",categoryOrder:1,sort:1},
{name:"Latte",price:175,category:"Kahveler",categoryOrder:1,sort:2},
{name:"Cappuccino",price:175,category:"Kahveler",categoryOrder:1,sort:3},
{name:"Flat White",price:175,category:"Kahveler",categoryOrder:1,sort:4},
{name:"Mocha",price:195,category:"Kahveler",categoryOrder:1,sort:5},
{name:"Caramel Macchiato",price:195,category:"Kahveler",categoryOrder:1,sort:6},
{name:"Türk Kahvesi",price:100,category:"Kahveler",categoryOrder:1,sort:7},
{name:"Filtre Kahve",price:150,category:"Kahveler",categoryOrder:1,sort:8},
{name:"Iced Filter Coffee",price:150,category:"Kahveler",categoryOrder:1,sort:9},

/* ÇAYLAR */
{name:"Siyah Çay",price:25,category:"Çaylar",categoryOrder:2,sort:1},
{name:"Ada Çayı",price:25,category:"Çaylar",categoryOrder:2,sort:2},

/* WAFFLE */
{name:"Waffle Tabak",price:300,category:"Waffle",categoryOrder:3,sort:1},
{name:"Waffle Bardak",price:250,category:"Waffle",categoryOrder:3,sort:2},

/* DONDURMA */
{name:"1 Top Dondurma",price:60,category:"Dondurma",categoryOrder:4,sort:1},

/* ATIŞTIRMALIKLAR */
{name:"Nugget Tabağı",price:150,category:"Atıştırmalıklar",categoryOrder:5,sort:1},
{name:"Sosis Tabağı",price:150,category:"Atıştırmalıklar",categoryOrder:5,sort:2},
{name:"Patates Tabağı",price:150,category:"Atıştırmalıklar",categoryOrder:5,sort:3},
{name:"Karışık Tabak",price:300,category:"Atıştırmalıklar",categoryOrder:5,sort:4},

/* BURGERLER */
{name:"Chicken Burger",price:200,category:"Burgerler",categoryOrder:6,sort:1},
{name:"Chicken Burger Menü",price:300,category:"Burgerler",categoryOrder:6,sort:2},

/* TOSTLAR */
{name:"Tost",price:150,category:"Tostlar",categoryOrder:7,sort:1},
{name:"Patso",price:200,category:"Tostlar",categoryOrder:7,sort:2},

/* İÇECEKLER */
{name:"Milkshake",price:250,category:"İçecekler",categoryOrder:8,sort:1},
{name:"Kola",price:100,category:"İçecekler",categoryOrder:8,sort:2},
{name:"Gazoz",price:100,category:"İçecekler",categoryOrder:8,sort:3},
{name:"Soda",price:50,category:"İçecekler",categoryOrder:8,sort:4},
{name:"Su",price:25,category:"İçecekler",categoryOrder:8,sort:5}

];

async function addProducts(){

try{

for(const product of products){

await addDoc(
collection(db,"products"),
product
);

}

alert("Menü başarıyla eklendi.");

}catch(err){

console.error(err);
alert("Hata : " + err.message);

}

}

addProducts();
