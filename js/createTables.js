import { db } from "./firebase.js";

import {
collection,
addDoc,
getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const btn=document.getElementById("createTables");

btn.onclick=async()=>{

const snapshot=await getDocs(
collection(db,"tables")
);

const existing=[];

snapshot.forEach(doc=>{

existing.push(doc.data().number);

});

let added=0;

for(let i=1;i<=20;i++){

if(existing.includes(i)) continue;

await addDoc(

collection(db,"tables"),

{

name:"Masa "+i,

number:i,

status:"empty"

}

);

added++;

}

alert(added+" adet yeni masa eklendi.");

};
