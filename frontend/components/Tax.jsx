import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function Tax() {
  const [taxData, setTaxData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [governmentMonitors, setGovernmentMonitors] = useState([]);
  const [citizens, setCitizens] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [visitorrole, setVisitorRole] = useState(localStorage.getItem('Role')); 
  const [newTax, setNewTax] = useState({
    id: null,
    name: '',
    amount_in_percentage: '',
    tier: '',
    monitoring_gov_id: '',
    paying_citizen_id: ''
  });


  // Fetch tax data on mount
  useEffect(() => {
    fetchTaxData();
    fetchGovernmentMonitors();
    fetchCitizens();
  }, []);

  const fetchTaxData = () => {
    fetch('http://localhost:5000/fetch_tax_data')
      .then((res) => res.json())
      .then((data) => {
        setTaxData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching tax data:', error);
        setLoading(false);
        toast.error('Error fetching tax data');
      });
  };

  const fetchGovernmentMonitors = () => {
    fetch('http://localhost:5000/fetch_government_monitors')
      .then((res) => res.json())
      .then((data) => {
        setGovernmentMonitors(data);
      })
      .catch((error) => {
        console.error('Error fetching government monitors:', error);
        toast.error('Error fetching government monitors');
      });
  };

  const fetchCitizens = () => {
    // Assuming you use this endpoint for a simple list of citizens (id and name)
    fetch('http://localhost:5000/fetch_citizen_data_for_agriculture')
      .then((res) => res.json())
      .then((data) => {
        setCitizens(data);
      })
      .catch((error) => {
        console.error('Error fetching citizens:', error);
        toast.error('Error fetching citizens');
      });
  };

  const openModal = (isEdit = false, data = null) => {
    setIsEditMode(isEdit);
    if (isEdit && data) {
      setNewTax({
        id: data.id,
        name: data.name,
        amount_in_percentage: data.amount_in_percentage,
        tier: data.tier,
        monitoring_gov_id: data.monitoring_gov_id,
        paying_citizen_id: data.paying_citizen_id
      });
    } else {
      setNewTax({
        id: null,
        name: '',
        amount_in_percentage: '',
        tier: '',
        monitoring_gov_id: '',
        paying_citizen_id: ''
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
    setNewTax({
      ...newTax,
      [name]: value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation: all fields must be filled
    if (
      !newTax.name ||
      !newTax.amount_in_percentage ||
      !newTax.tier ||
      !newTax.monitoring_gov_id ||
      !newTax.paying_citizen_id
    ) {
      toast.error('Please fill in all fields');
      return;
    }

    const endpoint = isEditMode
      ? `http://localhost:5000/update_tax_data/${newTax.id}`
      : 'http://localhost:5000/add_tax_data';
    const method = isEditMode ? 'PUT' : 'POST';

    fetch(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTax),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isEditMode) {
          setTaxData(taxData.map(item => item.id === newTax.id ? data.data : item));
          toast.success('Tax data updated successfully!');
        } else {
          setTaxData([...taxData, data.data]);
          toast.success('Tax data added successfully!');
        }
        closeModal();
      })
      .catch((error) => {
        console.error('Error submitting tax data:', error);
        toast.error('Error submitting tax data');
      });
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this tax data?')) {
      fetch(`http://localhost:5000/delete_tax_data/${id}`, {
        method: 'DELETE',
      })
        .then((res) => res.json())
        .then((data) => {
          setTaxData(taxData.filter(item => item.id !== id));
          toast.success('Tax data deleted successfully!');
        })
        .catch((error) => {
          console.error('Error deleting tax data:', error);
          toast.error('Error deleting tax data!');
        });
    }
  };

  // Filter tax data based on search query (by tax name)
  const filteredData = taxData.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-lg font-semibold text-gray-700">Tax Data</h1>
        {visitorrole === 'admin' && (
        <button
          className="py-2 px-4 bg-black font-medium text-sm text-white rounded-lg"
          onClick={() => openModal(false)}
        >
          Add Data
        </button>
        )}
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
            placeholder="Search by tax name..." 
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
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Amount (%)</th>
                <th className="px-6 py-3">Tier</th>
                <th className="px-6 py-3">Gov ID</th>
                <th className="px-6 py-3">Gov Name</th>
                <th className="px-6 py-3">Citizen ID</th>
                <th className="px-6 py-3">Citizen Name</th>
                {visitorrole === 'admin' && <th className="px-6 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="9" className="text-center py-4">
                    No data found.
                  </td>
                </tr>
              ) : (
                filteredData.map((data) => (
                  <tr key={data.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{data.id}</td>
                    <td className="px-6 py-4">{data.name}</td>
                    <td className="px-6 py-4">{data.amount_in_percentage}</td>
                    <td className="px-6 py-4">{data.tier}</td>
                    <td className="px-6 py-4">{data.monitoring_gov_id}</td>
                    <td className="px-6 py-4">{data.monitoring_gov_name}</td>
                    <td className="px-6 py-4">{data.paying_citizen_id}</td>
                    <td className="px-6 py-4">{data.paying_citizen_name}</td>
                    {visitorrole === 'admin' && (
                    <td className="px-6 py-4">
                      <button
                        onClick={() => openModal(true, data)}
                        className="text-blue-600 hover:text-blue-800 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(data.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
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
                {isEditMode ? 'Edit Tax Data' : 'Add Tax Data'}
              </h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Tax Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={newTax.name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              {/* Amount in Percentage */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (%)</label>
                <input
                  type="number"
                  name="amount_in_percentage"
                  value={newTax.amount_in_percentage}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              {/* Tier */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Tier</label>
                <input
                  type="text"
                  name="tier"
                  value={newTax.tier}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              {/* Government Monitor Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Government Monitor
                </label>
                <select
                  name="monitoring_gov_id"
                  value={newTax.monitoring_gov_id}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Government Monitor</option>
                  {governmentMonitors.map((monitor) => (
                    <option key={monitor.id} value={monitor.id}>
                      {monitor.name}
                    </option>
                  ))}
                </select>
              </div>
              {/* Citizen Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Citizen
                </label>
                <select
                  name="paying_citizen_id"
                  value={newTax.paying_citizen_id}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                >
                  <option value="">Select Citizen</option>
                  {citizens.map((citizen) => (
                    <option key={citizen.id} value={citizen.id}>
                      {citizen.name}
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
