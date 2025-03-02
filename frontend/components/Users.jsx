import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function Citizen() {
  const [user, setUserData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newCitizen, setNewCitizen] = useState({
    id: null,
    username: '',
    role: ''
  });

  useEffect(() => {
    // Fetch data from the backend API endpoint
    fetch('http://localhost:5000/fetch_users')
      .then((res) => res.json())
      .then((data) => {
        setUserData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching citizen data:', error);
        toast.error('Error fetching citizen data!');
        setLoading(false);
      });
  }, []);

  const openModal = (isEdit = false, data = null) => {
    setIsEditMode(isEdit);
    
    if (isEdit && data) {
      setNewCitizen({
        id: data.id,
        username: data.username,
        role: data.role 
      });
    } else {
      // Reset form for adding new data
      setNewCitizen({
        id: null,
        username: '',
        role: ''
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
      [name]: value
    });
  };

  const validateForm = () => {
    if (!newCitizen.username) {
      toast.error('Name is required!');
      return false;
    }
    
    if (!newCitizen.role) {
      toast.error('Date of birth is required!');
      return false;
    }
    
    
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form fields
    if (!validateForm()) return;
    
    const endpoint = isEditMode 
      ? `http://localhost:5000/update_user/${newCitizen.id}` 
      : 'http://localhost:5000/add_user';
    
    const method = isEditMode ? 'PUT' : 'POST';
    // Send data to backend
    fetch(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newCitizen),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isEditMode) {
          // Update the local state with the updated data
          setUserData(user.map(item => 
            item.id === newCitizen.id ? data.data : item
          ));
          toast.success('Citizen data updated successfully!');
        } else {
          // Update the local state with the new data
          setUserData([...user, data.data]);
          toast.success('Citizen data added successfully!');
        }
        closeModal();
      })
      .catch((error) => {
        console.error(`Error ${isEditMode ? 'updating' : 'adding'} citizen data:`, error);
        toast.error(`Error ${isEditMode ? 'updating' : 'adding'} citizen data!`);
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this citizen data?')) {
      fetch(`http://localhost:5000/delete_user/${id}`, {
        method: 'DELETE',
      })
        .then((res) => res.json())
        .then((data) => {
          setUserData(user.filter(item => item.id !== id));
          toast.success('Citizen data deleted successfully!');
        })
        .catch((error) => {
          console.error('Error deleting citizen data:', error);
          toast.error('Error deleting citizen data!');
        });
    }
  };

  // Filter data based on search query
  const filteredData = user.filter(item => {
    const query = searchQuery?.toLowerCase();
    return (
      item.username?.toLowerCase().includes(query) ||
      item.role?.toLowerCase().includes(query)
    );
  });
  

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">
            Users Data
          </span>
        </div>
        {/* <button
          className="py-2 px-4 bg-[#000000] font-medium text-sm text-white rounded-lg cursor-pointer"
          onClick={() => openModal(false)}
        >
          Add Data
        </button> */}
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
            placeholder="Search by citizen name | qualification | panchayat" 
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
                <th scope="col" className="px-6 py-3 text-nowrap">
                  ID
                </th>
                <th scope="col" className="px-6 py-3 text-nowrap">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-nowrap">
                  Role
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
                    <td className="px-6 py-4">{data.username}</td>
                    <td className="px-6 py-4">{data.role}</td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(true, data)}
                          className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(data.id)}
                          className="font-medium cursor-pointer text-red-600 hover:text-red-800"
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
          <div className="bg-white p-6 rounded-lg w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {isEditMode ? 'Edit Citizen Data' : 'Add Citizen Data'}
              </h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={newCitizen.username}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>
              </div>
              <div className='my-4'>
              <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>
                  <select
                    id="sex"
                    name="role"
                    value={newCitizen.role}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Select</option>
                    <option value="admin">Admin</option>
                    <option value="citizen">Citizen</option>
                    <option value="panchayat">Panchayat Member</option>
                    <option value="government_monitor">Govt. Monitor</option>
                  </select>
                </div>


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