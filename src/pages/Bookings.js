import React, { useEffect, useState } from "react";
import AddBookingForm from "./AddBookingForm";

import "./Bookings.css";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  getDoc,
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
  const [filterUser, setFilterUser] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState(""); // "custom" أو "ready"

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
  //

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

  // حذف الحجز
  const deleteBooking = async (id) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الحجز؟")) return;
    try {
      const bookingDocRef = doc(db, "bookings", id);
      const bookingSnap = await getDoc(bookingDocRef);

      if (!bookingSnap.exists()) {
        alert("الحجز غير موجود");
        return;
      }

      const bookingData = bookingSnap.data();
      console.log("Booking data before delete:", bookingData);

      if (!bookingData.customTrip && bookingData.tripId) {
        const tripDocRef = doc(db, "trips", bookingData.tripId);
        const tripSnap = await getDoc(tripDocRef);

        if (tripSnap.exists()) {
          const tripData = tripSnap.data();
          console.log("Trip data before update:", tripData);

          const seatsBookedInBooking =
            bookingData.seatsBooked || bookingData.userIds.length || 0;
          const updatedSeatsBooked =
            (tripData.seatsBooked || 0) - seatsBookedInBooking;

          console.log(
            "Updating seatsBooked to:",
            updatedSeatsBooked < 0 ? 0 : updatedSeatsBooked
          );

          await updateDoc(tripDocRef, {
            seatsBooked: updatedSeatsBooked < 0 ? 0 : updatedSeatsBooked,
          });
        }
      }

      await deleteDoc(bookingDocRef);

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
  const allBookings = [
    ...bookings.map((b) => ({ ...b, type: "جاهزة" })),
    ...customBookings.map((b) => ({ ...b, type: "مخصصة" })),
  ];
  const formatDateForFilter = (dateVal) => {
    if (!dateVal) return "";
    const dateObj = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const filteredBookings = allBookings
    .filter((booking) => {
      const userNames = getNamesByIds(booking.userIds, users);
      const cityNames = (
        booking.selectedCityIds ||
        trips.find((t) => t.id === booking.tripId)?.selectedCityIds ||
        []
      ).join("، ");

      const tripDate = booking.customTrip
        ? booking.tripDate
        : trips.find((t) => t.id === booking.tripId)?.tripDate;

      const formattedDate = formatDate(tripDate);

      const matchesUser = !filterUser || userNames.includes(filterUser.trim());
      const matchesCity = !filterCity || cityNames.includes(filterCity.trim());
      const matchesDate =
        !filterDate || formatDateForFilter(tripDate) === filterDate;

      const matchesType =
        !filterType ||
        (filterType === "custom" && booking.customTrip) ||
        (filterType === "ready" && !booking.customTrip);

      return matchesUser && matchesCity && matchesDate && matchesType;
    })
    // 🔹 هنا نضيف الترتيب
    .sort((a, b) => {
      const createdAtA = a.createdAt?.toDate?.() || new Date(a.createdAt);
      const createdAtB = b.createdAt?.toDate?.() || new Date(b.createdAt);
      return createdAtB - createdAtA; // الأحدث أولاً
    });

  return (
    <div
      className="bookings-page"
      style={{ direction: "rtl", fontFamily: "Cairo, sans-serif", padding: 20 }}
    >
      <h1>إدارة الحجوزات</h1>
      <div className="filters-row">
        <input
          type="text"
          className="f-user"
          placeholder="🔍 اسم المستخدم"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
        />

        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
        >
          <option value="">كل المدن</option>
          {[
            ...new Set([
              ...trips.flatMap((t) => t.selectedCityIds || []),
              ...customBookings.flatMap((b) => b.selectedCityIds || []),
            ]),
          ].map((city, i) => (
            <option key={i} value={city}>
              {city}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">كل الأنواع</option>
          <option value="ready">رحلات جاهزة</option>
          <option value="custom">رحلات مخصصة</option>
        </select>
      </div>

      <button className="add-btn myadd" onClick={() => setShowAddModal(true)}>
        إضافة حجز
      </button>

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
          {filteredBookings.map((booking, index) => {
            const isCustom = booking.customTrip;
            const trip = isCustom
              ? null
              : trips.find((t) => t.id === booking.tripId);

            return (
              <tr key={booking.id}>
                <td>{index + 1}</td>
                <td>
                  {booking.customTrip
                    ? users.find((u) => u.id === booking.userId)?.name ||
                      booking.userId
                    : getNamesByIds(booking.userIds, users)}
                </td>

                <td>
                  {isCustom
                    ? booking.selectedCityIds?.join("، ")
                    : trip?.selectedCityIds?.join("، ")}
                </td>
                <td>
                  {formatDate(isCustom ? booking.tripDate : trip?.tripDate)}
                </td>
                <td>{isCustom ? "مخصصة" : "جاهزة"}</td>
                <td>
                  {isCustom
                    ? "مخصصة"
                    : `${booking.seatsBooked} / ${trip?.maxSeats || "?"}`}
                </td>
                <td>
                  <button
                    className="show-btn"
                    onClick={() => openDetailsModal(booking, isCustom)}
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
        </tbody>
      </table>

      {/* مودال إضافة حجز */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ textAlign: "right" }}>
            <AddBookingForm
              users={users}
              trips={trips}
              onSave={async (bookingData) => {
                try {
                  // seatsToBook = إجمالي عدد المقاعد المطلوبة (من الفورم)
                  // userIds = قائمة المستخدمين المختارين
                  const totalSeats = bookingData.seatsToBook;

                  // حساب المقاعد لكل مستخدم (بالتساوي)
                  const seatsPerUser = Math.floor(
                    totalSeats / bookingData.userIds.length
                  );

                  // مصفوفة المقاعد لكل مستخدم
                  const userSeats = bookingData.userIds.map((uid, index) => ({
                    userId: uid,
                    seats:
                      seatsPerUser +
                      (index < totalSeats % bookingData.userIds.length ? 1 : 0), // لو فيه باقي
                  }));

                  // إضافة وثيقة الحجز
                  await addDoc(collection(db, "bookings"), {
                    userIds: bookingData.userIds, // للإبقاء على التوافق الخلفي
                    userSeats, // الجديد: توزيع المقاعد
                    tripId: bookingData.tripId,
                    customTrip: false,
                    seatsBooked: totalSeats, // إجمالي المقاعد في هذا الحجز
                    createdAt: new Date(),
                  });

                  // تحديث seatsBooked في الرحلة
                  const tripRef = doc(db, "trips", bookingData.tripId);
                  const trip = trips.find((t) => t.id === bookingData.tripId);
                  const currentSeatsBooked = trip?.seatsBooked || 0;
                  const newSeatsBooked = currentSeatsBooked + totalSeats;

                  await updateDoc(tripRef, { seatsBooked: newSeatsBooked });

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
