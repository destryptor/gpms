import React, { useState, useEffect } from "react";

export default function Agricultural() {
  const [agricultureData, setAgricultureData] = useState([]);
  const [citizenData, setCitizenData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add"); // "add" or "update"
  const [searchTerm, setSearchTerm] = useState("");
  const [visitorrole, setVisitorrole] = useState("");

  useEffect(() => {
    localStorage.getItem("Role") && setVisitorrole(localStorage.getItem("Role"));
  }, []);
    // Form state
  const [formData, setFormData] = useState({
    id: "",
    address: {
      street: "",
      city: "",
      zipcode: ""
    },
    area_in_hectares: "",
    crops_grown: "",
    citizen_id: "",
    citizen_name: ""
  });
  
  // Fetch initial agriculture data
  useEffect(() => {
    fetchAgricultureData();
    fetchCitizenData();
  }, []);
  
  const fetchAgricultureData = () => {
    setLoading(true);
    fetch("http://localhost:5000/fetch_agriculture_data")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setAgricultureData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching agricultural data:", error);
        setLoading(false);
      });
  };
  
  const fetchCitizenData = () => {
    fetch("http://localhost:5000/fetch_citizen_data_for_agriculture")
      .then((res) => res.json())
      .then((data) => {
        setCitizenData(data);
      })
      .catch((error) => {
        console.error("Error fetching citizen data:", error);
      });
  };
  
  const searchByPanchayat = () => {
    if (!searchTerm.trim()) {
      fetchAgricultureData();
      return;
    }
    
    setLoading(true);
    // Call the new search route with the panchayat name in the URL
    fetch(`http://localhost:5000/fetch_agriculture_by_panchayat_name/${searchTerm}`)
      .then((res) => res.json())
      .then((data) => {
        setAgricultureData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error searching data:", error);
        setLoading(false);
      });
  };
  
  
  const handleOpenModal = (mode, data = null) => {
    setModalMode(mode);
    if (mode === "update" && data) {
      setFormData({
        ...data,
        crops_grown: Array.isArray(data.crops_grown) ? data.crops_grown.join(", ") : data.crops_grown
      });
    } else {
      setFormData({
        id: "",
        address: {
          street: "",
          city: "",
          zipcode: ""
        },
        area_in_hectares: "",
        crops_grown: "",
        citizen_id: "",
        citizen_name: ""
      });
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleCitizenSelect = (e) => {
    const selectedId = parseInt(e.target.value, 10);
    const selectedCitizen = citizenData.find(
      (citizen) => citizen.id === selectedId
    );
  
    if (selectedCitizen) {
      setFormData({
        ...formData,
        citizen_id: selectedCitizen.id,
        citizen_name: selectedCitizen.name
      });
    } else {
      setFormData({
        ...formData,
        citizen_id: "",
        citizen_name: ""
      });
    }
  };
  
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Prepare data for submission
    const submissionData = {
      ...formData,
      crops_grown: formData.crops_grown.split(",").map(crop => crop.trim())
    };
    
    const endpoint = modalMode === "add" 
      ? "http://localhost:5000/add_agriculture_data"
      : "http://localhost:5000/update_agriculture_data";
    
    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(submissionData),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Success:", data);
        handleCloseModal();
        fetchAgricultureData();
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  };
  
  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this record?")) {
      fetch(`http://localhost:5000/delete_agriculture_data/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((data) => {
          console.log("Deleted:", data);
          fetchAgricultureData();
        })
        .catch((error) => {
          console.error("Error deleting:", error);
        });
    }
  };

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">
            Agricultural Data
          </span>
        </div>
        {visitorrole === "admin" && (
          <button 
          className="py-2 px-4 bg-[#000000] font-medium text-sm text-white rounded-lg cursor-pointer"
          onClick={() => handleOpenModal("add")}
          >
          Add Data
        </button>)
        }
      </div>
      
      <div className="mt-4 mb-4 flex flex-row justify-between items-center w-full gap-2">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
            </svg>
          </div>
          <input 
            type="text" 
            className="block w-full p-2 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Search by panchayat name..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button 
          onClick={searchByPanchayat}
          className="py-1.5 px-2 bg-black cursor-pointer text-white rounded-lg"
        >
          Search
        </button>
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
                  Address
                </th>
                <th scope="col" className="px-6 py-3">
                  Area in Hectares
                </th>
                <th scope="col" className="px-6 py-3">
                  Crops Grown
                </th>
                <th scope="col" className="px-6 py-3">
                  Owner ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Owner Name
                </th>
                {visitorrole === "admin" && (
                  <th scope="col" className="px-6 py-3">
                  Actions
                </th>)
                }
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : agricultureData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No data found.
                  </td>
                </tr>
              ) : (
                agricultureData.map((data) => (
                  <tr key={data.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{data.id}</td>
                    <td className="px-6 py-4">
                      {data.address
                        ? `${data.address.street}, ${data.address.city}, ${data.address.zipcode}`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">{data.area_in_hectares}</td>
                    <td className="px-6 py-4">
                      {Array.isArray(data.crops_grown)
                        ? data.crops_grown.join(", ")
                        : data.crops_grown}
                    </td>
                    <td className="px-6 py-4">{data.citizen_id}</td>
                    <td className="px-6 py-4">{data.citizen_name}</td>
                    {visitorrole === "admin" && (
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleOpenModal("update", data)}
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(data.id)}
                          className="font-medium text-red-600 hover:text-red-800 cursor-pointer"
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
      
      {/* Modal for Add/Update */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-3xl">
            <h2 className="text-xl font-semibold mb-4">
              {modalMode === "add" ? "Add New" : "Update"} Agricultural Data
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Owner Selection */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Owner
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg"
                  value={formData.citizen_id}
                  onChange={handleCitizenSelect}
                  required
                >
                  <option value="">Select Owner</option>
                  {citizenData.map((citizen) => (
                    <option key={citizen.id} value={citizen.id}>
                      {citizen.name} (ID: {citizen.id})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Address Fields */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address.street"
                  value={formData.address.street}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="address.city"
                    value={formData.address.city}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2">
                    Zipcode
                  </label>
                  <input
                    type="text"
                    name="address.zipcode"
                    value={formData.address.zipcode}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              
              {/* Area in Hectares */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Area in Hectares
                </label>
                <input
                  type="number"
                  name="area_in_hectares"
                  value={formData.area_in_hectares}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  step="0.01"
                />
              </div>
              
              {/* Crops Grown */}
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Crops Grown (comma separated)
                </label>
                <input
                  type="text"
                  name="crops_grown"
                  value={formData.crops_grown}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  placeholder="wheat, rice, corn"
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg cursor-pointer hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-black text-white rounded-lg cursor-pointer hover:bg-gray-800"
                >
                  {modalMode === "add" ? "Add" : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}