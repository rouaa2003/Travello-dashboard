import React, { useEffect, useState } from "react";
import AddBookingForm from "./AddBookingForm";

import "./Bookings.css";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

function Bookings() {
  const [bookings, setBookings] = useState([]); // الحجوزات العادية
  const [customBookings, setCustomBookings] = useState([]); // الحجوزات المخصصة
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]); // جدول الرحلات الجاهزة
  const [hospitals, setHospitals] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [places, setPlaces] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newBooking, setNewBooking] = useState({
    userIds: [],
    tripId: "",
    seatsToBook: 1,
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTripDetails, setSelectedTripDetails] = useState(null);

  // المجموعات (Collections)
  const bookingsCollection = collection(db, "bookings");
  const usersCollection = collection(db, "users");
  const tripsCollection = collection(db, "trips");
  const hospitalsCollection = collection(db, "hospitals");
  const hotelsCollection = collection(db, "hotels");
  const placesCollection = collection(db, "places");
  const restaurantsCollection = collection(db, "restaurants");

  // جلب البيانات من Firebase
  const fetchData = async () => {
    setLoading(true);
    try {
      const [
        bookingsSnap,
        usersSnap,
        tripsSnap,
        hospitalsSnap,
        hotelsSnap,
        placesSnap,
        restaurantsSnap,
      ] = await Promise.all([
        getDocs(bookingsCollection),
        getDocs(usersCollection),
        getDocs(tripsCollection),
        getDocs(hospitalsCollection),
        getDocs(hotelsCollection),
        getDocs(placesCollection),
        getDocs(restaurantsCollection),
      ]);

      const allBookings = bookingsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setBookings(allBookings.filter((b) => !b.customTrip));
      setCustomBookings(allBookings.filter((b) => b.customTrip));
      setUsers(usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setTrips(tripsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setHospitals(
        hospitalsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setHotels(hotelsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setPlaces(placesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setRestaurants(
        restaurantsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("حدث خطأ أثناء تحميل البيانات، حاول لاحقاً");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // دالة لتحويل معرفات المستخدمين إلى أسماء
  const getNamesByIds = (idsArray, dataList) => {
    if (!Array.isArray(idsArray)) return "-";
    return idsArray
      .map((id) => dataList.find((item) => item.id === id)?.name || id)
      .join("، ");
  };

  // تنسيق التاريخ
  const formatDate = (dateVal) => {
    if (!dateVal) return "غير متوفر";
    try {
      const dateObj = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      return dateObj.toLocaleDateString("ar-EG");
    } catch {
      return "غير متوفر";
    }
  };

  // حساب المقاعد المتاحة في رحلة جاهزة
  const getAvailableSeats = (trip) => {
    if (!trip) return 0;
    const bookedCount = bookings
      .filter((b) => b.tripId === trip.id)
      .reduce((acc, b) => acc + (b.seatsBooked || b.userIds.length), 0);
    return trip.maxSeats - bookedCount;
  };

  // تحديث اختيار المستخدمين وعدد المقاعد للحجز الجديد
  const handleUserSelect = (e) => {
    const selected = Array.from(e.target.selectedOptions).map(
      (opt) => opt.value
    );
    setNewBooking({ ...newBooking, userIds: selected });
  };

  const handleSeatsChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1) return;
    setNewBooking({ ...newBooking, seatsToBook: val });
  };

  // إضافة حجز جاهز فقط
  const addBooking = async () => {
    if (!newBooking.userIds.length || !newBooking.tripId) {
      return alert("يرجى اختيار المستخدمين والرحلة");
    }

    const trip = trips.find((t) => t.id === newBooking.tripId);
    if (!trip) return alert("الرحلة غير موجودة");

    const availableSeats = getAvailableSeats(trip);
    if (newBooking.seatsToBook > availableSeats) {
      return alert("عدد المقاعد المطلوبة أكبر من المقاعد المتاحة");
    }

    try {
      await addDoc(bookingsCollection, {
        userIds: newBooking.userIds,
        tripId: newBooking.tripId,
        customTrip: false,
        seatsBooked: newBooking.seatsToBook,
        createdAt: new Date(),
      });

      setNewBooking({ userIds: [], tripId: "", seatsToBook: 1 });
      setShowAddModal(false);
      await fetchData();
    } catch (error) {
      console.error("Error adding booking:", error);
      alert("حدث خطأ أثناء إضافة الحجز");
    }
  };

  // حذف الحجز
  const deleteBooking = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الحجز؟")) return;
    try {
      await deleteDoc(doc(db, "bookings", id));
      await fetchData();
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("حدث خطأ أثناء حذف الحجز");
    }
  };

  // فتح مودال تفاصيل الرحلة (جاهزة أو مخصصة)
  const openDetailsModal = (booking, isCustom) => {
    if (isCustom) {
      setSelectedTripDetails(booking);
    } else {
      const trip = trips.find((t) => t.id === booking.tripId);
      setSelectedTripDetails(trip);
    }
    setShowDetailsModal(true);
  };

  // مكون مودال عرض تفاصيل الرحلة
  const TripDetailsModal = ({
    tripData,
    onClose,
    hospitals,
    hotels,
    places,
    restaurants,
  }) => {
    if (!tripData) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content" style={{ textAlign: "right" }}>
          <h3>تفاصيل الرحلة {tripData.customTrip ? "المخصصة" : "الجاهزة"}</h3>
          <p>
            <strong>المدن:</strong>{" "}
            {(tripData.selectedCityIds || []).join("، ") || "غير متوفر"}
          </p>
          <p>
            <strong>المشافي:</strong>{" "}
            {getNamesByIds(tripData.selectedHospitalIds, hospitals)}
          </p>
          <p>
            <strong>الفنادق:</strong>{" "}
            {getNamesByIds(tripData.selectedHotelIds, hotels)}
          </p>
          <p>
            <strong>الأماكن السياحية:</strong>{" "}
            {getNamesByIds(tripData.selectedPlaceIds, places)}
          </p>
          <p>
            <strong>المطاعم:</strong>{" "}
            {getNamesByIds(tripData.selectedRestaurantIds, restaurants)}
          </p>
          <button className="add-btn" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading-indicator">جاري تحميل البيانات...</div>;
  }

  return (
    <div
      className="bookings-page"
      style={{ direction: "rtl", fontFamily: "Cairo, sans-serif", padding: 20 }}
    >
      <h1>إدارة الحجوزات</h1>

      <button className="add-btn" onClick={() => setShowAddModal(true)}>
        إضافة حجز
      </button>

      {/* مودال إضافة حجز */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: "right" }}>
            <AddBookingForm
              users={users}
              trips={trips}
              onSave={async (bookingData) => {
                try {
                  // 1. إضافة الحجز في جدول bookings
                  await addDoc(collection(db, "bookings"), {
                    userIds: bookingData.userIds,
                    tripId: bookingData.tripId,
                    seatsBooked: bookingData.seatsToBook,
                    customTrip: false,
                    createdAt: new Date(),
                  });

                  // 2. تحديث عدد المقاعد المحجوزة في جدول trips
                  const tripRef = doc(db, "trips", bookingData.tripId);

                  // إيجاد بيانات الرحلة من الحالة المحلية
                  const trip = trips.find((t) => t.id === bookingData.tripId);
                  const currentSeatsBooked = trip?.seatsBooked || 0;
                  const newSeatsBooked =
                    currentSeatsBooked + bookingData.seatsToBook;

                  // تحديث القيمة في قاعدة البيانات
                  await updateDoc(tripRef, {
                    seatsBooked: newSeatsBooked,
                  });

                  // 3. إغلاق المودال وإعادة تحميل البيانات
                  setShowAddModal(false);
                  await fetchData();
                } catch (err) {
                  alert("حدث خطأ أثناء إضافة الحجز");
                  console.error(err);
                }
              }}
              onCancel={() => setShowAddModal(false)}
              getAvailableSeats={getAvailableSeats}
              formatDate={formatDate}
            />
          </div>
        </div>
      )}

      {/* جدول الحجوزات (عادية + مخصصة) */}
      <table
        className="bookings-table"
        style={{ marginTop: 20, width: "100%", borderCollapse: "collapse" }}
      >
        <thead>
          <tr style={{ backgroundColor: "#00892e", color: "white" }}>
            <th>رقم</th>
            <th>المستخدمون</th>
            <th>الوجهة</th>
            <th>تاريخ الرحلة</th>
            <th>نوع الرحلة</th>
            <th>عدد المقاعد </th>
            <th>تفاصيل</th>
            <th>حذف</th>
          </tr>
        </thead>
        <tbody>
          {/* الحجوزات العادية */}
          {bookings.map((booking, index) => {
            const trip = trips.find((t) => t.id === booking.tripId);
            const availableSeats = getAvailableSeats(trip);
            return (
              <tr key={booking.id} style={{ borderBottom: "1px solid #eee" }}>
                <td>{index + 1}</td>
                <td>{getNamesByIds(booking.userIds, users)}</td>
                <td>{trip?.selectedCityIds?.join("، ") || "غير متوفر"}</td>
                <td>{formatDate(trip?.tripDate)}</td>
                <td>جاهزة</td>
                <td>
                  {booking.seatsBooked} / {trip?.maxSeats || "غير معروف"}
                </td>
                <td>
                  <button
                    className="show-btn"
                    onClick={() => openDetailsModal(booking, false)}
                  >
                    عرض التفاصيل
                  </button>
                </td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => deleteBooking(booking.id)}
                  >
                    🗑 حذف
                  </button>
                </td>
              </tr>
            );
          })}

          {/* الحجوزات المخصصة */}
          {customBookings.map((booking, index) => (
            <tr key={booking.id} style={{ borderBottom: "1px solid #eee" }}>
              <td>{bookings.length + index + 1}</td>
              <td>{getNamesByIds(booking.userIds, users)}</td>
              <td>{booking.selectedCityIds?.join("، ") || "غير متوفر"}</td>
              <td>{formatDate(booking.tripDate)}</td>
              <td>مخصصة</td>
              <td>هذه الرحلة مخصصة</td>
              <td>
                <button
                  className="show-btn"
                  onClick={() => openDetailsModal(booking, true)}
                >
                  عرض التفاصيل
                </button>
              </td>
              <td>
                <button
                  className="delete-btn"
                  onClick={() => deleteBooking(booking.id)}
                >
                  🗑 حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* مودال تفاصيل الرحلة */}
      {showDetailsModal && selectedTripDetails && (
        <TripDetailsModal
          tripData={selectedTripDetails}
          onClose={() => setShowDetailsModal(false)}
          hospitals={hospitals}
          hotels={hotels}
          places={places}
          restaurants={restaurants}
        />
      )}
    </div>
  );
}

export default Bookings;
