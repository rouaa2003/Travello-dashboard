import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import Users from "./pages/Users";
import Trips from "./pages/Trips";
import Statistics from "./pages/Statistics";
import Bookings from "./pages/Bookings";
import Login from "./pages/Login";
import RequireAdmin from "./components/RequireAdmin";
import ManageEntries from "./pages/ManageEntries";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* المسارات المحمية */}
        <Route
          path="/"
          element={
            <RequireAdmin>
              <Layout />
            </RequireAdmin>
          }
        >
          <Route index element={<Home />} />
          <Route path="users" element={<Users />} />
          <Route path="trips" element={<Trips />} />
          <Route path="statistics" element={<Statistics />} />
          <Route path="/manage" element={<ManageEntries />} />ٍ
          <Route path="bookings" element={<Bookings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
