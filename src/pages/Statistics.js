import React, { useEffect, useState } from 'react';
import './Statistics.css';

function Statistics() {
  const [usersCount, setUsersCount] = useState(0);
  const [tripsCount, setTripsCount] = useState(0);
  const [provinceCounts, setProvinceCounts] = useState({});
  const [topProvince, setTopProvince] = useState(null);

  const [provinceBookingCounts, setProvinceBookingCounts] = useState({});
  const [topBookingProvince, setTopBookingProvince] = useState(null);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const trips = JSON.parse(localStorage.getItem('trips')) || [];
    const bookings = JSON.parse(localStorage.getItem('bookings')) || [];

    setUsersCount(users.length);
    setTripsCount(trips.length);

    // حساب عدد الرحلات حسب المحافظة (destination بدل province)
    const counts = {};
    trips.forEach(trip => {
      if (trip.destination) {
        counts[trip.destination] = (counts[trip.destination] || 0) + 1;
      }
    });
    setProvinceCounts(counts);

    // تحديد المحافظة الأكثر نشاطًا (حسب الرحلات)
    let max = 0;
    let top = null;
    for (let province in counts) {
      if (counts[province] > max) {
        max = counts[province];
        top = province;
      }
    }
    setTopProvince(top ?? 'لا توجد بيانات');

    // حساب عدد الحجوزات حسب المحافظة
    // نفترض أن كل حجز يحتوي على tripId لنربطه بالرحلة
    // ثم نستخدم destination من الرحلة
    const bookingCounts = {};
    bookings.forEach(booking => {
      // إيجاد الرحلة المرتبطة بالحجز
      const trip = trips.find(t => t.id === booking.tripId);
      if (trip && trip.destination) {
        bookingCounts[trip.destination] = (bookingCounts[trip.destination] || 0) + 1;
      }
    });
    setProvinceBookingCounts(bookingCounts);

    // تحديد المحافظة الأكثر حجوزات
    let maxBookings = 0;
    let topBookingProv = null;
    for (let province in bookingCounts) {
      if (bookingCounts[province] > maxBookings) {
        maxBookings = bookingCounts[province];
        topBookingProv = province;
      }
    }
    setTopBookingProvince(topBookingProv ?? 'لا توجد بيانات');
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
