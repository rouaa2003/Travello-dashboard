import React, { useEffect, useState, useRef } from 'react';
import './Bookings.css';

function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [trips, setTrips] = useState([]);
  const [newBooking, setNewBooking] = useState({ userIds: [], tripId: '' });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editedBooking, setEditedBooking] = useState({ userIds: [], tripId: '' });

  const isInitialMount = useRef(true);

  // جلب البيانات أول مرة فقط
  useEffect(() => {
    const storedBookings = JSON.parse(localStorage.getItem('bookings')) || [];
    const storedUsers = JSON.parse(localStorage.getItem('users')) || [];
    const storedTrips = JSON.parse(localStorage.getItem('trips')) || [];

    setBookings(storedBookings);
    setUsers(storedUsers);
    setTrips(storedTrips);
  }, []);

  // حفظ الحجوزات في localStorage عند كل تغيير (بعد التحميل الأول)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    localStorage.setItem('bookings', JSON.stringify(bookings));
  }, [bookings]);

  const handleUserSelect = (e, isEdit = false) => {
    const selected = Array.from(e.target.selectedOptions).map((opt) => Number(opt.value));
    isEdit
      ? setEditedBooking({ ...editedBooking, userIds: selected })
      : setNewBooking({ ...newBooking, userIds: selected });
  };

  const addBooking = () => {
    if (!newBooking.userIds.length || !newBooking.tripId) return;

    const newEntry = {
      id: Date.now() + Math.random(),
      userIds: newBooking.userIds,
      tripId: Number(newBooking.tripId),
    };

    setBookings((prev) => [...prev, newEntry]);
    setNewBooking({ userIds: [], tripId: '' });
    setShowAddModal(false);
  };

  const deleteBooking = (id) => {
    const updated = bookings.filter((b) => b.id !== id);
    setBookings(updated);
  };

  const handleEdit = (booking) => {
    setEditingBooking(booking);
    setEditedBooking({
      userIds: booking.userIds,
      tripId: booking.tripId,
    });
  };

  const saveChanges = () => {
    if (!editedBooking.userIds.length || !editedBooking.tripId) return;

    const updated = bookings.map((b) =>
      b.id === editingBooking.id
        ? { ...b, userIds: editedBooking.userIds, tripId: Number(editedBooking.tripId) }
        : b
    );
    setBookings(updated);
    setEditingBooking(null);
  };

  return (
    <div className="bookings-page">
      <h1>إدارة الحجوزات</h1>

      <button className="open-add-btn" onClick={() => setShowAddModal(true)}>إضافة حجز</button>

      {/* مودال الإضافة */}
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
                <option key={trip.id} value={trip.id}>{trip.destination} - {trip.date}</option>
              ))}
            </select>

            <div className="modal-buttons">
              <button onClick={addBooking}>حفظ</button>
              <button onClick={() => setShowAddModal(false)}>إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* جدول الحجوزات */}
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
              const bookingUsers = users.filter(u => booking.userIds.includes(u.id));

              return (
                <tr key={booking.id}>
                  <td>{index + 1}</td>
                  <td>{bookingUsers.map((u) => u.name).join('، ')}</td>
                  <td>{trip?.destination || 'غير متوفر'}</td>
                  <td>{trip?.date || 'غير متوفر'}</td>
                  <td>{trip?.price || 'غير متوفر'}</td>
                  <td><button className="edit-btn" onClick={() => handleEdit(booking)}>✏️ تعديل</button></td>
<td><button className="delete-btn" onClick={() => deleteBooking(booking.id)}>🗑 حذف</button></td>

                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* مودال التعديل */}
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
                <option key={trip.id} value={trip.id}>{trip.destination} - {trip.date}</option>
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
