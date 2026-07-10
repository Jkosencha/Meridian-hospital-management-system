import React, { useState, useEffect, useMemo, useCallback } from "react";

const ReceptionistDashboard = () => {
  const [patientRecords, setPatientRecords] = useState([
    {
      id: 1,
      name: "John Doe",
      age: 42,
      gender: "Male",
      contact: "555-0123",
      reason: "General check-up",
    },
    {
      id: 2,
      name: "Amina Hassan",
      age: 29,
      gender: "Female",
      contact: "555-0456",
      reason: "Prescription refill",
    },
  ]);

  const [appointmentBookings, setAppointmentBookings] = useState([
    {
      id: 1,
      patientName: "John Doe",
      doctor: "Dr. Kamau",
      date: "2026-07-15",
      time: "10:30",
      status: "Confirmed",
    },
    {
      id: 2,
      patientName: "Amina Hassan",
      doctor: "Dr. Mwangi",
      date: "2026-07-16",
      time: "14:00",
      status: "Pending",
    },
  ]);

  const [newPatient, setNewPatient] = useState({
    name: "",
    age: "",
    gender: "",
    contact: "",
    reason: "",
  });
  const [patientEditId, setPatientEditId] = useState(null);

  const [newAppointment, setNewAppointment] = useState({
    patientName: "",
    doctor: "",
    date: "",
    time: "",
    status: "Pending",
  });
  const [appointmentEditId, setAppointmentEditId] = useState(null);

  useEffect(() => {
    document.title = "Receptionist Dashboard";
  }, []);

  const totalPatients = useMemo(() => patientRecords.length, [patientRecords]);
  const upcomingAppointments = useMemo(
    () => appointmentBookings.filter((booking) => booking.status !== "Cancelled"),
    [appointmentBookings]
  );

  const handlePatientChange = useCallback((event) => {
    const { name, value } = event.target;
    setNewPatient((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleAppointmentChange = useCallback((event) => {
    const { name, value } = event.target;
    setNewAppointment((prev) => ({ ...prev, [name]: value }));
  }, []);

  const savePatientRecord = useCallback(
    (event) => {
      event.preventDefault();
      if (!newPatient.name || !newPatient.contact) {
        return;
      }

      if (patientEditId) {
        setPatientRecords((prev) =>
          prev.map((patient) =>
            patient.id === patientEditId
              ? {
                  ...patient,
                  name: newPatient.name.trim(),
                  age: Number(newPatient.age) || "N/A",
                  gender: newPatient.gender || "Unspecified",
                  contact: newPatient.contact.trim(),
                  reason: newPatient.reason.trim() || "General inquiry",
                }
              : patient
          )
        );
        setPatientEditId(null);
      } else {
        setPatientRecords((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            name: newPatient.name.trim(),
            age: Number(newPatient.age) || "N/A",
            gender: newPatient.gender || "Unspecified",
            contact: newPatient.contact.trim(),
            reason: newPatient.reason.trim() || "General inquiry",
          },
        ]);
      }

      setNewPatient({ name: "", age: "", gender: "", contact: "", reason: "" });
    },
    [newPatient, patientEditId]
  );

  const saveAppointmentBooking = useCallback(
    (event) => {
      event.preventDefault();
      if (!newAppointment.patientName || !newAppointment.doctor || !newAppointment.date) {
        return;
      }

      if (appointmentEditId) {
        setAppointmentBookings((prev) =>
          prev.map((booking) =>
            booking.id === appointmentEditId
              ? {
                  ...booking,
                  patientName: newAppointment.patientName.trim(),
                  doctor: newAppointment.doctor.trim(),
                  date: newAppointment.date,
                  time: newAppointment.time || "09:00",
                  status: newAppointment.status,
                }
              : booking
          )
        );
        setAppointmentEditId(null);
      } else {
        setAppointmentBookings((prev) => [
          ...prev,
          {
            id: prev.length + 1,
            patientName: newAppointment.patientName.trim(),
            doctor: newAppointment.doctor.trim(),
            date: newAppointment.date,
            time: newAppointment.time || "09:00",
            status: newAppointment.status,
          },
        ]);
      }

      setNewAppointment({ patientName: "", doctor: "", date: "", time: "", status: "Pending" });
    },
    [newAppointment, appointmentEditId]
  );

  const editPatientRecord = useCallback((patient) => {
    setNewPatient({
      name: patient.name,
      age: patient.age === "N/A" ? "" : patient.age,
      gender: patient.gender === "Unspecified" ? "" : patient.gender,
      contact: patient.contact,
      reason: patient.reason,
    });
    setPatientEditId(patient.id);
  }, []);

  const deletePatientRecord = useCallback((id) => {
    setPatientRecords((prev) => prev.filter((patient) => patient.id !== id));
    if (patientEditId === id) {
      setPatientEditId(null);
      setNewPatient({ name: "", age: "", gender: "", contact: "", reason: "" });
    }
  }, [patientEditId]);

  const editAppointmentBooking = useCallback((booking) => {
    setNewAppointment({
      patientName: booking.patientName,
      doctor: booking.doctor,
      date: booking.date,
      time: booking.time,
      status: booking.status,
    });
    setAppointmentEditId(booking.id);
  }, []);

  const deleteAppointmentBooking = useCallback((id) => {
    setAppointmentBookings((prev) => prev.filter((booking) => booking.id !== id));
    if (appointmentEditId === id) {
      setAppointmentEditId(null);
      setNewAppointment({ patientName: "", doctor: "", date: "", time: "", status: "Pending" });
    }
  }, [appointmentEditId]);

  const tableStyles = {
    width: "100%",
    borderCollapse: "collapse",
    marginTop: "12px",
  };

  const headerCellStyles = {
    borderBottom: "2px solid #ccc",
    textAlign: "left",
    padding: "10px 8px",
    background: "#f4f6fb",
  };

  const cellStyles = {
    borderBottom: "1px solid #e3e6ef",
    padding: "10px 8px",
  };

  const sectionStyles = {
    marginBottom: "32px",
    padding: "20px",
    background: "#fff",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
  };

  const formRowStyles = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "12px",
    marginTop: "12px",
  };

  const inputStyles = {
    padding: "10px 12px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    width: "100%",
    fontSize: "0.95rem",
  };

  const buttonStyles = {
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    marginTop: "14px",
  };

  return (
    <div style={{ padding: "24px", minHeight: "100vh", background: "#f0f4ff" }}>
      <header style={{ marginBottom: "24px" }}>
        <h1 style={{ margin: 0, fontSize: "2rem", color: "#111827" }}>Receptionist Dashboard</h1>
        <p style={{ marginTop: "8px", color: "#4b5563" }}>
          Manage patient records and appointment bookings in one place.
        </p>
      </header>

      <div style={{ display: "grid", gap: "20px", marginBottom: "24px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        <div style={{ ...sectionStyles }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#111827" }}>Total Patients</h2>
          <p style={{ fontSize: "2rem", margin: "12px 0 0", color: "#2563eb" }}>{totalPatients}</p>
        </div>
        <div style={{ ...sectionStyles }}>
          <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#111827" }}>Upcoming Appointments</h2>
          <p style={{ fontSize: "2rem", margin: "12px 0 0", color: "#2563eb" }}>{upcomingAppointments.length}</p>
        </div>
      </div>

      <div style={{ display: "grid", gap: "24px" }}>
        <section style={sectionStyles}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#111827" }}>Patient Records</h2>
              <p style={{ margin: "8px 0 0", color: "#4b5563" }}>
                Add and review patient information.
              </p>
            </div>
          </div>

          <form onSubmit={savePatientRecord} style={formRowStyles}>
            <input
              name="name"
              placeholder="Patient name"
              value={newPatient.name}
              onChange={handlePatientChange}
              style={inputStyles}
            />
            <input
              name="age"
              type="number"
              placeholder="Age"
              value={newPatient.age}
              onChange={handlePatientChange}
              style={inputStyles}
            />
            <select name="gender" value={newPatient.gender} onChange={handlePatientChange} style={inputStyles}>
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input
              name="contact"
              placeholder="Contact number"
              value={newPatient.contact}
              onChange={handlePatientChange}
              style={inputStyles}
            />
            <input
              name="reason"
              placeholder="Visit reason"
              value={newPatient.reason}
              onChange={handlePatientChange}
              style={inputStyles}
            />
            <button type="submit" style={buttonStyles}>
              {patientEditId ? "Save Patient" : "Add Patient"}
            </button>
          </form>

          <table style={tableStyles}>
            <thead>
              <tr>
                <th style={headerCellStyles}>ID</th>
                <th style={headerCellStyles}>Name</th>
                <th style={headerCellStyles}>Age</th>
                <th style={headerCellStyles}>Gender</th>
                <th style={headerCellStyles}>Contact</th>
                <th style={headerCellStyles}>Reason</th>
                <th style={headerCellStyles}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patientRecords.map((patient) => (
                <tr key={patient.id}>
                  <td style={cellStyles}>{patient.id}</td>
                  <td style={cellStyles}>{patient.name}</td>
                  <td style={cellStyles}>{patient.age}</td>
                  <td style={cellStyles}>{patient.gender}</td>
                  <td style={cellStyles}>{patient.contact}</td>
                  <td style={cellStyles}>{patient.reason}</td>
                  <td style={cellStyles}>
                    <button type="button" onClick={() => editPatientRecord(patient)} style={{ ...buttonStyles, background: "#0f766e", marginRight: "8px" }}>
                      Edit
                    </button>
                    <button type="button" onClick={() => deletePatientRecord(patient.id)} style={{ ...buttonStyles, background: "#ef4444" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section style={sectionStyles}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.25rem", color: "#111827" }}>Appointment Bookings</h2>
              <p style={{ margin: "8px 0 0", color: "#4b5563" }}>
                Schedule and view upcoming appointments.
              </p>
            </div>
          </div>

          <form onSubmit={saveAppointmentBooking} style={formRowStyles}>
            <input
              name="patientName"
              placeholder="Patient name"
              value={newAppointment.patientName}
              onChange={handleAppointmentChange}
              style={inputStyles}
            />
            <input
              name="doctor"
              placeholder="Doctor name"
              value={newAppointment.doctor}
              onChange={handleAppointmentChange}
              style={inputStyles}
            />
            <input
              name="date"
              type="date"
              value={newAppointment.date}
              onChange={handleAppointmentChange}
              style={inputStyles}
            />
            <input
              name="time"
              type="time"
              value={newAppointment.time}
              onChange={handleAppointmentChange}
              style={inputStyles}
            />
            <select name="status" value={newAppointment.status} onChange={handleAppointmentChange} style={inputStyles}>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
            <button type="submit" style={buttonStyles}>
              {appointmentEditId ? "Save Appointment" : "Book Appointment"}
            </button>
          </form>

          <table style={tableStyles}>
            <thead>
              <tr>
                <th style={headerCellStyles}>ID</th>
                <th style={headerCellStyles}>Patient</th>
                <th style={headerCellStyles}>Doctor</th>
                <th style={headerCellStyles}>Date</th>
                <th style={headerCellStyles}>Time</th>
                <th style={headerCellStyles}>Status</th>
                <th style={headerCellStyles}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {appointmentBookings.map((booking) => (
                <tr key={booking.id}>
                  <td style={cellStyles}>{booking.id}</td>
                  <td style={cellStyles}>{booking.patientName}</td>
                  <td style={cellStyles}>{booking.doctor}</td>
                  <td style={cellStyles}>{booking.date}</td>
                  <td style={cellStyles}>{booking.time}</td>
                  <td style={cellStyles}>{booking.status}</td>
                  <td style={cellStyles}>
                    <button type="button" onClick={() => editAppointmentBooking(booking)} style={{ ...buttonStyles, background: "#0f766e", marginRight: "8px" }}>
                      Edit
                    </button>
                    <button type="button" onClick={() => deleteAppointmentBooking(booking.id)} style={{ ...buttonStyles, background: "#ef4444" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
};

export default ReceptionistDashboard;
