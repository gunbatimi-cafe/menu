import { db } from "./firebase.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

export async function getProducts() {

    const products = [];

    const querySnapshot = await getDocs(collection(db, "products"));

    querySnapshot.forEach((doc) => {

        products.push({
            id: doc.id,
            ...doc.data()
        });

    });

    return products;

}
