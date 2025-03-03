import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function PanchayatMembers() {
  const [panchayatMembersData, setPanchayatMembersData] = useState([]);
  const [citizensData, setCitizensData] = useState([]);
  const [panchayatsData, setPanchayatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMember, setNewMember] = useState({
    citizen_id: "",
    panchayat_id: "",
    role: "",
  });

  const [visitorrole, setVisitorrole] = useState("citizen");

  useEffect(() => {
    localStorage.getItem("Role") &&
      setVisitorrole(localStorage.getItem("Role"));
  }, []);

  const baseUrl = "http://localhost:5000";

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const membersResponse = await fetch(`${baseUrl}/fetch_panchayat_members`);
      if (!membersResponse.ok) {
        throw new Error("Failed to fetch panchayat members");
      }
      const membersData = await membersResponse.json();
      setPanchayatMembersData(membersData);

      const citizensResponse = await fetch(`${baseUrl}/fetch_citizen_data`);
      if (!citizensResponse.ok) {
        throw new Error("Failed to fetch citizens data");
      }
      const citizensData = await citizensResponse.json();
      setCitizensData(citizensData);

      const panchayatsResponse = await fetch(`${baseUrl}/fetch_panchayat_data`);
      if (!panchayatsResponse.ok) {
        throw new Error("Failed to fetch panchayats data");
      }
      const panchayatsData = await panchayatsResponse.json();
      setPanchayatsData(panchayatsData);

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error(`Error fetching data: ${error.message}`);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMember({ ...newMember, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (modalMode === "add") {
        const response = await fetch(`${baseUrl}/add_citizen_panchayat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newMember),
        });

        if (response.ok) {
          const result = await response.json();

          fetchAllData();
          setIsModalOpen(false);
          setNewMember({ citizen_id: "", panchayat_id: "", role: "" });
          toast.success(result.message);
        } else {
          const errorData = await response.json();
          console.error("Failed to add new member:", errorData.error);
          toast.error(`Failed to add: ${errorData.error || "Unknown error"}`);
        }
      } else if (modalMode === "edit") {
        const response = await fetch(`${baseUrl}/update_citizen_panchayat`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...newMember,
            original_citizen_id: selectedMemberId,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          fetchAllData();
          setIsModalOpen(false);
          setNewMember({ citizen_id: "", panchayat_id: "", role: "" });
          toast.success(result.message);
        } else {
          const errorData = await response.json();
          console.error("Failed to update member:", errorData.error);
          toast.error(
            `Failed to update: ${errorData.error || "Unknown error"}`
          );
        }
      }
    } catch (error) {
      console.error(
        `Error ${modalMode === "add" ? "adding" : "updating"} member:`,
        error
      );
      toast.error(
        `Error ${modalMode === "add" ? "adding" : "updating"} member: ${
          error.message
        }`
      );
    }
  };

  const handleEdit = (member) => {
    setModalMode("edit");
    setSelectedMemberId(member.citizen_id);
    setNewMember({
      citizen_id: member.citizen_id,
      panchayat_id: member.panchayat_id,
      role: member.role || "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (citizenId) => {
    if (window.confirm("Are you sure you want to delete this member?")) {
      try {
        const response = await fetch(
          `${baseUrl}/delete_citizen_panchayat/${citizenId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          const result = await response.json();

          setPanchayatMembersData(
            panchayatMembersData.filter(
              (member) => member.citizen_id !== citizenId
            )
          );
          toast.success(result.message);
        } else {
          const errorData = await response.json();
          console.error("Failed to delete member:", errorData.error);
          toast.error(
            `Failed to delete: ${errorData.error || "Unknown error"}`
          );
        }
      } catch (error) {
        console.error("Error deleting member:", error);
        toast.error(`Error deleting member: ${error.message}`);
      }
    }
  };

  const openAddModal = () => {
    setModalMode("add");
    setNewMember({ citizen_id: "", panchayat_id: "", role: "" });
    setIsModalOpen(true);
  };

  const getCitizenName = (id) => {
    const citizen = citizensData.find((c) => c.id === id);
    return citizen ? citizen.name : "Unknown";
  };

  const getPanchayatName = (id) => {
    const panchayat = panchayatsData.find((p) => p.id === id);
    return panchayat ? panchayat.name : "Unknown";
  };

  const filteredData = panchayatMembersData.filter((member) => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    const citizenName = getCitizenName(member.citizen_id).toLowerCase();
    const panchayatName = getPanchayatName(member.panchayat_id).toLowerCase();
    const role = (member.role || "").toLowerCase();

    return (
      citizenName.includes(query) ||
      panchayatName.includes(query) ||
      role.includes(query)
    );
  });

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">
            Panchayat Members Data
          </span>
        </div>
        {visitorrole === "admin" && (
          <button
            className="py-2 px-4 bg-[#000000] font-medium text-sm text-white rounded-lg cursor-pointer"
            onClick={openAddModal}
          >
            Add Data
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
            placeholder="Search by citizen name | panchayat name | role"
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
                  Citizen ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Citizen Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Panchayat ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Panchayat Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Role
                </th>
                {visitorrole === "admin" && (
                  <th scope="col" className="px-6 py-3 text-center">
                    Actions
                  </th>
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
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No data found.
                  </td>
                </tr>
              ) : (
                filteredData.map((data, index) => (
                  <tr
                    key={data.citizen_id || index}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">{data.citizen_id}</td>
                    <td className="px-6 py-4">
                      {getCitizenName(data.citizen_id)}
                    </td>
                    <td className="px-6 py-4">{data.panchayat_id}</td>
                    <td className="px-6 py-4">
                      {getPanchayatName(data.panchayat_id)}
                    </td>
                    <td className="px-6 py-4">{data.role}</td>
                    {visitorrole === "admin" && (
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center space-x-3">
                          <button
                            onClick={() => handleEdit(data)}
                            className="font-medium text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(data.citizen_id)}
                            className="font-medium text-red-600 hover:underline"
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

      {/* Modal for adding/editing panchayat member */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {modalMode === "add"
                  ? "Add Panchayat Member"
                  : "Edit Panchayat Member"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-md font-semibold mb-2">
                  Citizen
                </label>
                <select
                  name="citizen_id"
                  value={newMember.citizen_id}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={modalMode === "edit"}
                >
                  <option value="">Select Citizen</option>
                  {citizensData.map((citizen) => (
                    <option key={citizen.id} value={citizen.id}>
                      {citizen.id} - {citizen.name || "Unknown"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-md font-semibold mb-2">
                  Panchayat
                </label>
                <select
                  name="panchayat_id"
                  value={newMember.panchayat_id}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Panchayat</option>
                  {panchayatsData.map((panchayat) => (
                    <option key={panchayat.id} value={panchayat.id}>
                      {panchayat.id} - {panchayat.name || "Unknown"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-md font-semibold mb-2">
                  Role
                </label>
                <select
                  name="role"
                  value={newMember.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Role</option>
                  <option value="sarpanch">Sarpanch</option>
                  <option value="president">President</option>
                  <option value="secretary">Secretary</option>
                  <option value="member">Member</option>
                  <option value="treasurer">Treasurer</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="mr-2 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg cursor-pointer hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 bg-black text-white rounded-lg cursor-pointer hover:bg-gray-800"
                >
                  {modalMode === "add" ? "Add Member" : "Update Member"}
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
