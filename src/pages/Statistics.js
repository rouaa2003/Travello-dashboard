import React, { useEffect, useState } from "react";
import "./Statistics.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

function Statistics() {
  const [usersCount, setUsersCount] = useState(0);
  const [readyTripsCount, setReadyTripsCount] = useState(0);
  const [customTripsCount, setCustomTripsCount] = useState(0);
  const [provinceCounts, setProvinceCounts] = useState({});
  const [topProvince, setTopProvince] = useState(null);
  const [provinceBookingCounts, setProvinceBookingCounts] = useState({});
  const [topBookingProvince, setTopBookingProvince] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const usersSnap = await getDocs(collection(db, "users"));
      const tripsSnap = await getDocs(collection(db, "trips"));
      const bookingsSnap = await getDocs(collection(db, "bookings"));

      const users = usersSnap.docs.map((doc) => doc.data());
      const trips = tripsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const bookings = bookingsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setUsersCount(users.length);

      const readyTrips = trips;
      const customTrips = bookings.filter((b) => b.customTrip);

      setReadyTripsCount(readyTrips.length);
      setCustomTripsCount(customTrips.length);

      // === إحصائيات الرحلات حسب المحافظة ===
      const cityCounts = {};

      [...readyTrips, ...customTrips].forEach((trip) => {
        const cities = trip.selectedCityIds || [];
        const mainCity = cities[0];
        if (mainCity) {
          cityCounts[mainCity] = (cityCounts[mainCity] || 0) + 1;
        }
      });

      setProvinceCounts(cityCounts);

      const top = Object.entries(cityCounts).reduce(
        (acc, [city, count]) => (count > acc.count ? { city, count } : acc),
        { city: "لا توجد بيانات", count: 0 }
      );
      setTopProvince(top.city);

      // === إحصائيات الحجوزات حسب المحافظة ===
      const bookingCityCounts = {};

      bookings.forEach((booking) => {
        const trip =
          booking.customTrip === true
            ? booking
            : trips.find((t) => t.id === booking.tripId);

        const cities = trip?.selectedCityIds || [];
        const mainCity = cities[0];
        if (mainCity) {
          bookingCityCounts[mainCity] = (bookingCityCounts[mainCity] || 0) + 1;
        }
      });

      setProvinceBookingCounts(bookingCityCounts);

      const topBooking = Object.entries(bookingCityCounts).reduce(
        (acc, [city, count]) => (count > acc.count ? { city, count } : acc),
        { city: "لا توجد بيانات", count: 0 }
      );
      setTopBookingProvince(topBooking.city);

      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) return <p>جارٍ تحميل البيانات...</p>;

  return (
    <div className="stats-page" dir="rtl">
      <h1>لوحة الإحصائيات</h1>

      <div className="stats-grid">
        <div className="stat-box users">
          <h3>عدد المستخدمين</h3>
          <p>{usersCount}</p>
        </div>

        <div className="stat-box trips">
          <h3>عدد الرحلات الجاهزة</h3>
          <p>{readyTripsCount}</p>
        </div>

        <div className="stat-box trips">
          <h3>عدد الرحلات المخصصة</h3>
          <p>{customTripsCount}</p>
        </div>

        <div className="stat-box top-province">
          <h3>أكثر محافظة نشاطًا (رحلات)</h3>
          <p>{topProvince}</p>
        </div>

        <div className="stat-box top-booking-province">
          <h3>أكثر محافظة عليها حجوزات</h3>
          <p>{topBookingProvince}</p>
        </div>
      </div>

      <h2 style={{ marginTop: "40px" }}>عدد الرحلات حسب المحافظة</h2>
      {Object.keys(provinceCounts).length === 0 ? (
        <p>لا توجد بيانات متاحة</p>
      ) : (
        <table className="province-table">
          <thead>
            <tr>
              <th>المحافظة</th>
              <th>عدد الرحلات</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(provinceCounts).map(([province, count]) => (
              <tr key={province}>
                <td>{province}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ marginTop: "40px" }}>عدد الحجوزات حسب المحافظة</h2>
      {Object.keys(provinceBookingCounts).length === 0 ? (
        <p>لا توجد بيانات متاحة</p>
      ) : (
        <table className="province-table">
          <thead>
            <tr>
              <th>المحافظة</th>
              <th>عدد الحجوزات</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(provinceBookingCounts).map(([province, count]) => (
              <tr key={province}>
                <td>{province}</td>
                <td>{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Statistics;
