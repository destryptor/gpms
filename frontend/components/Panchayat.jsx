import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function Panchayat() {
  const [panchayatdata, setPanchayatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visitorrole, setVisitorrole] = useState(localStorage.getItem("Role"));
    const [visitorid, setVisitorid] = useState(localStorage.getItem("Userid"));
    const [visitorpanchayat, setVisitorpanchayat] = useState('');
  const [newPanchayat, setNewPanchayat] = useState({
    id: null,
    name: '',
    address: {
      village: '',
      street: '',
      district: '',
      state: '',
      pincode: ''
    },
    income: '',
    expenditure: '',
    environmental_data: {}
  });

  
  // State for environmental data fields
  const [envFields, setEnvFields] = useState([{ key: '', value: '' }]);

  const formatEnvironmentalData = (data) => {
    return Object.entries(data)
      .map(([key, value]) => `${key.replace(/_/g, " ")}: ${value}`)
      .join(", ");
  };

  useEffect(() => {
    if(visitorrole === 'panchayat'){
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
    fetch('http://localhost:5000/fetch_panchayat_data')
      .then((res) => res.json())
      .then((data) => {
        setPanchayatData(data);
        if(visitorrole === 'panchayat'){
          setPanchayatData(data.filter(item => item.id === visitorpanchayat));
        }
        console.log(data);
        setLoading(false);
      })
      .catch((error) => {
        toast.error('Error fetching panchayat data:', error);
        setLoading(false);
      });
  }, [visitorrole, visitorpanchayat]);

  const openModal = (isEdit = false, data = null) => {
    setIsEditMode(isEdit);
    
    if (isEdit && data) {
      // Convert environmental_data to array format for editing
      const envDataArray = Object.entries(data.environmental_data).map(([key, value]) => ({
        key,
        value
      }));
      
      setEnvFields(envDataArray.length > 0 ? envDataArray : [{ key: '', value: '' }]);
      setNewPanchayat({
        id: data.id,
        name: data.name,
        address: { ...data.address },
        income: data.income,
        expenditure: data.expenditure,
        environmental_data: { ...data.environmental_data }
      });
    } else {
      // Reset form for adding new data
      setNewPanchayat({
        id: null,
        name: '',
        address: {
          village: '',
          street: '',
          district: '',
          state: '',
          pincode: ''
        },
        income: '',
        expenditure: '',
        environmental_data: {}
      });
      setEnvFields([{ key: '', value: '' }]);
    }
    
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsEditMode(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle address fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setNewPanchayat({
        ...newPanchayat,
        address: {
          ...newPanchayat.address,
          [addressField]: value
        }
      });
    } else {
      // Handle other fields
      setNewPanchayat({
        ...newPanchayat,
        [name]: value
      });
    }
  };

  // Handle changes to environmental data fields
  const handleEnvFieldChange = (index, field, value) => {
    const updatedFields = [...envFields];
    updatedFields[index][field] = value;
    setEnvFields(updatedFields);
    
    // Update the environmental_data object in newPanchayat
    const envData = {};
    updatedFields.forEach(field => {
      if (field.key && field.value) {
        envData[field.key] = field.value;
      }
    });
    
    setNewPanchayat({
      ...newPanchayat,
      environmental_data: envData
    });
  };

  // Add a new environmental field
  const addEnvField = () => {
    setEnvFields([...envFields, { key: '', value: '' }]);
  };

  // Remove an environmental field
  const removeEnvField = (index) => {
    if (envFields.length > 1) {
      const updatedFields = envFields.filter((_, i) => i !== index);
      setEnvFields(updatedFields);
      
      // Update the environmental_data object
      const envData = {};
      updatedFields.forEach(field => {
        if (field.key && field.value) {
          envData[field.key] = field.value;
        }
      });
      
      setNewPanchayat({
        ...newPanchayat,
        environmental_data: envData
      });
    }
  };

  const validateForm = () => {
    const { village, street, district, state, pincode } = newPanchayat.address;
    
    if (!newPanchayat.name) {
      toast.error('Name field is required!');
      return false;
    }
    
    if (!village || !street || !district || !state || !pincode) {
      toast.error('All address fields are required!');
      return false;
    }
    
    if (!newPanchayat.income || !newPanchayat.expenditure) {
      toast.error('Income and Expenditure fields are required!');
      return false;
    }
    
    if(isNaN(newPanchayat.income) || isNaN(newPanchayat.expenditure)){
      toast.error('Income and Expenditure should be numbers!');
      return false;
    }
    
    // Validate that at least one environmental data field is filled
    if (Object.keys(newPanchayat.environmental_data).length === 0) {
      toast.error('At least one environmental data field is required!');
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate form fields
    if (!validateForm()) return;
    
    const endpoint = isEditMode 
      ? `http://localhost:5000/update_panchayat_data/${newPanchayat.id}` 
      : 'http://localhost:5000/add_panchayat_data';
    
    const method = isEditMode ? 'PUT' : 'POST';
    
    // Send data to backend
    fetch(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPanchayat),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isEditMode) {
          // Update the local state with the updated data
          setPanchayatData(panchayatdata.map(item => 
            item.id === newPanchayat.id ? data.data : item
          ));
          toast.success('Panchayat data updated successfully!');
        } else {
          // Update the local state with the new data
          setPanchayatData([...panchayatdata, data.data]);
          toast.success('Panchayat data added successfully!');
        }
        closeModal();
      })
      .catch((error) => {
        console.error(`Error ${isEditMode ? 'updating' : 'adding'} panchayat data:`, error);
        toast.error(`Error ${isEditMode ? 'updating' : 'adding'} panchayat data!`);
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this panchayat data?')) {
      fetch(`http://localhost:5000/delete_panchayat_data/${id}`, {
        method: 'DELETE',
      })
        .then((res) => res.json())
        .then((data) => {
          setPanchayatData(panchayatdata.filter(item => item.id !== id));
          toast.success('Panchayat data deleted successfully!');
        })
        .catch((error) => {
          console.error('Error deleting panchayat data:', error);
          toast.error('Error deleting panchayat data!');
        });
    }
  };

  // Filter data based on search query
  const filteredData = panchayatdata.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">
            Panchayat Data
          </span>
        </div>
        { visitorrole === 'admin' &&
        <button
          className="py-2 px-4 bg-[#000000] font-medium text-sm text-white rounded-lg cursor-pointer"
          onClick={() => openModal(false)}
        >
          Add Data
        </button>
        }
      </div>
      
      {/* Search bar */}
      { visitorrole === 'admin' && (
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
            placeholder="Search by panchayat name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      )}

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
                  Address
                </th>
                { visitorrole !== 'citizen' &&
              
                <>
                <th scope="col" className="px-6 py-3">
                  Income
                </th>
                <th scope="col" className="px-6 py-3">
                  Expenditure
                </th>
                <th scope="col" className="px-6 py-3">
                  Environmental Data
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
                </>
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
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No data found.
                  </td>
                </tr>
              ) : (
                filteredData.map((data) => (
                  <tr key={data.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{data.id}</td>
                    <td className="px-6 py-4">{data.name}</td>
                    <td className="px-6 py-4">{data.address.village}, {data.address.street}, {data.address.district}, {data.address.state}, {data.address.pincode}</td>
                    { visitorrole !== 'citizen' &&
                      <>
                      <td className="px-6 py-4">{data.income}</td>
                      <td className="px-6 py-4">{data.expenditure}</td>
                      <td className="px-6 py-4">
                        {formatEnvironmentalData(data.environmental_data)}
                      </td>
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
                            className="font-medium text-red-600 hover:text-red-800 cursor-pointer"
                            >
                            Delete
                          </button>
                        </div>
                      </td>
                            </>
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
                {isEditMode ? 'Edit Panchayat Data' : 'Add Panchayat Data'}
              </h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {/* Name Field */}
              {visitorrole !== 'panchayat' &&(
                <>
                  <div className="mb-4">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={newPanchayat.name}
                      onChange={handleChange}
                      className="w-full p-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Address
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          id="village"
                          name="address.village"
                          placeholder="Village"
                          value={newPanchayat.address.village}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded-md mb-2"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          id="street"
                          name="address.street"
                          placeholder="Street"
                          value={newPanchayat.address.street}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded-md mb-2"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          id="district"
                          name="address.district"
                          placeholder="District"
                          value={newPanchayat.address.district}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded-md mb-2"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          id="state"
                          name="address.state"
                          placeholder="State"
                          value={newPanchayat.address.state}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded-md mb-2"
                          required
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          id="pincode"
                          name="address.pincode"
                          placeholder="Pincode"
                          value={newPanchayat.address.pincode}
                          onChange={handleChange}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
              
              <div className="mb-4">
                <label htmlFor="income" className="block text-sm font-medium text-gray-700 mb-1">
                  Income
                </label>
                <input
                  type="text"
                  id="income"
                  name="income"
                  value={newPanchayat.income}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="expenditure" className="block text-sm font-medium text-gray-700 mb-1">
                  Expenditure
                </label>
                <input
                  type="text"
                  id="expenditure"
                  name="expenditure"
                  value={newPanchayat.expenditure}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Environmental Data
                  </label>
                  <button
                    type="button"
                    onClick={addEnvField}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    + Add Field
                  </button>
                </div>
                
                {envFields.map((field, index) => (
                  <div key={index} className="flex mb-2">
                    <input
                      type="text"
                      placeholder="Field Name"
                      value={field.key}
                      onChange={(e) => handleEnvFieldChange(index, 'key', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-l-md"
                    />
                    <input
                      type="text"
                      placeholder="Value"
                      value={field.value}
                      onChange={(e) => handleEnvFieldChange(index, 'value', e.target.value)}
                      className="w-full p-2 border-t border-b border-r border-gray-300"
                    />
                    {envFields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEnvField(index)}
                        className="px-3 py-2 bg-red-100 text-red-600 border border-gray-300 rounded-r-md hover:bg-red-200"
                      >
                        ✕
                      </button>
                    )}
                    {envFields.length === 1 && index === 0 && (
                      <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-r-md">
                        ✕
                      </div>
                    )}
                  </div>
                ))}
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