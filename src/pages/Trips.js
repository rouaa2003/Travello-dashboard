import React, { useState, useEffect } from 'react';
import './Trips.css';
import { db } from './firebase';
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from 'firebase/firestore';

function Trips() {
  const [trips, setTrips] = useState([]);
  const [newTrip, setNewTrip] = useState({
  province: '',
  date: '',
  price: '',
  maxSeats: '',
});
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [editedTrip, setEditedTrip] = useState({ province: '', date: '', price: '' });

  const tripsCollection = collection(db, 'trips');

  // جلب البيانات من Firestore
  useEffect(() => {
    const fetchTrips = async () => {
      const snapshot = await getDocs(tripsCollection);
      const tripsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTrips(tripsData);
    };

    fetchTrips();
  }, []);

  const handleChange = (e) => {
    setNewTrip({ ...newTrip, [e.target.name]: e.target.value });
  };

  const addTrip = async () => {
    if (!newTrip.province || !newTrip.date || !newTrip.price) return;

   const docRef = await addDoc(tripsCollection, {
  ...newTrip,
  price: Number(newTrip.price),
  maxSeats: Number(newTrip.maxSeats),
  availableSeats: Number(newTrip.maxSeats), // بالبداية نفس العدد الكامل
  createdAt: serverTimestamp(),
});


  setTrips([
  ...trips,
  {
    id: docRef.id,
    ...newTrip,
    price: Number(newTrip.price),
    maxSeats: Number(newTrip.maxSeats),
    availableSeats: Number(newTrip.maxSeats),
  },
]);

    setNewTrip({ province: '', date: '', price: '' });
    setShowForm(false);
  };

  const deleteTrip = async (id) => {
    await deleteDoc(doc(db, 'trips', id));
    setTrips(trips.filter((trip) => trip.id !== id));
  };

  const handleEdit = (trip) => {
    setEditingTrip(trip);
    setEditedTrip({
      province: trip.province,
      date: trip.date,
      price: trip.price,
    });
  };

  const saveChanges = async () => {
    const tripRef = doc(db, 'trips', editingTrip.id);
    await updateDoc(tripRef, {
      ...editedTrip,
      price: Number(editedTrip.price),
    });

    const updatedTrips = trips.map((t) =>
      t.id === editingTrip.id ? { ...t, ...editedTrip } : t
    );
    setTrips(updatedTrips);
    setEditingTrip(null);
  };

  return (
    <div className="trips-page">
      <h1>إدارة الرحلات</h1>

      <button className="add-btn" onClick={() => setShowForm(!showForm)}>
        {showForm ? 'إغلاق النموذج' : '+ إضافة رحلة'}
      </button>

      {showForm && (
        <div className="form-container">
          <input
            type="text"
            name="province"
            placeholder="الوجهة"
            value={newTrip.province}
            onChange={handleChange}
          />
          <input
            type="date"
            name="date"
            value={newTrip.date}
            onChange={handleChange}
          />
          <input
            type="number"
            name="price"
            placeholder="السعر"
            value={newTrip.price}
            onChange={handleChange}
          />
          <input
            type="number"
            name="maxSeats"
            placeholder="عدد المقاعد"
            value={newTrip.maxSeats}
            onChange={handleChange}
          />

          <button onClick={addTrip}>إضافة</button>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>الرقم</th>
            <th>الوجهة</th>
            <th>تاريخ الرحلة</th>
            <th>السعر (ل.س)</th>
            <th>العدد الكلي</th>
            <th>المقاعد المتاحة</th>
            <th>تعديل</th>
            <th>حذف</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip, index) => (
            <tr key={trip.id}>
              <td>{index + 1}</td>
              <td>{trip.province}</td>
              <td>{trip.date}</td>
              <td>{Number(trip.price).toLocaleString('ar-SY')}</td>
              <td>{trip.maxSeats}</td>
              <td>{trip.availableSeats}</td>

              <td>
                <button className="edit-btn" onClick={() => handleEdit(trip)}>✏️ تعديل</button>
              </td>
              <td>
                <button className="delete-btn" onClick={() => deleteTrip(trip.id)}>🗑 حذف</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingTrip && (
        <div className="edit-modal">
          <div className="modal-content">
            <h3>تعديل الرحلة</h3>
            <input
              type="text"
              value={editedTrip.province}
              onChange={(e) => setEditedTrip({ ...editedTrip, province: e.target.value })}
            />
            <input
              type="date"
              value={editedTrip.date}
              onChange={(e) => setEditedTrip({ ...editedTrip, date: e.target.value })}
            />
            <input
              type="number"
              value={editedTrip.price}
              onChange={(e) => setEditedTrip({ ...editedTrip, price: e.target.value })}
            />
            <button onClick={saveChanges}>حفظ</button>
            <button onClick={() => setEditingTrip(null)}>إلغاء</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Trips;
