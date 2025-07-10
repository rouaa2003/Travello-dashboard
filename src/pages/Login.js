import React, { useState } from 'react';
import './Login.css';
import { useNavigate } from 'react-router-dom';

function Login() {

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = () => {
    const correctPassword = 'roaa224'; // كلمة المرور المؤقتة

    if (password === correctPassword) {
      localStorage.setItem('adminLoggedIn', 'true');
      navigate('/');
    } else {
      setError('كلمة المرور غير صحيحة');
    }
  };

  return (
    <div className="login-page">
      <h2>تسجيل دخول المشرف</h2>
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
