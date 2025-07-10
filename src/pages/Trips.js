import React, { useState, useEffect } from 'react';
import './Trips.css';

function Trips() {
  const [trips, setTrips] = useState(() => {
    const stored = localStorage.getItem('trips');
    return stored ? JSON.parse(stored) : [];
  });

  const [newTrip, setNewTrip] = useState({ destination: '', date: '', price: '' });
  const [showForm, setShowForm] = useState(false);

  const [editingTrip, setEditingTrip] = useState(null);
  const [editedTrip, setEditedTrip] = useState({ destination: '', date: '', price: '' });

  useEffect(() => {
    localStorage.setItem('trips', JSON.stringify(trips));
  }, [trips]);

  const handleChange = (e) => {
    setNewTrip({ ...newTrip, [e.target.name]: e.target.value });
  };

  const addTrip = () => {
    if (!newTrip.destination || !newTrip.date || !newTrip.price) return;

    const newId = Date.now();
    setTrips([...trips, { id: newId, ...newTrip }]);
    setNewTrip({ destination: '', date: '', price: '' });
    setShowForm(false);
  };

  const deleteTrip = (id) => {
    setTrips(trips.filter((trip) => trip.id !== id));
  };

  const handleEdit = (trip) => {
    setEditingTrip(trip);
    setEditedTrip({
      destination: trip.destination,
      date: trip.date,
      price: trip.price,
    });
  };

  const saveChanges = () => {
    const updated = trips.map((trip) =>
      trip.id === editingTrip.id ? { ...trip, ...editedTrip } : trip
    );
    setTrips(updated);
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
            name="destination"
            placeholder="المحافظة"
            value={newTrip.destination}
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
          <button onClick={addTrip}>إضافة</button>
        </div>
      )}

      <table>
        <thead>
          <tr>
            <th>id</th>
            <th>المحافظة</th>
            <th>التاريخ</th>
            <th>السعر</th>
            <th>تعديل</th>
            <th>حذف</th>
          </tr>
        </thead>
        <tbody>
          {trips.map((trip) => (
            <tr key={trip.id}>
              <td>{trip.id}</td>
              <td>{trip.destination}</td>
              <td>{trip.date}</td>
              <td>{trip.price}</td>
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
              value={editedTrip.destination}
              onChange={(e) => setEditedTrip({ ...editedTrip, destination: e.target.value })}
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
