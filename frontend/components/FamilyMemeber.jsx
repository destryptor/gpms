import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function FamilyMember() {
  const [familyMemberData, setFamilyMemberData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visitorrole, setVisitorRole] = useState(localStorage.getItem('Role'));
  const [citizens, setCitizens] = useState([]);
  const [newFamilyMember, setNewFamilyMember] = useState({
    citizen_id: '',
    family_member_id: '',
    relationship: ''
  });

  // useEffect(() => {
  //   localStorage.getItem('Role') && setVisitorRole(localStorage.getItem('Role'));
  // }, []);

  useEffect(() => {
    // Fetch family member data
    
      fetch('http://localhost:5000/fetch_family_member')
        .then((res) => res.json())
        .then((data) => {
          if(visitorrole === 'citizen'){
            setFamilyMemberData(data.filter(item => item.citizen_id == localStorage.getItem('Userid')) || []);
          }
          else
            setFamilyMemberData(data);
          setLoading(false);
        })
        .catch((error) => {
          toast.error('Error fetching family member data');
          console.error('Error fetching family member data:', error);
          setLoading(false);
        });
    
        

    
      // Fetch citizens for dropdown selection
      fetch('http://localhost:5000/fetch_citizens')
        .then((res) => res.json())
        .then((data) => {
          setCitizens(data);
        })
        .catch((error) => {
          console.error('Error fetching citizens:', error);
          toast.error('Error fetching citizens data');
        });
    
  }, []);

  const openModal = (isEdit = false, data = null) => {
    setIsEditMode(isEdit);
    
    if (isEdit && data) {
      setNewFamilyMember({
        citizen_id: data.citizen_id,
        family_member_id: data.family_member_id,
        relationship: data.relationship
      });
    } else {
      // Reset form for adding new relationship
      setNewFamilyMember({
        citizen_id: '',
        family_member_id: '',
        relationship: ''
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
    setNewFamilyMember({
      ...newFamilyMember,
      [name]: value
    });
  };

  const validateForm = () => {
    if (!newFamilyMember.citizen_id) {
      toast.error('Citizen ID is required!');
      return false;
    }
    
    if (!newFamilyMember.family_member_id) {
      toast.error('Family member ID is required!');
      return false;
    }
    
    if (newFamilyMember.citizen_id === newFamilyMember.family_member_id) {
      toast.error('Citizen and family member cannot be the same person!');
      return false;
    }
    
    if (!newFamilyMember.relationship) {
      toast.error('Relationship is required!');
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form fields
    if (!validateForm()) return;
    
    const endpoint = isEditMode 
      ? `http://localhost:5000/update_family_member` 
      : 'http://localhost:5000/add_family_member';
    
    const method = isEditMode ? 'PUT' : 'POST';
    
    // Send data to backend
    fetch(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newFamilyMember),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast.error(data.error);
          return;
        }
        
        if (isEditMode) {
          // Update the local state with the updated data
          setFamilyMemberData(familyMemberData.map(item => 
            (item.citizen_id === newFamilyMember.citizen_id && 
             item.family_member_id === newFamilyMember.family_member_id) ? data.data : item
          ));
          toast.success('Family relationship updated successfully!');
        } else {
          // Update the local state with the new data
          setFamilyMemberData([...familyMemberData, data.data]);
          toast.success('Family relationship added successfully!');
        }
        closeModal();
        
        // Refresh the data to ensure we have the latest
        fetch('http://localhost:5000/fetch_family_member')
          .then((res) => res.json())
          .then((data) => {
            setFamilyMemberData(data);
          });
      })
      .catch((error) => {
        console.error(`Error ${isEditMode ? 'updating' : 'adding'} family relationship:`, error);
        toast.error(`Error ${isEditMode ? 'updating' : 'adding'} family relationship!`);
      });
  };

  const handleDelete = (citizenId, familyMemberId) => {
    if (window.confirm('Are you sure you want to delete this family relationship?')) {
      fetch(`http://localhost:5000/delete_family_member`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          citizen_id: citizenId,
          family_member_id: familyMemberId
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.error) {
            toast.error(data.error);
            return;
          }
          
          setFamilyMemberData(familyMemberData.filter(item => 
            !(item.citizen_id === citizenId && item.family_member_id === familyMemberId)
          ));
          toast.success('Family relationship deleted successfully!');
        })
        .catch((error) => {
          console.error('Error deleting family relationship:', error);
          toast.error('Error deleting family relationship!');
        });
    }
  };

  // Filter data based on search query
  const filteredData = familyMemberData.filter(item => 
    item.citizen_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.family_member_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.relationship.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">
            Family Relationships
          </span>
        </div>
        {visitorrole !== 'citizen' &&
          <button
            className="py-2 px-4 bg-[#000000] font-medium text-sm text-white rounded-lg cursor-pointer"
            onClick={() => openModal(false)}
          >
            Add Relationship
          </button>
        }
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
            placeholder="Search by name or relationship..." 
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
                  Family Member ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Family Member Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Relationship
                </th>
                {visitorrole !== 'citizen' &&
                  <th scope="col" className="px-6 py-3">
                    Actions
                  </th>
                }
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={visitorrole !== 'citizen' ? 6 : 5} className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={visitorrole !== 'citizen' ? 6 : 5} className="text-center py-4">
                    No data found.
                  </td>
                </tr>
              ) : (
                filteredData.map((data, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{data.citizen_id}</td>
                    <td className="px-6 py-4">{data.citizen_name}</td>
                    <td className="px-6 py-4">{data.family_member_id}</td>
                    <td className="px-6 py-4">{data.family_member_name}</td>
                    <td className="px-6 py-4">{data.relationship}</td>
                    {visitorrole !== 'citizen' &&
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openModal(true, data)}
                            className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(data.citizen_id, data.family_member_id)}
                            className="font-medium text-red-600 hover:text-red-800 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    }
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
                {isEditMode ? 'Edit Family Relationship' : 'Add Family Relationship'}
              </h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Citizen Dropdown */}
              <div className="mb-4">
                <label htmlFor="citizen_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Citizen
                </label>
                <select
                  id="citizen_id"
                  name="citizen_id"
                  value={newFamilyMember.citizen_id}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  disabled={isEditMode}
                >
                  <option value="">Select Citizen</option>
                  {citizens.map((citizen) => (
                    <option key={`citizen_${citizen.id}`} value={citizen.id}>
                      {citizen.name} (ID: {citizen.id})
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Family Member Dropdown */}
              <div className="mb-4">
                <label htmlFor="family_member_id" className="block text-sm font-medium text-gray-700 mb-1">
                  Family Member
                </label>
                <select
                  id="family_member_id"
                  name="family_member_id"
                  value={newFamilyMember.family_member_id}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                  disabled={isEditMode}
                >
                  <option value="">Select Family Member</option>
                  {citizens
                    .filter(citizen => citizen.id != newFamilyMember.citizen_id)
                    .map((citizen) => (
                      <option key={`family_${citizen.id}`} value={citizen.id}>
                        {citizen.name} (ID: {citizen.id})
                      </option>
                    ))}
                </select>
              </div>
              
              {/* Relationship Field */}
              <div className="mb-4">
                <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-1">
                  Relationship
                </label>
                <select
                  id="relationship"
                  name="relationship"
                  value={newFamilyMember.relationship}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Relationship</option>
                  <option value="Spouse">Spouse</option>
                  <option value="Parent">Parent</option>
                  <option value="Child">Child</option>
                  <option value="Sibling">Sibling</option>
                  <option value="Grandparent">Grandparent</option>
                  <option value="Grandchild">Grandchild</option>
                  <option value="In-law">In-law</option>
                  <option value="Other">Other</option>
                </select>
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
                  {isEditMode ? 'Update' : 'Submit'}
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