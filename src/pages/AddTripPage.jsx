import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
  addDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import MultiSelectDropdown from "./MultiSelectDropdown";
import "./AddTripPage.css";

const AddTripPage = () => {
  const [cities, setCities] = useState([]);
  const [selectedCities, setSelectedCities] = useState([]);
  const [places, setPlaces] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [hotels, setHotels] = useState([]);

  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [selectedRestaurants, setSelectedRestaurants] = useState([]);
  const [selectedHospitals, setSelectedHospitals] = useState([]);
  const [selectedHotels, setSelectedHotels] = useState([]);

  const [tripDate, setTripDate] = useState("");
  const [tripDuration, setTripDuration] = useState(1);
  const [maxSeats, setMaxSeats] = useState(1);

  const [step, setStep] = useState(1);
  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    { label: "المدن" },
    { label: "الأماكن السياحية" },
    { label: "المطاعم" },
    { label: "المستشفيات" },
    { label: "الفنادق" },
    { label: "التاريخ والمدة" },
    { label: "المراجعة" },
  ];

  const Card = ({ data, selected, onClick }) => (
    <div
      onClick={onClick}
      className={`custom-card ${selected ? "selected" : ""}`}
    >
      <img
        src={data.imgUrl || "https://via.placeholder.com/300x180"}
        alt={data.name}
      />
      <div className="card-info">
        <h4>{data.name}</h4>
        <p>{data.cityId}</p>
      </div>
      {selected && <div className="checkmark">✔</div>}
    </div>
  );
  const Chip = ({ label, onRemove }) => (
    <div className="chip" onClick={onRemove}>
      {label}
      <span className="close-btn">×</span>
    </div>
  );

  useEffect(() => {
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
    fetchCities();
  }, []);

  useEffect(() => {
    const fetchData = async (colName, setState) => {
      let results = [];
      for (const cityId of selectedCities) {
        const q = query(collection(db, colName), where("cityId", "==", cityId));
        const snap = await getDocs(q);
        results = [
          ...results,
          ...snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        ];
      }
      setState(results);
    };

    if (selectedCities.length > 0) {
      fetchData("places", setPlaces);
      fetchData("restaurants", setRestaurants);
      fetchData("hospitals", setHospitals);
      fetchData("hotels", setHotels);
    }
  }, [selectedCities]);

  const toggleSelection = (id, selectedArray, setSelectedArray) => {
    const newSet = new Set(selectedArray);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedArray(Array.from(newSet)); // هنا تحويل Set لمصفوفة
  };

  const removeSelectedItem = (id, selectedSet, setSelectedSet) => {
    const newSet = new Set(selectedSet);
    newSet.delete(id);
    setSelectedSet(newSet);
  };

  const handleSubmit = async () => {
    if (selectedCities.length === 0)
      return alert("اختر مدينة واحدة على الأقل.");
    if (!tripDate) return alert("اختر تاريخ الرحلة.");
    if (tripDuration < 1) return alert("أدخل مدة صالحة.");
    const today = new Date();
    today.setHours(0, 0, 0, 0); // حتى يقارن بدون وقت

    const selectedDate = new Date(tripDate);
    if (selectedDate < today) {
      return alert("⚠️ لا يمكن تحديد تاريخ في الماضي.");
    }

    const data = {
      selectedCityIds: selectedCities,
      selectedPlaceIds: Array.from(selectedPlaces),
      selectedRestaurantIds: Array.from(selectedRestaurants),
      selectedHospitalIds: Array.from(selectedHospitals),
      selectedHotelIds: Array.from(selectedHotels),
      tripDate: Timestamp.fromDate(new Date(tripDate)),
      tripDuration,
      maxSeats,
      createdAt: Timestamp.now(),
      customTrip: true,
    };

    try {
      await addDoc(collection(db, "trips"), data);
      alert("تم حفظ الرحلة بنجاح!");
      setSelectedCities([]);
      setSelectedPlaces(new Set());
      setSelectedRestaurants(new Set());
      setSelectedHospitals(new Set());
      setSelectedHotels(new Set());
      setTripDate("");
      setTripDuration(1);
      setMaxSeats(1);
      setStep(1);
    } catch (err) {
      alert("حدث خطأ أثناء الحفظ.");
    }
  };

  return (
    <div className="container">
      <>
        <h2 className="title">أضف رحلة </h2>
        {/* شريط التقدم */}
        <div className="my-progress-bar">
          {steps.map((stepItem, index) => (
            <div
              key={index}
              className={`step ${step === index + 1 ? "active" : ""} ${
                step > index + 1 ? "completed" : ""
              }`}
            >
              <div className="circle">{index + 1}</div>
              <div className="label">{stepItem.label}</div>
            </div>
          ))}
        </div>
      </>
      {step === 1 && (
        <>
          <MultiSelectDropdown
            options={cities}
            selectedOptions={selectedCities}
            onChange={setSelectedCities}
          />
          {selectedCities.length > 0 && (
            <div className="selected-chips">
              {selectedCities.map((id) => {
                const city = cities.find((c) => c.id === id);
                return (
                  <Chip
                    key={id}
                    label={city?.name}
                    onRemove={() =>
                      setSelectedCities(
                        selectedCities.filter((cId) => cId !== id)
                      )
                    }
                  />
                );
              })}
            </div>
          )}
        </>
      )}

      {step === 2 && (
        <>
          {places.length > 0 && <h3>🗺️ الأماكن السياحية</h3>}
          <div className="cards-container">
            {places.map((place) => (
              <Card
                key={place.id}
                data={place}
                selected={selectedPlaces.includes(place.id)}
                onClick={() =>
                  toggleSelection(place.id, selectedPlaces, setSelectedPlaces)
                }
              />
            ))}
          </div>
          <div className="selected-chips">
            {Array.from(selectedPlaces).map((id) => {
              const item = places.find((p) => p.id === id);
              return (
                <Chip
                  key={id}
                  label={item?.name}
                  onRemove={() =>
                    removeSelectedItem(id, selectedPlaces, setSelectedPlaces)
                  }
                />
              );
            })}
          </div>
        </>
      )}
      {step === 3 && (
        <>
          {restaurants.length > 0 && <h3>🍽️ المطاعم</h3>}
          <div className="cards-container">
            {restaurants.map((rest) => (
              <Card
                key={rest.id}
                data={rest}
                selected={selectedRestaurants.includes(rest.id)}
                onClick={() =>
                  toggleSelection(
                    rest.id,
                    selectedRestaurants,
                    setSelectedRestaurants
                  )
                }
              />
            ))}
          </div>
          <div className="selected-chips">
            {Array.from(selectedRestaurants).map((id) => {
              const item = restaurants.find((r) => r.id === id);
              return (
                <Chip
                  key={id}
                  label={item?.name}
                  onRemove={() =>
                    removeSelectedItem(
                      id,
                      selectedRestaurants,
                      setSelectedRestaurants
                    )
                  }
                />
              );
            })}
          </div>
        </>
      )}
      {step === 4 && (
        <>
          {hospitals.length > 0 && <h3>🏥 المشافي</h3>}
          <div className="cards-container">
            {hospitals.map((hos) => (
              <Card
                key={hos.id}
                data={hos}
                selected={selectedHospitals.includes(hos.id)}
                onClick={() =>
                  toggleSelection(
                    hos.id,
                    selectedHospitals,
                    setSelectedHospitals
                  )
                }
              />
            ))}
          </div>
          <div className="selected-chips">
            {Array.from(selectedHospitals).map((id) => {
              const item = hospitals.find((h) => h.id === id);
              return (
                <Chip
                  key={id}
                  label={item?.name}
                  onRemove={() =>
                    removeSelectedItem(
                      id,
                      selectedHospitals,
                      setSelectedHospitals
                    )
                  }
                />
              );
            })}
          </div>
        </>
      )}
      {step === 5 && (
        <>
          {hotels.length > 0 && <h3>🏨 الفنادق</h3>}
          <div className="cards-container">
            {hotels.map((hotel) => (
              <Card
                key={hotel.id}
                data={hotel}
                selected={selectedHotels.includes(hotel.id)}
                onClick={() =>
                  toggleSelection(hotel.id, selectedHotels, setSelectedHotels)
                }
              />
            ))}
          </div>
          <div className="selected-chips">
            {Array.from(selectedHotels).map((id) => {
              const item = hotels.find((h) => h.id === id);
              return (
                <Chip
                  key={id}
                  label={item?.name}
                  onRemove={() =>
                    removeSelectedItem(id, selectedHotels, setSelectedHotels)
                  }
                />
              );
            })}
          </div>
        </>
      )}

      {step === 6 && (
        <div className="trip-details">
          <label>📅 تاريخ الرحلة:</label>
          <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={tripDate}
            onChange={(e) => setTripDate(e.target.value)}
          />
          <label>⏳ المدة (بالأيام):</label>
          <input
            type="number"
            value={tripDuration}
            min="1"
            onChange={(e) => setTripDuration(parseInt(e.target.value))}
          />
          <label>العدد الأقصى للمقاعد:</label>
          <input
            type="number"
            value={maxSeats}
            min="1"
            onChange={(e) => setMaxSeats(parseInt(e.target.value))}
          />
        </div>
      )}

      {step === 7 && (
        <div>
          <h3>🧾 ملخص رحلتك</h3>
          <ul>
            <li>
              📍 المدن:{" "}
              {selectedCities
                .map((id) => cities.find((c) => c.id === id)?.name)
                .join(", ")}
            </li>

            <li>
              🏛️ الأماكن المختارة:{" "}
              {selectedPlaces
                .map((id) => places.find((p) => p.id === id)?.name)
                .filter(Boolean)
                .join("، ") || "لا يوجد"}
            </li>

            <li>
              🍽️ المطاعم المختارة:{" "}
              {selectedRestaurants
                .map((id) => restaurants.find((r) => r.id === id)?.name)
                .filter(Boolean)
                .join("، ") || "لا يوجد"}
            </li>

            <li>
              🏥 المشافي المختارة:{" "}
              {selectedHospitals
                .map((id) => hospitals.find((h) => h.id === id)?.name)
                .filter(Boolean)
                .join("، ") || "لا يوجد"}
            </li>

            <li>
              🏨 الفنادق المختارة:{" "}
              {selectedHotels
                .map((id) => hotels.find((h) => h.id === id)?.name)
                .filter(Boolean)
                .join("، ") || "لا يوجد"}
            </li>

            <li>📅 التاريخ: {tripDate}</li>
            <li>⏳ المدة: {tripDuration} يوم</li>
            <li>⏳ العدد الأعظمي للمقاعد: {maxSeats} مقعد</li>
          </ul>
          <button className="add-btn" onClick={handleSubmit}>
            💾 حفظ الرحلة
          </button>
        </div>
      )}

      {/* أزرار التنقل بين الخطوات */}
      <div className="step-navigation">
        {step > 1 && (
          <>
            <button
              className="step-button"
              onClick={() => {
                setStep(step - 1);
              }}
            >
              السابق ➡️
            </button>
          </>
        )}
        {step < 7 && (
          <button
            className="step-button"
            onClick={() => {
              setStep(step + 1);
            }}
          >
            ⬅️ التالي
          </button>
        )}
      </div>
    </div>
  );
};

export default AddTripPage;
