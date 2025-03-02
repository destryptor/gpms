import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';


export default function PanchayatMembers() {
  const [panchayatMembersData, setPanchayatMembersData] = useState([]);
  const [citizensData, setCitizensData] = useState([]);
  const [panchayatsData, setPanchayatsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    citizen_id: '',
    panchayat_id: '',
    role: ''
  });

  // Base URL for API calls
  const baseUrl = 'http://localhost:5000';

  // Fetch all required data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const membersResponse = await fetch(`${baseUrl}/fetch_panchayat_members`);
        if (!membersResponse.ok) {
          throw new Error('Failed to fetch panchayat members');
        }
        const membersData = await membersResponse.json();
        setPanchayatMembersData(membersData);

        
        const citizensResponse = await fetch(`${baseUrl}/fetch_citizen_data`);
        const citizensData = await citizensResponse.json();
        console.log('citizensData:', citizensData);
        setCitizensData(citizensData);

        // Fetch panchayats data
        const panchayatsResponse = await fetch(`${baseUrl}/fetch_panchayat_data`);
        const panchayatsData = await panchayatsResponse.json();
        setPanchayatsData(panchayatsData);

        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMember({ ...newMember, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`${baseUrl}/add_citizen_panchayat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newMember),
      });
      
      if (response.ok) {
        const result = await response.json();
        // Since the response doesn't return the complete record with ID,
        // we'll create a new record for display purposes
        const newRecord = {
          ...newMember,
          id: Date.now() // temporary ID for UI purposes
        };
        setPanchayatMembersData([...panchayatMembersData, newRecord]);
        setIsModalOpen(false);
        setNewMember({ citizen_id: '', panchayat_id: '', role: '' });
        
        // Optionally: Show success message to user
        toast.success(result.message);
      } else {
        const errorData = await response.json();
        console.error('Failed to add new member:', errorData.error);
        alert(`Failed to add: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error adding new member:', error);
      alert('Error adding new member: ' + error.message);
    }
  };

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">
            Panchayat Members Data
          </span>
        </div>
        <button
          className="py-2 px-4 bg-[#000000] font-medium text-sm text-white rounded-lg cursor-pointer"
          onClick={() => setIsModalOpen(true)}
        >
          Add Data
        </button>
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
                  Panchayat ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Role
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : panchayatMembersData?.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    No data found.
                  </td>
                </tr>
              ) : (
                panchayatMembersData?.map((data, index) => (
                  <tr key={data.id || index} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4">{data.citizen_id}</td>
                    <td className="px-6 py-4">{data.panchayat_id}</td>
                    <td className="px-6 py-4">{data.role}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for adding new panchayat member */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Panchayat Member</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer "
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Citizen
                </label>
                <select
                  name="citizen_id"
                  value={newMember.citizen_id}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Citizen</option>
                  {citizensData.map((citizen) => (
                    <option key={citizen.id} value={citizen.id}>
                      {citizen.id} - {citizen.name || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
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
                      {panchayat.id} - {panchayat.address || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                  Role
                </label>
                <input
                  type="text"
                  name="role"
                  value={newMember.role}
                  onChange={handleInputChange}
                  className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Sarpanch, Ward Member, etc."
                />
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
                  Add Member
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