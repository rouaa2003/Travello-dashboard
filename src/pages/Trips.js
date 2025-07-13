import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import "./Trips.css";
function Trips() {
  const [trips, setTrips] = useState([]);
  const [newTrip, setNewTrip] = useState({
    province: "",
    date: "",
    price: "",
    maxSeats: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [editedTrip, setEditedTrip] = useState({
    province: "",
    date: "",
    price: "",
    maxSeats: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const tripsCollection = collection(db, "trips");

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      try {
        const snapshot = await getDocs(tripsCollection);
        const tripsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTrips(tripsData);
      } catch (err) {
        console.error("فشل جلب الرحلات:", err);
        setError("فشل جلب بيانات الرحلات.");
      }
      setLoading(false);
    };
    fetchTrips();
  }, []);

  const handleChange = (e) => {
    setNewTrip({ ...newTrip, [e.target.name]: e.target.value });
  };

  const handleEditChange = (e) => {
    setEditedTrip({ ...editedTrip, [e.target.name]: e.target.value });
  };

  const validateTrip = (trip) => {
    if (!trip.province || !trip.date || !trip.price || !trip.maxSeats) {
      setError("جميع الحقول مطلوبة.");
      return false;
    }
    if (Number(trip.price) <= 0 || Number(trip.maxSeats) <= 0) {
      setError("السعر وعدد المقاعد يجب أن يكون أكبر من صفر.");
      return false;
    }
    if (new Date(trip.date) < new Date().setHours(0, 0, 0, 0)) {
      setError("يجب أن يكون تاريخ الرحلة في المستقبل.");
      return false;
    }
    return true;
  };

  const addTrip = async () => {
    setMessage("");
    setError("");
    if (!validateTrip(newTrip)) return;

    setLoading(true);
    try {
      const docRef = await addDoc(tripsCollection, {
        ...newTrip,
        price: Number(newTrip.price),
        maxSeats: Number(newTrip.maxSeats),
        availableSeats: Number(newTrip.maxSeats),
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
      setNewTrip({ province: "", date: "", price: "", maxSeats: "" });
      setShowForm(false);
      setMessage("تم إضافة الرحلة بنجاح.");
    } catch (err) {
      console.error("فشل إضافة الرحلة:", err);
      setError("فشل إضافة الرحلة.");
    }
    setLoading(false);
  };

  const deleteTrip = async (id) => {
    const confirmed = window.confirm("هل أنت متأكد من حذف هذه الرحلة؟");
    if (!confirmed) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, "trips", id));
      setTrips(trips.filter((trip) => trip.id !== id));
      setMessage("تم حذف الرحلة.");
    } catch (err) {
      console.error("فشل حذف الرحلة:", err);
      setError("فشل حذف الرحلة.");
    }
    setLoading(false);
  };

  const handleEdit = (trip) => {
    setError("");
    setMessage("");
    setEditingTrip(trip);
    setEditedTrip({
      province: trip.province,
      date: trip.date,
      price: trip.price,
      maxSeats: trip.maxSeats || "",
    });
  };

  const saveChanges = async () => {
    setMessage("");
    setError("");
    if (!validateTrip(editedTrip)) return;

    setLoading(true);
    try {
      const tripRef = doc(db, "trips", editingTrip.id);
      await updateDoc(tripRef, {
        ...editedTrip,
        price: Number(editedTrip.price),
        maxSeats: Number(editedTrip.maxSeats),
      });

      const updatedTrips = trips.map((t) =>
        t.id === editingTrip.id ? { ...t, ...editedTrip } : t
      );
      setTrips(updatedTrips);
      setEditingTrip(null);
      setMessage("تم تحديث الرحلة بنجاح.");
    } catch (err) {
      console.error("فشل تعديل الرحلة:", err);
      setError("فشل تعديل الرحلة.");
    }
    setLoading(false);
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    return d.toLocaleDateString("ar-SY");
  };

  return (
    <div className="trips-page">
      <h1 className="hhh">إدارة الرحلات الجاهزة</h1>

      <button
        className="add-btn"
        onClick={() => {
          setShowForm(!showForm);
          setMessage("");
          setError("");
        }}
        disabled={loading}
      >
        {showForm ? "إغلاق النموذج" : "+ إضافة رحلة"}
      </button>

      {message && <p className="success-msg">{message}</p>}
      {error && <p className="error-msg">{error}</p>}

      {showForm && (
        <div className="form-container">
          <input
            type="text"
            name="province"
            placeholder="الوجهة"
            value={newTrip.province}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            type="date"
            name="date"
            value={newTrip.date}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            type="number"
            min="1"
            name="price"
            placeholder="السعر"
            value={newTrip.price}
            onChange={handleChange}
            disabled={loading}
          />
          <input
            type="number"
            min="1"
            name="maxSeats"
            placeholder="عدد المقاعد"
            value={newTrip.maxSeats}
            onChange={handleChange}
            disabled={loading}
          />

          <button className="add-btn" onClick={addTrip} disabled={loading}>
            {loading ? "جاري الإضافة..." : "إضافة"}
          </button>
        </div>
      )}

      {loading && !showForm && <p>...جاري تحميل البيانات</p>}

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
          {trips.length === 0 && !loading && (
            <tr>
              <td colSpan="8" style={{ textAlign: "center" }}>
                لا توجد رحلات
              </td>
            </tr>
          )}
          {trips.map((trip, index) => (
            <tr key={trip.id}>
              <td>{index + 1}</td>
              <td>{trip.province}</td>
              <td>{formatDate(trip.date)}</td>
              <td>{Number(trip.price).toLocaleString("ar-SY")}</td>
              <td>{trip.maxSeats}</td>
              <td>{trip.availableSeats}</td>
              <td>
                <button
                  className="edit-btn"
                  onClick={() => handleEdit(trip)}
                  disabled={loading}
                >
                  ✏️ تعديل
                </button>
              </td>
              <td>
                <button
                  className="delete-btn"
                  onClick={() => deleteTrip(trip.id)}
                  disabled={loading}
                >
                  🗑 حذف
                </button>
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
              name="province"
              value={editedTrip.province}
              onChange={handleEditChange}
              disabled={loading}
            />
            <input
              type="date"
              name="date"
              value={editedTrip.date}
              onChange={handleEditChange}
              disabled={loading}
            />
            <input
              type="number"
              min="1"
              name="price"
              value={editedTrip.price}
              onChange={handleEditChange}
              disabled={loading}
            />
            <input
              type="number"
              min="1"
              name="maxSeats"
              value={editedTrip.maxSeats}
              onChange={handleEditChange}
              disabled={loading}
            />
            {error && <p className="error-msg">{error}</p>}
            {message && <p className="success-msg">{message}</p>}

            <button onClick={saveChanges} disabled={loading}>
              {loading ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button onClick={() => setEditingTrip(null)} disabled={loading}>
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Trips;
