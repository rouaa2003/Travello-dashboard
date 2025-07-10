import React from 'react';
import Sidebar from './Sidebar';
import { Outlet, Navigate } from 'react-router-dom';
import './Layout.css';

function Layout() {
 
  return (
    <div className="layout-container">
      <Sidebar />
      <div className="page-content">
        <Outlet />
      </div>
    </div>
  );
}

export default Layout;
