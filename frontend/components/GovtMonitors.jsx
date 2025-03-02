import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function GovtMonitors() {
  const [govMonData, setGovMonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [newGovMon, setNewGovMon] = useState({
    id: null,
    name: "",
    type: "",
    contact: "",
    website: ""
  });

  useEffect(() => {
    fetchGovMonData();
  }, []);

  const fetchGovMonData = () => {
    fetch("http://localhost:5000/fetch_government_monitors")
      .then((res) => res.json())
      .then((data) => {
        setGovMonData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching government monitors data:", error);
        setLoading(false);
        toast.error("Error fetching government monitors data");
      });
  };

  const openModal = (isEdit = false, data = null) => {
    setIsEditMode(isEdit);
    if (isEdit && data) {
      setNewGovMon({
        id: data.id,
        name: data.name,
        type: data.type,
        // Convert the contact array into a comma-separated string for editing
        contact: Array.isArray(data.contact) ? data.contact.join(", ") : data.contact,
        website: data.website
      });
    } else {
      setNewGovMon({
        id: null,
        name: "",
        type: "",
        contact: "",
        website: ""
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewGovMon((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate all fields are filled
    if (
      !newGovMon.name ||
      !newGovMon.type ||
      !newGovMon.contact ||
      !newGovMon.website
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    // Convert the contact string to an array (assuming comma-separated values)
    const payload = {
      ...newGovMon,
      contact: newGovMon.contact.split(",").map((item) => item.trim())
    };

    const endpoint = isEditMode
      ? `http://localhost:5000/update_government_monitor/${newGovMon.id}`
      : "http://localhost:5000/add_government_monitor";
    const method = isEditMode ? "PUT" : "POST";

    fetch(endpoint, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => {
        if (isEditMode) {
          setGovMonData(
            govMonData.map((item) => (item.id === newGovMon.id ? data.data : item))
          );
          toast.success("Government monitor updated successfully!");
        } else {
          setGovMonData([...govMonData, data.data]);
          toast.success("Government monitor added successfully!");
        }
        closeModal();
      })
      .catch((error) => {
        console.error("Error submitting government monitor data:", error);
        toast.error("Error submitting government monitor data");
      });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this government monitor?")) {
      fetch(`http://localhost:5000/delete_government_monitor/${id}`, {
        method: "DELETE"
      })
        .then((res) => res.json())
        .then(() => {
          setGovMonData(govMonData.filter((item) => item.id !== id));
          toast.success("Government monitor deleted successfully!");
        })
        .catch((error) => {
          console.error("Error deleting government monitor:", error);
          toast.error("Error deleting government monitor");
        });
    }
  };

  // Filter data based on search query (by monitor name)
  const filteredData = govMonData.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">
            Government Monitors Data
          </span>
        </div>
        <button
          className="py-2 px-4 bg-black font-medium text-sm text-white rounded-lg"
          onClick={() => openModal(false)}
        >
          Add Data
        </button>
      </div>

      {/* Search bar */}
      <div className="mt-4 mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input 
            type="text" 
            className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="relative overflow-x-auto sm:rounded-lg">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500">
            <thead className="text-base text-gray-700 bg-gray-50 border-b">
              <tr>
                <th scope="col" className="px-6 py-3">
                  ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Type
                </th>
                <th scope="col" className="px-6 py-3">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3">
                  Website
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No data found.
                  </td>
                </tr>
              ) : (
                filteredData.map((data) => (
                  <tr key={data.id} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4">{data.id}</td>
                    <td className="px-6 py-4">{data.name}</td>
                    <td className="px-6 py-4">{data.type}</td>
                    <td className="px-6 py-4">
                      {Array.isArray(data.contact)
                        ? data.contact.join(", ")
                        : data.contact}
                    </td>
                    <td className="px-6 py-4">{data.website}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(true, data)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(data.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {isEditMode ? "Edit Government Monitor" : "Add Government Monitor"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={newGovMon.name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                    id="type"
                    name="type"
                    value={newGovMon.type}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select</option>
                    <option value="national">National</option>
                    <option value="state">State</option>
                    <option value="district">District</option>
                  </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact 
                </label>
                <input
                  type="text"
                  name="contact"
                  value={newGovMon.contact}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="text"
                  name="website"
                  value={newGovMon.website}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  {isEditMode ? "Update" : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Toaster />
    </div>
  );
}
