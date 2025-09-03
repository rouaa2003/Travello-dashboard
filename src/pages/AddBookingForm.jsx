import React, { useState } from "react";
import Select from "react-select";
import "./AddBookingForm.css"; // التنسيق محفوظ كما هو

export default function AddBookingForm({
  users,
  trips,
  onSave,
  onCancel,
  getAvailableSeats,
  formatDate,
}) {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [seatsToBook, setSeatsToBook] = useState(1);

  // تحويل المستخدمين إلى صيغة مناسبة لـ react-select
  const userOptions = users.map((user) => ({
    value: user.id,
    label: user.name,
  }));

  const handleSubmit = () => {
    if (!selectedTripId) return alert("يرجى اختيار الرحلة");
    if (selectedUsers.length === 0) return alert("يرجى اختيار المستخدمين");

    const userIds = selectedUsers.map((u) => u.value);
    const trip = trips.find((t) => t.id === selectedTripId);
    const availableSeats = getAvailableSeats(trip);

    if (seatsToBook > availableSeats)
      return alert("عدد المقاعد المطلوب أكبر من المقاعد المتاحة");
    // if (seatsToBook !== userIds.length)
    //   return alert("عدد المقاعد المختارة لا يطابق عدد المستخدمين المختارين");

    onSave({
      userIds,
      tripId: selectedTripId,
      seatsToBook,
    });
  };

  const availableSeats = selectedTripId
    ? getAvailableSeats(trips.find((t) => t.id === selectedTripId))
    : 0;

  return (
    <div style={{ textAlign: "right" }}>
      <h3>إضافة حجز جديد</h3>

      <label>اختر المستخدمين:</label>
      <Select
        options={userOptions}
        isMulti
        value={selectedUsers}
        onChange={(val) => setSelectedUsers(val)}
        placeholder="ابحث واختر المستخدمين"
        styles={{
          control: (base) => ({
            ...base,
            direction: "rtl",
            textAlign: "right",
            borderRadius: "6px",
          }),
          menu: (base) => ({
            ...base,
            direction: "rtl",
            textAlign: "right",
          }),
        }}
      />

      <br />

      <label>اختر الرحلة الجاهزة:</label>
      <select
        value={selectedTripId}
        onChange={(e) => setSelectedTripId(e.target.value)}
        style={{ width: "100%", marginBottom: 10, padding: 8, borderRadius: 6 }}
      >
        <option value="">اختر الرحلة</option>
        {trips.map((trip) => {
          const seats = getAvailableSeats(trip);
          return (
            <option key={trip.id} value={trip.id}>
              {trip.selectedCityIds?.join("، ") || "الوجهة غير محددة"} -{" "}
              {formatDate(trip.tripDate)} - المقاعد: {seats} / {trip.maxSeats}
            </option>
          );
        })}
      </select>

      <label>عدد المقاعد:</label>
      <input
        type="number"
        min={1}
        max={availableSeats}
        value={seatsToBook}
        onChange={(e) => setSeatsToBook(parseInt(e.target.value, 10) || 1)}
      />

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <button className="con-add-btn" onClick={handleSubmit}>
          حفظ
        </button>
        <button className="delete-btn" onClick={onCancel}>
          إلغاء
        </button>
      </div>
    </div>
  );
}
