import React, { useEffect, useState } from 'react';
import './Statistics.css';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';

function Statistics() {
  const [usersCount, setUsersCount] = useState(0);
  const [tripsCount, setTripsCount] = useState(0);
  const [provinceCounts, setProvinceCounts] = useState({});
  const [topProvince, setTopProvince] = useState(null);

  const [provinceBookingCounts, setProvinceBookingCounts] = useState({});
  const [topBookingProvince, setTopBookingProvince] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const tripsSnapshot = await getDocs(collection(db, 'trips'));
      const bookingsSnapshot = await getDocs(collection(db, 'bookings'));

      const users = usersSnapshot.docs.map(doc => doc.data());
      const trips = tripsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const bookings = bookingsSnapshot.docs.map(doc => doc.data());

      setUsersCount(users.length);
      setTripsCount(trips.length);

      // حساب عدد الرحلات حسب المحافظة
      const counts = {};
      trips.forEach(trip => {
        if (trip.province) {
          counts[trip.province] = (counts[trip.province] || 0) + 1;
        }
      });
      setProvinceCounts(counts);

      // المحافظة الأكثر رحلات
      const top = Object.entries(counts).reduce(
        (acc, [province, count]) => count > acc.count ? { province, count } : acc,
        { province: 'لا توجد بيانات', count: 0 }
      );
      setTopProvince(top.province);

      // حساب عدد الحجوزات حسب المحافظة
      const bookingCounts = {};
      bookings.forEach(booking => {
        const trip = trips.find(t => t.id === booking.tripId);
        if (trip && trip.province) {
          bookingCounts[trip.province] = (bookingCounts[trip.province] || 0) + 1;
        }
      });
      setProvinceBookingCounts(bookingCounts);

      // المحافظة الأكثر حجوزات
      const topBooking = Object.entries(bookingCounts).reduce(
        (acc, [province, count]) => count > acc.count ? { province, count } : acc,
        { province: 'لا توجد بيانات', count: 0 }
      );
      setTopBookingProvince(topBooking.province);
    };

    fetchData();
  }, []);

  return (
    <div className="stats-page">
      <h1>لوحة الإحصائيات</h1>

      <div className="stats-grid">
        <div className="stat-box users">
          <h3>عدد المستخدمين</h3>
          <p>{usersCount}</p>
        </div>

        <div className="stat-box trips">
          <h3>عدد الرحلات</h3>
          <p>{tripsCount}</p>
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

      <h2 style={{ marginTop: '40px' }}>عدد الرحلات حسب المحافظة</h2>
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

      <h2 style={{ marginTop: '40px' }}>عدد الحجوزات حسب المحافظة</h2>
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
