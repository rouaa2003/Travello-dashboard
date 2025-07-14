import React, { useEffect, useState } from "react";
import "./Home.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

function Home() {
  const [userCount, setUserCount] = useState(0);
  const [readyTripCount, setReadyTripCount] = useState(0);
  const [customTripCount, setCustomTripCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [recentTrips, setRecentTrips] = useState([]);
  const [todayTripsCount, setTodayTripsCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const tripsSnapshot = await getDocs(collection(db, "trips"));
        const bookingsSnapshot = await getDocs(collection(db, "bookings"));

        const users = usersSnapshot.docs.map((doc) => doc.data());
        const trips = tripsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const bookings = bookingsSnapshot.docs.map((doc) => doc.data());

        // إحصائيات
        setUserCount(users.length);
        setReadyTripCount(trips.length);
        setBookingCount(bookings.length);
        setCustomTripCount(bookings.filter((b) => b.customTrip).length);

        // ترتيب آخر الرحلات الجاهزة
        const sortedTrips = [...trips].sort((a, b) => {
          const dateA = a.tripDate?.toDate?.() || new Date(a.tripDate);
          const dateB = b.tripDate?.toDate?.() || new Date(b.tripDate);
          return dateB - dateA;
        });
        setRecentTrips(sortedTrips.slice(0, 5));

        // رحلات اليوم (من جدول trips فقط)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTrips = trips.filter((trip) => {
          const tripDate = trip.tripDate?.toDate?.() || new Date(trip.tripDate);
          tripDate.setHours(0, 0, 0, 0);
          return tripDate.getTime() === today.getTime();
        });
        setTodayTripsCount(todayTrips.length);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
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
          <h3>🚌 الرحلات الجاهزة</h3>
          <p>{readyTripCount}</p>
        </div>
        <div className="box">
          <h3>🛠 الرحلات المخصصة</h3>
          <p>{customTripCount}</p>
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
        <h2>🕓 آخر 5 رحلات جاهزة</h2>
        {recentTrips.length === 0 ? (
          <p>لا توجد رحلات جاهزة.</p>
        ) : (
          <table className="recent-trips-table">
            <thead>
              <tr>
                <th>#</th>
                <th>الوجهة</th>
                <th>تاريخ الرحلة</th>
                <th>المدة (أيام)</th>
              </tr>
            </thead>
            <tbody>
              {recentTrips.map((trip, index) => (
                <tr key={trip.id}>
                  <td>{index + 1}</td>
                  <td>
                    {trip.selectedCityIds?.length
                      ? trip.selectedCityIds.join("، ")
                      : trip.province || "غير محدد"}
                  </td>
                  <td>
                    {trip.tripDate?.toDate
                      ? trip.tripDate.toDate().toLocaleDateString("ar-EG")
                      : "غير متوفر"}
                  </td>
                  <td>
                    {trip.tripDuration !== undefined &&
                    trip.tripDuration !== null
                      ? `${trip.tripDuration} ${
                          trip.tripDuration === 1 ? "يوم" : "أيام"
                        }`
                      : "غير متوفرة"}
                  </td>
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
