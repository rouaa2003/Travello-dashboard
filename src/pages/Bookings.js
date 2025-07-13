import React, { useEffect, useState } from "react";
import "./Bookings.css";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [customBookings, setCustomBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const [newBooking, setNewBooking] = useState({ userIds: [], tripId: "" });
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editedBooking, setEditedBooking] = useState({
    userIds: [],
    tripId: "",
  });

  const bookingsCollection = collection(db, "bookings");
  const customBookingsCollection = collection(db, "bookings"); // Assuming custom bookings stored in same collection with flag
  const usersCollection = collection(db, "users");
  const tripsCollection = collection(db, "trips");

  // Fetch all needed data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsSnap, usersSnap, tripsSnap] = await Promise.all([
        getDocs(bookingsCollection),
        getDocs(usersCollection),
        getDocs(tripsCollection),
      ]);
      const allBookings = bookingsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const normal = allBookings.filter((b) => !b.customTrip);
      const custom = allBookings.filter((b) => b.customTrip);

      setBookings(normal);
      setCustomBookings(custom);
      setUsers(usersSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setTrips(tripsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Error fetching data:", error);
      alert("حدث خطأ أثناء تحميل البيانات، حاول لاحقاً");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUserSelect = (e, isEdit = false) => {
    const selected = Array.from(e.target.selectedOptions).map(
      (opt) => opt.value
    );
    if (isEdit) {
      setEditedBooking({ ...editedBooking, userIds: selected });
    } else {
      setNewBooking({ ...newBooking, userIds: selected });
    }
  };

  const addBooking = async () => {
    if (!newBooking.userIds.length || !newBooking.tripId)
      return alert("يرجى اختيار المستخدمين والرحلة");

    const trip = trips.find((t) => t.id === newBooking.tripId);
    if (!trip || trip.availableSeats < newBooking.userIds.length) {
      return alert("لا يوجد عدد كافٍ من المقاعد!");
    }

    try {
      const bookingDoc = await addDoc(bookingsCollection, {
        userIds: newBooking.userIds,
        tripId: newBooking.tripId,
        customTrip: false,
        createdAt: new Date(),
      });

      await updateDoc(doc(db, "trips", trip.id), {
        availableSeats: trip.availableSeats - newBooking.userIds.length,
      });

      setNewBooking({ userIds: [], tripId: "" });
      setShowAddModal(false);
      await fetchData(); // Refresh data after add
    } catch (error) {
      console.error("Error adding booking:", error);
      alert("حدث خطأ أثناء إضافة الحجز");
    }
  };

  const deleteBooking = async (id, isCustom = false) => {
    if (!window.confirm("هل أنت متأكد من حذف هذا الحجز؟")) return;

    try {
      await deleteDoc(doc(db, "bookings", id));

      if (!isCustom) {
        // لو حجز عادي نقص المقاعد حسب عدد المستخدمين في الحجز
        const deletedBooking = bookings.find((b) => b.id === id);
        if (deletedBooking) {
          const trip = trips.find((t) => t.id === deletedBooking.tripId);
          if (trip) {
            await updateDoc(doc(db, "trips", trip.id), {
              availableSeats:
                trip.availableSeats + deletedBooking.userIds.length,
            });
          }
        }
      }

      await fetchData(); // Refresh data after delete
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("حدث خطأ أثناء حذف الحجز");
    }
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setEditedBooking({
      userIds: booking.userIds || [],
      tripId: booking.tripId || "",
    });
  };

  const saveChanges = async () => {
    if (!editedBooking.userIds.length || !editedBooking.tripId) {
      return alert("يرجى اختيار المستخدمين والرحلة");
    }

    const original = bookings.find((b) => b.id === editingBooking.id);
    if (!original) return alert("الحجز الأصلي غير موجود");

    const oldTrip = trips.find((t) => t.id === original.tripId);
    const newTrip = trips.find((t) => t.id === editedBooking.tripId);

    if (!oldTrip || !newTrip) return alert("الرحلة غير موجودة");

    const oldCount = original.userIds.length;
    const newCount = editedBooking.userIds.length;
    const seatChange = newCount - oldCount;

    if (seatChange > newTrip.availableSeats) {
      return alert("لا يوجد مقاعد كافية للتعديل");
    }

    try {
      // تحديث المقاعد في الرحلات
      if (oldTrip.id !== newTrip.id) {
        // إعادة المقاعد في الرحلة القديمة
        await updateDoc(doc(db, "trips", oldTrip.id), {
          availableSeats: oldTrip.availableSeats + oldCount,
        });
        // خصم المقاعد في الرحلة الجديدة
        await updateDoc(doc(db, "trips", newTrip.id), {
          availableSeats: newTrip.availableSeats - newCount,
        });
      } else {
        // نفس الرحلة فقط تحديث المقاعد بناءً على الفرق
        await updateDoc(doc(db, "trips", newTrip.id), {
          availableSeats: newTrip.availableSeats - seatChange,
        });
      }

      // تحديث بيانات الحجز
      await updateDoc(doc(db, "bookings", editingBooking.id), {
        userIds: editedBooking.userIds,
        tripId: editedBooking.tripId,
      });

      setEditingBooking(null);
      await fetchData(); // Refresh data after update
    } catch (error) {
      console.error("Error updating booking:", error);
      alert("حدث خطأ أثناء حفظ التعديلات");
    }
  };

  // دالة مساعدة لتنسيق التاريخ بأمان
  const formatDate = (dateVal) => {
    if (!dateVal) return "غير متوفر";
    try {
      const dateObj = dateVal.toDate ? dateVal.toDate() : new Date(dateVal);
      return dateObj.toLocaleDateString("ar-EG");
    } catch {
      return "غير متوفر";
    }
  };

  if (loading) {
    return <div className="loading-indicator">جاري تحميل البيانات...</div>;
  }

  return (
    <div className="bookings-page">
      <h1>إدارة الحجوزات</h1>

      <button className="open-add-btn" onClick={() => setShowAddModal(true)}>
        إضافة حجز
      </button>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>إضافة حجز جديد</h3>

            <label>اختر المستخدمين:</label>
            <select
              multiple
              value={newBooking.userIds}
              onChange={(e) => handleUserSelect(e)}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>

            <label>اختر الرحلة:</label>
            <select
              value={newBooking.tripId}
              onChange={(e) =>
                setNewBooking({ ...newBooking, tripId: e.target.value })
              }
            >
              <option value="">اختر الرحلة</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.province} - {formatDate(trip.date)} (
                  {trip.availableSeats} مقاعد متاحة)
                </option>
              ))}
            </select>

            <div className="modal-buttons">
              <button onClick={addBooking}>حفظ</button>
              <button onClick={() => setShowAddModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* جدول الحجوزات العادية */}
      {bookings.length === 0 ? (
        <p>لا توجد حجوزات حالياً.</p>
      ) : (
        <table className="bookings-table">
          <thead>
            <tr>
              <th>رقم</th>
              <th>المستخدمون</th>
              <th>الوجهة</th>
              <th>التاريخ</th>
              <th>السعر</th>
              <th>تعديل</th>
              <th>حذف</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((booking, index) => {
              const trip = trips.find((t) => t.id === booking.tripId);
              const bookingUsers = users.filter(
                (u) =>
                  Array.isArray(booking.userIds) &&
                  booking.userIds.includes(u.id)
              );
              return (
                <tr key={booking.id}>
                  <td>{index + 1}</td>
                  <td>{bookingUsers.map((u) => u.name).join("، ")}</td>
                  <td>{trip?.province || "غير متوفر"}</td>
                  <td>{formatDate(trip?.date)}</td>
                  <td>{trip?.price ? `${trip.price} ل.س` : "غير متوفر"}</td>
                  <td>
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(booking)}
                    >
                      ✏️ تعديل
                    </button>
                  </td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => deleteBooking(booking.id, false)}
                    >
                      🗑 حذف
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* جدول الحجوزات المخصصة */}
      <h2>الحجوزات المخصصة</h2>
      {customBookings.length === 0 ? (
        <p>لا توجد حجوزات مخصصة حالياً.</p>
      ) : (
        <table className="bookings-table">
          <thead>
            <tr>
              <th>رقم</th>
              <th>المستخدمون</th>
              <th>المدن المختارة</th>
              <th>عدد الأيام</th>
              <th>تاريخ البداية</th>
              <th>تاريخ الإنشاء</th>
              <th>حذف</th>
            </tr>
          </thead>
          <tbody>
            {customBookings.map((booking, index) => {
              const bookingUsers = users.filter(
                (u) =>
                  Array.isArray(booking.userIds) &&
                  booking.userIds.includes(u.id)
              );
              return (
                <tr key={booking.id}>
                  <td>{index + 1}</td>
                  <td>
                    {bookingUsers.map((u) => u.name).join("، ") || "غير معروف"}
                  </td>
                  <td>
                    {Array.isArray(booking.selectedCityIds)
                      ? booking.selectedCityIds.join("، ")
                      : ""}
                  </td>
                  <td>{booking.tripDuration || "غير معروف"} أيام</td>
                  <td>{formatDate(booking.tripDate)}</td>
                  <td>{formatDate(booking.createdAt)}</td>
                  <td>
                    <button
                      className="delete-btn"
                      onClick={() => deleteBooking(booking.id, true)}
                    >
                      🗑 حذف
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* تعديل الحجز */}
      {editingBooking && (
        <div className="edit-modal">
          <div className="modal-content">
            <h3>تعديل الحجز</h3>

            <label>اختر المستخدمين:</label>
            <select
              multiple
              value={editedBooking.userIds}
              onChange={(e) => handleUserSelect(e, true)}
            >
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>

            <label>اختر الرحلة:</label>
            <select
              value={editedBooking.tripId}
              onChange={(e) =>
                setEditedBooking({ ...editedBooking, tripId: e.target.value })
              }
            >
              <option value="">اختر الرحلة</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.province} - {formatDate(trip.date)}
                </option>
              ))}
            </select>

            <div className="modal-buttons">
              <button onClick={saveChanges}>حفظ</button>
              <button onClick={() => setEditingBooking(null)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Bookings;
