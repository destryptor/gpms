import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function Services() {
  const [servicesData, setServicesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [serviceMap, setServicemap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [citizensData, setCitizensData] = useState([]);
  const [visitorrole, setVisitorrole] = useState(localStorage.getItem("Role"));
  const [visitorid, setVisitorid] = useState(localStorage.getItem("Userid"));
  const [visitorpanchayat, setVisitorpanchayat] = useState("");
  const [panchayatData, setPanchayatData] = useState([]);
  const [newService, setNewService] = useState({
    id: null,
    service_name: "",
    service_type: "",
    service_issued_date: "",
    service_expiry_date: "",
    availing_citizen_id: "",
    issuing_panchayat_id: "",
  });
  let ind = 0;
  useEffect(() => {
    let url = "http://localhost:5000/fetch_services";
    if (visitorrole === "citizen") {
      url = `http://localhost:5000/fetch_services_by_citizen/${visitorid}`;
    }
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Network response was not ok");
        }
        return res.json();
      })
      .then((data) => {
        setServicesData(Array.isArray(data) ? data : []);
        setFilteredData(data);
        // console.log(data);

        const newSchememap = {};
        data.forEach((item) => {
          if (newSchememap[item.service_name]) {
            newSchememap[item.service_name] += 1;
          } else {
            newSchememap[item.service_name] = 1;
          }
        });
        setServicemap(newSchememap);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching services data:", error);
        setError(error.message);
        setLoading(false);
      });

    fetch("http://localhost:5000/fetch_panchayat_data")
      .then((res) => res.json())
      .then((data) => {
        setPanchayatData(data);
      })
      .catch((error) => {
        console.error("Error fetching panchayat data:", error);
        toast.error("Error fetching panchayat data!");
      });
  }, []);

  useEffect(() => {
    fetch("http://localhost:5000/fetch_citizen_data")
      .then((res) => res.json())
      .then((data) => {
        setCitizensData(data);
        if (visitorrole === "panchayat") {
          setCitizensData(
            data.filter((item) => item.panchayat_id === visitorpanchayat)
          );
        }
      })
      .catch((error) => {
        console.error("Error fetching citizen data:", error);
        toast.error("Error fetching citizen data!");
      });
  }, [visitorrole, visitorpanchayat]);

  useEffect(() => {
    if (visitorrole === "panchayat") {
      fetch(`http://localhost:5000/fetch_panchayat_by_member/${visitorid}`)
        .then((res) => res.json())
        .then((data) => {
          setVisitorpanchayat(data.panchayat_id);
        })
        .catch((error) => {
          console.error("Error fetching panchayat data:", error);
        });
    }
  }, [visitorrole]);

  const handleSearch = () => {
    const filteredD = servicesData.filter((item) => {
      const query = searchQuery.toLowerCase();
      return item.issuing_panchayat_name.toLowerCase().includes(query);
    });
    const newSchememap = {};
    filteredD.forEach((item) => {
      if (newSchememap[item.service_name]) {
        newSchememap[item.service_name] += 1;
      } else {
        newSchememap[item.service_name] = 1;
      }
    });
    setServicemap(newSchememap);
    setFilteredData(filteredD);
  };

  const openModal = (isEdit = false, data = null) => {
    setIsEditMode(isEdit);
    if (isEdit && data) {
      setNewService({
        id: data.service_id,
        service_name: data.service_name,
        service_type: data.service_type,
        service_issued_date: data.service_issued_date,
        service_expiry_date: data.service_expiry_date,
        availing_citizen_id: data.citizen_id,
      });
    } else {
      setNewService({
        id: null,
        service_name: "",
        service_type: "",
        service_issued_date: "",
        service_expiry_date: "",
        availing_citizen_id: "",
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
    setNewService({
      ...newService,
      [name]: value,
    });
  };

  const validateForm = () => {
    const {
      service_name,
      service_type,
      service_issued_date,
      service_expiry_date,
      availing_citizen_id,
    } = newService;
    if (
      !service_name ||
      !service_type ||
      !service_issued_date ||
      !service_expiry_date ||
      !availing_citizen_id
    ) {
      toast.error("All fields are required!");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (visitorrole === "panchayat") {
      newService.issuing_panchayat_id = visitorpanchayat;
    }
    const endpoint = isEditMode
      ? `http://localhost:5000/update_service/${newService.id}`
      : "http://localhost:5000/add_service";
    const method = isEditMode ? "PUT" : "POST";

    fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newService),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isEditMode) {
          setServicesData(
            servicesData.map((item) =>
              item.service_id === newService.id ? data.data : item
            )
          );
          toast.success("Service updated successfully!");
        } else {
          setServicesData([...servicesData, data.data]);
          toast.success("Service added successfully!");
        }
        closeModal();
      })
      .catch((error) => {
        console.error(
          `Error ${isEditMode ? "updating" : "adding"} service:`,
          error
        );
        toast.error(`Error ${isEditMode ? "updating" : "adding"} service!`);
      });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this service?")) {
      fetch(`http://localhost:5000/delete_service/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then(() => {
          setServicesData(
            servicesData.filter((item) => item.service_id !== id)
          );
          toast.success("Service deleted successfully!");
        })
        .catch((error) => {
          console.error("Error deleting service:", error);
          toast.error("Error deleting service!");
        });
    }
  };

  const filteredServices = servicesData.filter((item) => {
    if (visitorrole === "panchayat") {
      return (
        item.issuing_panchayat_id === visitorpanchayat &&
        item.service_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    } else if (visitorrole === "government_montior") {
      return item.issuing_panchayat_name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    }
    return item.service_name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      {(visitorrole === "government_monitor" ||
        visitorrole === "citizen" ||
        visitorrole === "admin") && (
        <div>
          <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
            {(visitorrole === "government_monitor" ||
              visitorrole === "citizen") && (
              <>
                <div className="flex flex-row justify-between items-center">
                  <div className="flex flex-row text-center justify-center space-x-2">
                    <span className="text-lg font-semibold text-gray-700">
                      Services Data
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                    Error: {error}
                  </div>
                )}
              </>
            )}

            <div className="mt-4">
              {visitorrole === "government_monitor" && (
                <div className="relative flex items-center space-x-2">
                  {visitorrole === "government_monitor" && (
                    <input
                      type="text"
                      className="w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search by Panchayat"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  )}
                  {visitorrole === "citizen" && (
                    <input
                      type="text"
                      className="w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Search by Service"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  )}
                  <button
                    className="py-2 px-4 bg-[#000000] font-medium text-sm text-white rounded-lg cursor-pointer"
                    onClick={handleSearch}
                  >
                    Search
                  </button>
                </div>
              )}

              {visitorrole !== "citizen" && visitorrole !== "admin" && (
                <div className="mt-8">
                  <h2 className="text-lg font-semibold text-gray-700 mb-4">
                    Services Benefits Summary
                  </h2>
                  <div className="relative overflow-x-auto sm:rounded-lg">
                    <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                      <thead className="text-base text-gray-700 bg-gray-50 border-b">
                        <tr>
                          <th scope="col" className="px-6 py-3">
                            Service Name
                          </th>
                          <th scope="col" className="px-6 py-3">
                            Number of Citizens Benefitted
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.keys(serviceMap).length === 0 ? (
                          <tr>
                            <td colSpan="2" className="text-center py-4">
                              No services found.
                            </td>
                          </tr>
                        ) : (
                          Object.entries(serviceMap).map(
                            ([serviceName, numberOfCitizens]) => (
                              <tr
                                key={serviceName}
                                className="cursor-pointer hover:bg-gray-50"
                              >
                                <td className="px-6 py-4">{serviceName}</td>
                                <td className="px-6 py-4">
                                  {numberOfCitizens}
                                </td>
                              </tr>
                            )
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {(visitorrole === "government_monitor" ||
                visitorrole === "citizen") && (
                <div className="relative overflow-x-auto sm:rounded-lg">
                  <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                    <thead className="text-base text-gray-700 bg-gray-50 border-b">
                      <tr>
                        <th scope="col" className="px-6 py-3">
                          Service ID
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Service Name
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Service Type
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Issued Date
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Expiry Date
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Citizen ID
                        </th>
                        <th scope="col" className="px-6 py-3">
                          Citizen Name
                        </th>
                        {visitorrole === "government_monitor" && (
                          <th scope="col" className="px-6 py-3">
                            Panchayat Name
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            Loading...
                          </td>
                        </tr>
                      ) : servicesData.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="text-center py-4">
                            No data found.
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((data) => (
                          <tr
                            key={data.service_id}
                            className="cursor-pointer hover:bg-gray-50"
                          >
                            <td className="px-6 py-4">{data.service_id}</td>
                            <td className="px-6 py-4">{data.service_name}</td>
                            <td className="px-6 py-4">{data.service_type}</td>
                            <td className="px-6 py-4">
                              {data.service_issued_date}
                            </td>
                            <td className="px-6 py-4">
                              {data.service_expiry_date}
                            </td>
                            <td className="px-6 py-4">{data.citizen_id}</td>
                            <td className="px-6 py-4">{data.citizen_name}</td>
                            {visitorrole === "government_monitor" && (
                              <td className="px-6 py-4">
                                {data.issuing_panchayat_name}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {(visitorrole === "panchayat" || visitorrole === "admin") && (
        <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
          <div className="flex flex-row justify-between items-center">
            <span className="text-lg font-semibold text-gray-700">
              Services Data
            </span>
            <button
              className="py-2 px-4 bg-black font-medium text-sm text-white rounded-lg"
              onClick={() => openModal(false)}
            >
              Add Services
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
              Error: {error}
            </div>
          )}

          {/* Search Bar */}
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
                placeholder="Search by service name..."
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
                    <th className="px-6 py-3">Service ID</th>
                    <th className="px-6 py-3">Service Name</th>
                    <th className="px-6 py-3">Service Type</th>
                    <th className="px-6 py-3">Issued Date</th>
                    <th className="px-6 py-3">Expiry Date</th>
                    <th className="px-6 py-3">Citizen ID</th>
                    <th className="px-6 py-3">Citizen Name</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredServices.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        No data found.
                      </td>
                    </tr>
                  ) : (
                    filteredServices.map((data) => (
                      <tr
                        key={data.service_id}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">{data.service_id}</td>
                        <td className="px-6 py-4">{data.service_name}</td>
                        <td className="px-6 py-4">{data.service_type}</td>
                        <td className="px-6 py-4">
                          {data.service_issued_date}
                        </td>
                        <td className="px-6 py-4">
                          {data.service_expiry_date}
                        </td>
                        <td className="px-6 py-4">{data.citizen_id}</td>
                        <td className="px-6 py-4">{data.citizen_name}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal(true, data)}
                              className="font-medium text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(data.service_id)}
                              className="font-medium text-red-600 hover:text-red-800"
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
                    {isEditMode ? "Edit Service Data" : "Add Service Data"}
                  </h2>
                  <button
                    onClick={closeModal}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleSubmit}>
                  {/* Service Name */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Name
                    </label>
                    <input
                      type="text"
                      name="service_name"
                      value={newService.service_name}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  {/* Service Type */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Service Type
                    </label>
                    <input
                      type="text"
                      name="service_type"
                      value={newService.service_type}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  {/* Issued Date */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Issued Date
                    </label>
                    <input
                      type="date"
                      name="service_issued_date"
                      value={newService.service_issued_date}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  {/* Expiry Date */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expiry Date
                    </label>
                    <input
                      type="date"
                      name="service_expiry_date"
                      value={newService.service_expiry_date}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  {/* Citizen ID */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Citizen ID
                    </label>
                    <select
                      name="availing_citizen_id"
                      value={newService.availing_citizen_id}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Citizen</option>
                      {citizensData.map((citizen) => (
                        <option key={citizen.id} value={citizen.id}>
                          {citizen.id} - {citizen.name || "Unknown"}
                        </option>
                      ))}
                    </select>
                  </div>
                  {visitorrole === "admin" && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Issuing Panchayat
                      </label>
                      <select
                        name="issuing_panchayat_id"
                        value={newService.issuing_panchayat_id}
                        onChange={handleChange}
                        className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Panchayat</option>
                        {panchayatData.map((citizen) => (
                          <option key={citizen.id} value={citizen.id}>
                            {citizen.id} - {citizen.name || "Unknown"}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
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
      )}
    </>
  );
}
