import { auth } from "./firebase.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const loginBtn = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async () => {

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const error = document.getElementById("error");

    error.textContent = "";

    try {

        await signInWithEmailAndPassword(auth, email, password);

        window.location.href = "tables.html";

    } catch (e) {

        error.textContent = "E-posta veya şifre hatalı.";

    }

});
