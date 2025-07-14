import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css";

function Sidebar() {
  const handleLogout = () => {
    localStorage.removeItem("adminLoggedIn");
    window.location.href = "/login";
  };

  return (
    <div className="sidebar">
      <h2 className="logo">Travello dashboard</h2>
      <nav>
        <NavLink to="/" end>
          الرئيسية
        </NavLink>
        <NavLink to="/users">المستخدمين</NavLink>
        <NavLink to="/trips">الرحلات الجاهزة</NavLink>
        <NavLink to="/add-trip">أضف رحلة </NavLink>

        <NavLink to="/bookings">الحجوزات</NavLink>
        <NavLink to="/manage">إدارة المدخلات</NavLink>
        <NavLink to="/statistics">الإحصائيات</NavLink>
        <button className="logout-btn" onClick={handleLogout}>
          تسجيل الخروج
        </button>
      </nav>
    </div>
  );
}

export default Sidebar;
