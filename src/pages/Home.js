import React, { useEffect, useState } from "react";
import "./Home.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

function Home() {
  const [userCount, setUserCount] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [recentTrips, setRecentTrips] = useState([]);
  const [todayTripsCount, setTodayTripsCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const tripsSnapshot = await getDocs(collection(db, "trips"));
      const bookingsSnapshot = await getDocs(collection(db, "bookings"));

      const users = usersSnapshot.docs.map((doc) => doc.data());
      const trips = tripsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const bookings = bookingsSnapshot.docs.map((doc) => doc.data());

      setUserCount(users.length);
      setTripCount(trips.length);
      setBookingCount(bookings.length);

      // ترتيب الرحلات حسب التاريخ نزولاً
      const sortedTrips = [...trips].sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );
      setRecentTrips(sortedTrips.slice(0, 5));

      // عدد رحلات اليوم
      const today = new Date().toISOString().split("T")[0];
      const todayTrips = trips.filter((trip) => trip.date === today);
      setTodayTripsCount(todayTrips.length);
    };

    fetchData();
  }, []);

  return (
    <div className="home-page">
      <h1>👋 مرحبًا بك في لوحة التحكم</h1>
      <p>يمكنك من هنا إدارة المستخدمين، الرحلات، والحجوزات.</p>

      <div className="stats-boxes">
        <div className="box">
          <h3>👤 المستخدمين</h3>
          <p>{userCount}</p>
        </div>
        <div className="box">
          <h3>🚌 الرحلات</h3>
          <p>{tripCount}</p>
        </div>
        <div className="box">
          <h3>📆 الحجوزات</h3>
          <p>{bookingCount}</p>
        </div>
        <div className="box">
          <h3>🗓 رحلات اليوم</h3>
          <p>{todayTripsCount}</p>
        </div>
      </div>

      <div className="recent-trips">
        <h2>🕓 آخر 5 رحلات مضافة</h2>
        {recentTrips.length === 0 ? (
          <p>لا توجد رحلات.</p>
        ) : (
          <table className="recent-trips-table">
            <thead>
              <tr>
                <th>الوجهة</th>
                <th>التاريخ</th>
                <th>السعر</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((trip) => (
                <tr key={trip.id}>
                  <td>{trip.province}</td>
                  <td>
                    {trip.date?.toDate
                      ? trip.date.toDate().toLocaleDateString()
                      : trip.date}
                  </td>
                  <td>{trip.price ? `${trip.price} ل.س` : "غير متوفر"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default Home;
