import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase"; // تأكد أن المسارات صحيحة

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError("");

    try {
      // تسجيل الدخول باستخدام Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // جلب بيانات المستخدم من Firestore
      const userDoc = await getDoc(doc(db, "users", user.uid));

      if (userDoc.exists() && userDoc.data().isAdmin) {
        localStorage.setItem("adminLoggedIn", "true");
        navigate("/");
      } else {
        setError("ليس لديك صلاحية الوصول كمسؤول.");
      }
    } catch (err) {
      console.error(err);
      setError("فشل تسجيل الدخول. تحقق من البريد أو كلمة المرور.");
    }
  };

  return (
    <div className="login-page">
      <h2>تسجيل دخول المشرف</h2>
      <input
        type="email"
        placeholder="أدخل البريد الإلكتروني"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <input
        type="password"
        placeholder="أدخل كلمة المرور"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>دخول</button>
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default Login;
