import React, { useEffect, useState } from 'react';
import './Bookings.css';
import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from 'firebase/firestore';

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [newBooking, setNewBooking] = useState({ userIds: [], tripId: '' });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editedBooking, setEditedBooking] = useState({ userIds: [], tripId: '' });

  const bookingsCollection = collection(db, 'bookings');
  const usersCollection = collection(db, 'users');
  const tripsCollection = collection(db, 'trips');

  useEffect(() => {
    const fetchData = async () => {
      const bookingsSnapshot = await getDocs(bookingsCollection);
      const usersSnapshot = await getDocs(usersCollection);
      const tripsSnapshot = await getDocs(tripsCollection);

      setBookings(bookingsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setTrips(tripsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };

    fetchData();
  }, []);

  const handleUserSelect = (e, isEdit = false) => {
    const selected = Array.from(e.target.selectedOptions).map((opt) => opt.value);
    isEdit
      ? setEditedBooking({ ...editedBooking, userIds: selected })
      : setNewBooking({ ...newBooking, userIds: selected });
  };

  const addBooking = async () => {
    if (!newBooking.userIds.length || !newBooking.tripId) return;

    const trip = trips.find((t) => t.id === newBooking.tripId);
    if (!trip || trip.availableSeats < newBooking.userIds.length) {
      alert('لا يوجد عدد كافٍ من المقاعد!');
      return;
    }

    const bookingDoc = await addDoc(bookingsCollection, {
      userIds: newBooking.userIds,
      tripId: newBooking.tripId,
    });

    await updateDoc(doc(db, 'trips', trip.id), {
      availableSeats: trip.availableSeats - newBooking.userIds.length,
    });

    setBookings([...bookings, { id: bookingDoc.id, ...newBooking }]);
    setNewBooking({ userIds: [], tripId: '' });
    setShowAddModal(false);
  };

  const deleteBooking = async (id) => {
    // حذف الحجز فقط من الواجهة
    setBookings(bookings.filter((b) => b.id !== id));
    // بإمكانك لاحقًا إضافة حذف من Firestore
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setEditedBooking({ userIds: booking.userIds, tripId: booking.tripId });
  };

  const saveChanges = async () => {
    const original = bookings.find((b) => b.id === editingBooking.id);
    const oldTrip = trips.find((t) => t.id === original.tripId);
    const newTrip = trips.find((t) => t.id === editedBooking.tripId);

    const oldCount = original.userIds.length;
    const newCount = editedBooking.userIds.length;
    const seatChange = newCount - oldCount;

    if (newTrip.availableSeats < seatChange) {
      alert('لا يوجد مقاعد كافية للتعديل');
      return;
    }

    // خصم أو إعادة المقاعد
    await updateDoc(doc(db, 'trips', newTrip.id), {
      availableSeats: newTrip.availableSeats - seatChange,
    });

    // تحديث الحجز
    const bookingRef = doc(db, 'bookings', editingBooking.id);
    await updateDoc(bookingRef, {
      userIds: editedBooking.userIds,
      tripId: editedBooking.tripId,
    });

    const updated = bookings.map((b) =>
      b.id === editingBooking.id ? { ...b, ...editedBooking } : b
    );
    setBookings(updated);
    setEditingBooking(null);
  };

  return (
    <div className="bookings-page">
      <h1>إدارة الحجوزات</h1>

      <button className="open-add-btn" onClick={() => setShowAddModal(true)}>إضافة حجز</button>

      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>إضافة حجز جديد</h3>

            <label>اختر المستخدمين:</label>
            <select multiple value={newBooking.userIds} onChange={(e) => handleUserSelect(e)}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>

            <label>اختر الرحلة:</label>
            <select value={newBooking.tripId} onChange={(e) => setNewBooking({ ...newBooking, tripId: e.target.value })}>
              <option value="">اختر الرحلة</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.province} - {trip.date} ({trip.availableSeats} مقاعد متاحة)
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
              const trip = trips.find(t => t.id === booking.tripId);
              const bookingUsers = users.filter(u => Array.isArray(booking.userIds) && booking.userIds.includes(u.id));

              return (
                <tr key={booking.id}>
                  <td>{index + 1}</td>
                  <td>{bookingUsers.map((u) => u.name).join('، ')}</td>
                  <td>{trip?.province || 'غير متوفر'}</td>
                  <td>{trip?.date || 'غير متوفر'}</td>
                  <td>{trip?.price ? `${trip.price} ل.س` : 'غير متوفر'}</td>
                  <td><button className="edit-btn" onClick={() => handleEdit(booking)}>✏️ تعديل</button></td>
                  <td><button className="delete-btn" onClick={() => deleteBooking(booking.id)}>🗑 حذف</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {editingBooking && (
        <div className="edit-modal">
          <div className="modal-content">
            <h3>تعديل الحجز</h3>

            <label>اختر المستخدمين:</label>
            <select multiple value={editedBooking.userIds} onChange={(e) => handleUserSelect(e, true)}>
              {users.map((user) => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>

            <label>اختر الرحلة:</label>
            <select value={editedBooking.tripId} onChange={(e) => setEditedBooking({ ...editedBooking, tripId: e.target.value })}>
              <option value="">اختر الرحلة</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>{trip.province} - {trip.date}</option>
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
