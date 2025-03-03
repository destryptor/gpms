import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function Citizen() {
  const [citizendata, setCitizenData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);
  const [visitorrole, setVisitorrole] = useState(localStorage.getItem("Role"));
  const [visitorid, setVisitorid] = useState(localStorage.getItem("Userid"));
  const [visitorpanchayat, setVisitorpanchayat] = useState("");
  const [newCitizen, setNewCitizen] = useState({
    id: null,
    name: "",
    date_of_birth: "",
    sex: "",
    occupation: "",
    qualification: "",
    address: "",
    phone_number: "",
    income: "",
    panchayat_id: "",
  });
  const role = localStorage.getItem("Role");
  const [flag, setFlag] = useState(true);

  const [edumap, setEdumap] = useState({
    None: 0,
    "Class 10": 0,
    "Class 12": 0,
    Diploma: 0,
    Postgraduate: 0,
    Undergraduate: 0,
    "Doctorate (PhD)": 0,
  });
  let citizen_obj = {
    None: 0,
    "Class 10": 0,
    "Class 12": 0,
    Diploma: 0,
    Postgraduate: 0,
    Undergraduate: 0,
    "Doctorate (PhD)": 0,
  };

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

  useEffect(() => {
    // Fetch data from the backend API endpoint
    fetch("http://localhost:5000/fetch_citizen_data")
      .then((res) => res.json())
      .then((data) => {
        setCitizenData(data);
        data.map((e) => {
          citizen_obj[e.qualification]++;
        });
        if (role === "panchayat") {
          setCitizenData(
            data.filter((item) => item.panchayat_id === visitorpanchayat)
          );
        }
        setFilteredData(data);
        setEdumap(citizen_obj);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching citizen data:", error);
        toast.error("Error fetching citizen data!");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    // Fetch data from the backend API endpoint
    fetch("http://localhost:5000/fetch_citizen_data")
      .then((res) => res.json())
      .then((data) => {
        setCitizenData(data);
        if (visitorrole === "panchayat") {
          setCitizenData(
            data.filter((item) => item.panchayat_id === visitorpanchayat)
          );
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching citizen data:", error);
        toast.error("Error fetching citizen data!");
        setLoading(false);
      });
  }, [visitorrole, visitorpanchayat]);

  const openModal = (isEdit = false, data = null) => {
    setIsEditMode(isEdit);

    if (isEdit && data) {
      setNewCitizen({
        id: data.id,
        name: data.name,
        date_of_birth: data.date_of_birth,
        sex: data.sex,
        occupation: data.occupation,
        qualification: data.qualification,
        address: data.address,
        phone_number: data.phone_number,
        income: data.income,
        panchayat_id: visitorpanchayat,
      });
    } else {
      // Reset form for adding new data
      setNewCitizen({
        id: null,
        name: "",
        date_of_birth: "",
        sex: "",
        occupation: "",
        qualification: "",
        address: "",
        phone_number: "",
        income: "",
        panchayat_id: "",
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
    setNewCitizen({
      ...newCitizen,
      [name]: value,
    });
  };

  const validateForm = () => {
    if (!newCitizen.name) {
      toast.error("Name is required!");
      return false;
    }

    if (!newCitizen.date_of_birth) {
      toast.error("Date of birth is required!");
      return false;
    }

    if (!newCitizen.sex) {
      toast.error("Sex is required!");
      return false;
    }

    if (!newCitizen.address) {
      toast.error("Address is required!");
      return false;
    }

    if (!newCitizen.phone_number) {
      toast.error("Phone number is required!");
      return false;
    }

    if (!newCitizen.income) {
      toast.error("Income is required!");
      return false;
    } else if (isNaN(newCitizen.income)) {
      toast.error("Income must be a number!");
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form fields
    if (!validateForm()) return;

    const endpoint = isEditMode
      ? `http://localhost:5000/update_citizen_data/${newCitizen.id}`
      : "http://localhost:5000/add_citizen_data";

    const method = isEditMode ? "PUT" : "POST";

    // Send data to backend
    fetch(endpoint, {
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newCitizen),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isEditMode) {
          // Update the local state with the updated data
          setCitizenData(
            citizendata.map((item) =>
              item.id === newCitizen.id ? data.data : item
            )
          );
          toast.success("Citizen data updated successfully!");
        } else {
          // Update the local state with the new data
          setCitizenData([...citizendata, data.data]);
          toast.success("Citizen data added successfully!");
        }
        closeModal();
      })
      .catch((error) => {
        console.error(
          `Error ${isEditMode ? "updating" : "adding"} citizen data:`,
          error
        );
        toast.error(
          `Error ${isEditMode ? "updating" : "adding"} citizen data!`
        );
      });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this citizen data?")) {
      fetch(`http://localhost:5000/delete_citizen_data/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then((data) => {
          setCitizenData(citizendata.filter((item) => item.id !== id));
          toast.success("Citizen data deleted successfully!");
        })
        .catch((error) => {
          console.error("Error deleting citizen data:", error);
          toast.error("Error deleting citizen data!");
        });
    }
  };

  // Filter data based on search query
  const handleSearch = () => {
    setFlag(false);
    let tempmap = {
      None: 0,
      "Class 10": 0,
      "Class 12": 0,
      Diploma: 0,
      Postgraduate: 0,
      Undergraduate: 0,
      "Doctorate (PhD)": 0,
    };
    const filteredD = citizendata.filter((item) => {
      const query = searchQuery.toLowerCase();
      return item.panchayat_name.toLowerCase().includes(query);
    });
    filteredD.map((e) => {
      tempmap[e.qualification]++;
    });
    console.log(tempmap);
    setEdumap(tempmap);
    setFilteredData(filteredD);
  };

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">
            Citizens Data
          </span>
        </div>
        {visitorrole !== "government_monitor" &&
          visitorrole !== "panchayat" && (
            <button
              className="py-2 px-4 bg-[#000000] font-medium text-sm text-white rounded-lg cursor-pointer"
              onClick={() => openModal(false)}
            >
              Add Data
            </button>
          )}
      </div>

      {/* Search bar */}
      {visitorrole !== 'panchayat' && (
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
          <div className="mt-4 mb-4">
            <div className="relative flex items-center space-x-2">
              <input
                type="text"
                className="w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search by Panchayat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                className="py-2 px-4 bg-[#000000] font-medium text-sm text-white rounded-lg cursor-pointer"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      )}
      
      {visitorrole === "government_monitor" && (
        <>
          <div className="mt-6">
            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                <thead className="text-base text-gray-700 bg-gray-50 border-b">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Qualification
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(edumap).map(([qualification, count]) => {
                    // If flag is true, divide the count by 2
                    const finalCount = flag ? count / 2 : count;

                    return (
                      <tr key={qualification} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{qualification}</td>
                        <td className="px-6 py-4">
                          {Math.round(finalCount)}
                        </td>{" "}
                        {/* Round to avoid decimal values */}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4">
            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                <thead className="text-base text-gray-700 bg-gray-50 border-b">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Date of Birth
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Sex
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Occupation
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Qualification
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Address
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Phone Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Income
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Panchayat
                    </th>
                    {role !== "government_monitor" && (
                      <th scope="col" className="px-6 py-3 text-nowrap">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-4">
                        No data found.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((data) => (
                      <tr key={data.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{data.id}</td>
                        <td className="px-6 py-4">{data.name}</td>
                        <td className="px-6 py-4">{data.date_of_birth}</td>
                        <td className="px-6 py-4">{data.sex}</td>
                        <td className="px-6 py-4">{data.occupation}</td>
                        <td className="px-6 py-4">{data.qualification}</td>
                        <td className="px-6 py-4">{data.address}</td>
                        <td className="px-6 py-4">{data.phone_number}</td>
                        <td className="px-6 py-4">{data.income}</td>
                        <td className="px-6 py-4">{data.panchayat_name}</td>
                        {role !== "government_monitor" && (
                          <td className="px-6 py-4">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => openModal(true, data)}
                                className="font-medium text-blue-600 hover:text-blue-800"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(data.id)}
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
        </>
      )}

      {visitorrole === "panchayat" && (
        <>
          <div className="mt-4">
            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                <thead className="text-base text-gray-700 bg-gray-50 border-b">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Date of Birth
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Sex
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Occupation
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Qualification
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Address
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Phone Number
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Income
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Panchayat
                    </th>
                    <th scope="col" className="px-6 py-3 text-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="10" className="text-center py-4">
                        Loading...
                      </td>
                    </tr>
                  ) : citizendata.length === 0 ? (
                    <tr>
                      <td colSpan="10" className="text-center py-4">
                        No data found.
                      </td>
                    </tr>
                  ) : (
                    citizendata.map((data) => (
                      <tr key={data.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">{data.id}</td>
                        <td className="px-6 py-4">{data.name}</td>
                        <td className="px-6 py-4">{data.date_of_birth}</td>
                        <td className="px-6 py-4">{data.sex}</td>
                        <td className="px-6 py-4">{data.occupation}</td>
                        <td className="px-6 py-4">{data.qualification}</td>
                        <td className="px-6 py-4">{data.address}</td>
                        <td className="px-6 py-4">{data.phone_number}</td>
                        <td className="px-6 py-4">{data.income}</td>
                        <td className="px-6 py-4">{data.panchayat_name}</td>
                        <td className="px-6 py-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => openModal(true, data)}
                              className="font-medium text-blue-600 hover:text-blue-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(data.id)}
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
        </>
      )}

      {/* Modal for Add/Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {isEditMode ? "Edit Citizen Data" : "Add Citizen Data"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={newCitizen.name}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="date_of_birth"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    id="date_of_birth"
                    name="date_of_birth"
                    value={newCitizen.date_of_birth}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="sex"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Sex
                  </label>
                  <select
                    id="sex"
                    name="sex"
                    value={newCitizen.sex}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="occupation"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Occupation
                  </label>
                  <input
                    type="text"
                    id="occupation"
                    name="occupation"
                    value={newCitizen.occupation}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label
                    htmlFor="qualification"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Qualification
                  </label>
                  {/* <input
                    type="text"
                    id="qualification"
                    name="qualification"
                    value={newCitizen.qualification}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  /> */}
                  <select
                    id="qualification"
                    name="qualification"
                    value={newCitizen.qualification}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select Qualification</option>
                    <option value="None">None</option>
                    <option value="Class 10">Class 10</option>
                    <option value="Class 12">Class 12</option>
                    <option value="Diploma">Diploma</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Doctorate (PhD)">Doctorate (PhD)</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="income"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Income
                  </label>
                  <input
                    type="text"
                    id="income"
                    name="income"
                    value={newCitizen.income}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="phone_number"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Phone Number
                  </label>
                  <input
                    type="text"
                    id="phone_number"
                    name="phone_number"
                    value={newCitizen.phone_number}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Address
                </label>
                <textarea
                  id="address"
                  name="address"
                  value={newCitizen.address}
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                ></textarea>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg cursor-pointer hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-black text-white rounded-lg cursor-pointer hover:bg-gray-800"
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
