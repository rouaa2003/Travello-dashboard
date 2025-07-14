import React, { useState, useEffect } from "react";
import { db } from "./firebase";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import "./Trips.css";

function Trips() {
  const [trips, setTrips] = useState([]);
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [places, setPlaces] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [filterCity, setFilterCity] = useState("");
  const [filterDate, setFilterDate] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [editedSeats, setEditedSeats] = useState(0);
  const [editedDate, setEditedDate] = useState("");
  const [editedDuration, setEditedDuration] = useState(1);

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

    const fetchCities = async () => {
      try {
        const snapshot = await getDocs(collection(db, "cities"));
        const cityList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCities(cityList);
      } catch (err) {
        console.error("فشل تحميل المدن:", err);
      }
    };

    fetchTrips();
    fetchCities();
  }, []);

  const formatDate = (timestamp) => {
    try {
      return timestamp?.toDate().toLocaleDateString("ar-SY", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "-";
    }
  };

  const getCityNames = (ids) => {
    if (!Array.isArray(ids)) return "";
    return ids
      .map((id) => cities.find((city) => city.id === id)?.name || id)
      .join(", ");
  };

  const fetchCollectionByIds = async (collectionName, ids) => {
    if (!ids || !ids.length) return [];
    const snapshot = await getDocs(collection(db, collectionName));
    return snapshot.docs
      .filter((doc) => ids.includes(doc.id))
      .map((doc) => ({ id: doc.id, ...doc.data() }));
  };

  const openDetails = async (trip) => {
    setSelectedTrip(null);
    const [pl, rs, ho, hs] = await Promise.all([
      fetchCollectionByIds("places", trip.selectedPlaceIds),
      fetchCollectionByIds("restaurants", trip.selectedRestaurantIds),
      fetchCollectionByIds("hotels", trip.selectedHotelIds),
      fetchCollectionByIds("hospitals", trip.selectedHospitalIds),
    ]);
    setPlaces(pl);
    setRestaurants(rs);
    setHotels(ho);
    setHospitals(hs);
    setSelectedTrip(trip);
    setEditMode(false);
  };

  const handleDelete = async (tripId) => {
    if (window.confirm("هل أنت متأكد من حذف هذه الرحلة؟")) {
      try {
        await deleteDoc(doc(db, "trips", tripId));
        setTrips((prev) => prev.filter((t) => t.id !== tripId));
        setMessage("تم حذف الرحلة بنجاح.");
      } catch (err) {
        console.error("فشل في حذف الرحلة:", err);
        setError("فشل في حذف الرحلة.");
      }
    }
  };

  const handleEdit = (trip) => {
    setEditedSeats(trip.maxSeats);
    setEditedDate(trip.tripDate?.toDate().toISOString().split("T")[0] || "");
    setEditedDuration(trip.tripDuration);
    setSelectedTrip(trip);
    setEditMode(true);
  };

  const saveEdit = async () => {
    try {
      await updateDoc(doc(db, "trips", selectedTrip.id), {
        maxSeats: editedSeats,
        tripDate: Timestamp.fromDate(new Date(editedDate)),
        tripDuration: editedDuration,
      });
      setTrips((prev) =>
        prev.map((t) =>
          t.id === selectedTrip.id
            ? {
                ...t,
                maxSeats: editedSeats,
                tripDate: Timestamp.fromDate(new Date(editedDate)),
                tripDuration: editedDuration,
              }
            : t
        )
      );
      setMessage("تم تعديل الرحلة بنجاح.");
      setSelectedTrip(null);
      setEditMode(false);
    } catch (err) {
      console.error("فشل تعديل الرحلة:", err);
      setError("فشل تعديل الرحلة.");
    }
  };

  const filteredTrips = trips.filter((trip) => {
    const matchesCity =
      !filterCity || trip.selectedCityIds?.includes(filterCity);
    const matchesDate =
      !filterDate ||
      (trip.tripDate &&
        trip.tripDate.toDate().toISOString().split("T")[0] === filterDate);
    return matchesCity && matchesDate;
  });

  return (
    <div className="trips-page">
      <h1 className="hhh">إدارة الرحلات</h1>

      {message && <p className="success-msg">{message}</p>}
      {error && <p className="error-msg">{error}</p>}

      <div className="filters">
        <select
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
        >
          <option value="">كل المدن</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>

      <table>
        <thead>
          <tr>
            <th>المدن</th>
            <th>تاريخ الرحلة</th>
            <th>المدة</th>
            <th>المقاعد الكلية</th>
            <th>المقاعد المتاحة</th>
            <th>تاريخ الإضافة</th>
            <th>الخيارات</th>
          </tr>
        </thead>
        <tbody>
          {filteredTrips.map((trip) => (
            <tr key={trip.id}>
              <td>{getCityNames(trip.selectedCityIds)}</td>
              <td>{formatDate(trip.tripDate)}</td>
              <td>{trip.tripDuration} يوم</td>
              <td>{trip.maxSeats}</td>
              <td>{trip.availableSeats ?? trip.maxSeats}</td>
              <td>{formatDate(trip.createdAt)}</td>
              <td>
                <button className="show-btn" onClick={() => openDetails(trip)}>
                  📄عرض التفاصيل
                </button>
                <button className="edit-btn-l" onClick={() => handleEdit(trip)}>
                  ✏️ تعديل
                </button>
                <button
                  className="delete-btn-l"
                  onClick={() => handleDelete(trip.id)}
                >
                  🗑 حذف
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editMode && selectedTrip && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>✏️ تعديل معلومات الرحلة</h3>

            <label>📅 تاريخ الرحلة:</label>
            <input
              type="date"
              value={editedDate}
              onChange={(e) => setEditedDate(e.target.value)}
            />

            <label>⏳ المدة (بالأيام):</label>
            <input
              type="number"
              min="1"
              value={editedDuration}
              onChange={(e) => setEditedDuration(Number(e.target.value))}
            />

            <label>🪑 عدد المقاعد:</label>
            <input
              type="number"
              min="1"
              value={editedSeats}
              onChange={(e) => setEditedSeats(Number(e.target.value))}
            />

            <div className="modal-actions">
              <button className="save-btn" onClick={saveEdit}>
                💾 حفظ التعديل
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setEditMode(false);
                  setSelectedTrip(null);
                }}
              >
                ❌ إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTrip && !editMode && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>تفاصيل الرحلة</h2>
            <p>
              <strong>المدن:</strong>{" "}
              {getCityNames(selectedTrip.selectedCityIds)}
            </p>
            <p>
              <strong>التاريخ:</strong> {formatDate(selectedTrip.tripDate)}
            </p>
            <p>
              <strong>المدة:</strong> {selectedTrip.tripDuration} يوم
            </p>
            <p>
              <strong>المقاعد الكلية:</strong> {selectedTrip.maxSeats}
            </p>
            <p>
              <strong>المقاعد المتاحة:</strong>{" "}
              {selectedTrip.availableSeats ?? selectedTrip.maxSeats}
            </p>

            <hr />
            <p>
              <strong>الأماكن السياحية:</strong>{" "}
              {places.map((p) => p.name).join(", ") || "لا يوجد"}
            </p>
            <p>
              <strong>المطاعم:</strong>{" "}
              {restaurants.map((r) => r.name).join(", ") || "لا يوجد"}
            </p>
            <p>
              <strong>الفنادق:</strong>{" "}
              {hotels.map((h) => h.name).join(", ") || "لا يوجد"}
            </p>
            <p>
              <strong>المستشفيات:</strong>{" "}
              {hospitals.map((h) => h.name).join(", ") || "لا يوجد"}
            </p>

            <button onClick={() => setSelectedTrip(null)}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Trips;
