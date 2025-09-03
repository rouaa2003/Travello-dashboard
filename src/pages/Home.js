import React, { useEffect, useState } from "react";
import "./Home.css";
import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";

function Home() {
  const [userCount, setUserCount] = useState(0);
  const [readyTripCount, setReadyTripCount] = useState(0);
  const [customTripCount, setCustomTripCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [todayTripsCount, setTodayTripsCount] = useState(0);
  const [cities, setCities] = useState([]);
  const [animatedCounts, setAnimatedCounts] = useState({
    users: 0,
    readyTrips: 0,
    customTrips: 0,
    bookings: 0,
    todayTrips: 0,
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const tripsSnapshot = await getDocs(collection(db, "trips"));
        const bookingsSnapshot = await getDocs(collection(db, "bookings"));
        const citiesSnapshot = await getDocs(collection(db, "cities"));

        const users = usersSnapshot.docs.map((doc) => doc.data());
        const trips = tripsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        const bookings = bookingsSnapshot.docs.map((doc) => doc.data());
        const citiesData = citiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCities(citiesData);

        // إحصائيات عامة
        const totalUsers = users.length;
        const totalTrips = trips.length;
        const totalBookings = bookings.length;
        const totalCustomTrips = bookings.filter((b) => b.customTrip).length;

        setUserCount(totalUsers);
        setReadyTripCount(totalTrips);
        setBookingCount(totalBookings);
        setCustomTripCount(totalCustomTrips);

        // عدادات متحركة
        animateCounter("users", totalUsers);
        animateCounter("readyTrips", totalTrips);
        animateCounter("customTrips", totalCustomTrips);
        animateCounter("bookings", totalBookings);

        // ترتيب الرحلات القادمة فقط
        const today = new Date();
        const upcoming = trips
          .filter((trip) => {
            const tripDate =
              trip.tripDate?.toDate?.() || new Date(trip.tripDate);
            return tripDate >= today; // فقط الرحلات القادمة
          })
          .sort((a, b) => {
            const dateA = a.tripDate?.toDate?.() || new Date(a.tripDate);
            const dateB = b.tripDate?.toDate?.() || new Date(b.tripDate);
            return dateA - dateB; // ترتيب تصاعدي حسب التاريخ
          })
          .slice(0, 5);

        setUpcomingTrips(upcoming);

        // رحلات اليوم فقط
        today.setHours(0, 0, 0, 0);
        const todayTrips = trips.filter((trip) => {
          const tripDate = trip.tripDate?.toDate?.() || new Date(trip.tripDate);
          tripDate.setHours(0, 0, 0, 0);
          return tripDate.getTime() === today.getTime();
        });
        setTodayTripsCount(todayTrips.length);
        animateCounter("todayTrips", todayTrips.length);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      }
    };

    fetchData();
  }, []);

  // دالة عدادات متحركة
  const animateCounter = (key, target) => {
    let start = 0;
    const duration = 800; // مدة الحركة بالمللي ثانية
    const stepTime = Math.abs(Math.floor(duration / target));
    const timer = setInterval(() => {
      start += 1;
      setAnimatedCounts((prev) => ({ ...prev, [key]: start }));
      if (start >= target) clearInterval(timer);
    }, stepTime);
  };

  // دالة لجلب أسماء المحافظات بالعربي
  const getCityNames = (cityIds) => {
    if (!cityIds || !Array.isArray(cityIds)) return "غير محدد";
    return cityIds
      .map((id) => {
        const city = cities.find((c) => c.id === id);
        return city ? city.name : id;
      })
      .join("، ");
  };

  return (
    <div className="home-page">
      <h1>👋 مرحبًا بك في لوحة التحكم</h1>
      <p>يمكنك من هنا إدارة المستخدمين، الرحلات، والحجوزات.</p>

      {/* الصناديق الإحصائية */}
      <div className="stats-boxes">
        <div className="box">
          <h3>👤 المستخدمين</h3>
          <p>{animatedCounts.users}</p>
        </div>
        <div className="box">
          <h3>🚌 الرحلات الجاهزة</h3>
          <p>{animatedCounts.readyTrips}</p>
        </div>
        <div className="box">
          <h3>🛠 الرحلات المخصصة</h3>
          <p>{animatedCounts.customTrips}</p>
        </div>
        <div className="box">
          <h3>📆 الحجوزات</h3>
          <p>{animatedCounts.bookings}</p>
        </div>
        <div className="box">
          <h3>🗓 رحلات اليوم</h3>
          <p>{animatedCounts.todayTrips}</p>
        </div>
      </div>

      {/* جدول الرحلات القادمة */}
      <div className="recent-trips">
        <h2>🚀 الرحلات القادمة (أقرب 5)</h2>
        {upcomingTrips.length === 0 ? (
          <p>لا توجد رحلات قادمة.</p>
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
              {upcomingTrips.map((trip, index) => (
                <tr key={trip.id}>
                  <td>{index + 1}</td>
                  <td>
                    {trip.selectedCityIds?.length
                      ? getCityNames(trip.selectedCityIds)
                      : "غير محدد"}
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
