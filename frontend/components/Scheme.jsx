import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function Scheme() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [govMonData, setGovMonData] = useState([]);
  const [newScheme, setNewScheme] = useState({
    id: null,
    scheme_name: "",
    scheme_description: "",
    scheme_gov_id: "",
  });

  const role = localStorage.getItem("Role");
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

  useEffect(() => {
    fetch("http://localhost:5000/fetch_schemes")
      .then((res) => res.json())
      .then((data) => {
        setSchemes(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching scheme data:", error);
        setLoading(false);
      });
  }, []);

  const openModal = (isEdit = false, data = null) => {
    setIsEditMode(isEdit);
    if (isEdit && data) {
      setNewScheme({
        id: data.scheme_id,
        scheme_name: data.scheme_name,
        scheme_description: data.scheme_description,
        scheme_gov_id: data.scheme_gov_id,
      });
    } else {
      setNewScheme({
        id: null,
        scheme_name: "",
        scheme_description: "",
        scheme_gov_id: "",
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
    setNewScheme({
      ...newScheme,
      [name]: value,
    });
  };

  const validateForm = () => {
    const { scheme_name, scheme_description, scheme_gov_id } = newScheme;
    if (!scheme_name || !scheme_description || !scheme_gov_id) {
      toast.error("All fields are required!");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const endpoint = isEditMode
      ? `http://localhost:5000/update_scheme/${newScheme.id}`
      : "http://localhost:5000/add_scheme";
    const method = isEditMode ? "PUT" : "POST";

    fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newScheme),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isEditMode) {
          setSchemes(
            schemes.map((item) =>
              item.scheme_id === newScheme.id ? data.data : item
            )
          );
          toast.success("Scheme updated successfully!");
        } else {
          setSchemes([...schemes, data.data]);
          toast.success("Scheme added successfully!");
        }
        closeModal();
      })
      .catch((error) => {
        console.error(
          `Error ${isEditMode ? "updating" : "adding"} scheme:`,
          error
        );
        toast.error(`Error ${isEditMode ? "updating" : "adding"} scheme!`);
      });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this scheme?")) {
      fetch(`http://localhost:5000/delete_scheme/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then(() => {
          setSchemes(schemes.filter((item) => item.scheme_id !== id));
          toast.success("Scheme deleted successfully!");
        })
        .catch((error) => {
          console.error("Error deleting scheme:", error);
          toast.error("Error deleting scheme!");
        });
    }
  };

  const filteredSchemes = schemes.filter((item) =>
    item.scheme_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <span className="text-lg font-semibold text-gray-700">Scheme Data</span>
        {role !== "government_monitor" && (
          <button
            className="py-2 px-4 bg-black font-medium text-sm text-white rounded-lg"
            onClick={() => openModal(false)}
          >
            Add Scheme
          </button>
        )}
      </div>

      {/* Search bar */}
      <div className="mt-4 mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg
              className="w-4 h-4 text-gray-500"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 20 20"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
              />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by scheme name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="mt-4">
        <div className="relative overflow-x-auto sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500">
            <thead className="text-base text-gray-700 bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3">ID</th>
                <th className="px-6 py-3">Scheme Name</th>
                <th className="px-6 py-3">Scheme Description</th>
                <th className="px-6 py-3">Gov. Monitor ID</th>
                <th className="px-6 py-3">Gov. Monitor Name</th>
                {role !== "government_monitor" && (
                  <th className="px-6 py-3">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : filteredSchemes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No data found.
                  </td>
                </tr>
              ) : (
                filteredSchemes.map((scheme) => (
                  <tr
                    key={scheme.scheme_id}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">{scheme.scheme_id}</td>
                    <td className="px-6 py-4">{scheme.scheme_name}</td>
                    <td className="px-6 py-4">{scheme.scheme_description}</td>
                    <td className="px-6 py-4">
                      {scheme.government_monitor_id}
                    </td>
                    <td className="px-6 py-4">
                      {scheme.government_monitor_name}
                    </td>
                    {role != "government_monitor" && (
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(true, scheme)}
                            className="font-medium text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(scheme.scheme_id)}
                            className="font-medium text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    )}
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
                {isEditMode ? "Edit Scheme Data" : "Add Scheme Data"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Scheme Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheme Name
                </label>
                <input
                  type="text"
                  name="scheme_name"
                  value={newScheme.scheme_name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              {/* Scheme Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheme Description
                </label>
                <input
                  type="text"
                  name="scheme_description"
                  value={newScheme.scheme_description}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              {/* Gov. Monitor ID */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gov. Monitor ID
                </label>

                <select
                  name="scheme_gov_id"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newScheme.scheme_gov_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Govt</option>
                  {govMonData.map((citizen) => (
                    <option key={citizen.id} value={citizen.id}>
                      {citizen.name} (ID: {citizen.id})
                    </option>
                  ))}
                </select>
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
