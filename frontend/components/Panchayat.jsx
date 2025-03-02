import React, { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function Panchayat() {
  const [panchayatdata, setPanchayatData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newPanchayat, setNewPanchayat] = useState({
    address: '',
    income: '',
    expenditure: '',
    environmental_data: ''
  });

  useEffect(() => {
    // Fetch data from the backend API endpoint
    fetch('http://localhost:5000/fetch_panchayat_data')
      .then((res) => res.json())
      .then((data) => {
        setPanchayatData(data);
        setLoading(false);
      })
      .catch((error) => {
        // console.error('Error fetching panchayat data:', error);
        toast.error('Error fetching panchayat data:', error);
        setLoading(false);
      });
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    // Reset form fields
    setNewPanchayat({
      address: '',
      income: '',
      expenditure: '',
      environmental_data: ''
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNewPanchayat({
      ...newPanchayat,
      [name]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate form fields
    if (!newPanchayat.address || !newPanchayat.income || !newPanchayat.expenditure || !newPanchayat.environmental_data) {
      toast.error('All fields are required!');
      return;
    }
    if(isNaN(newPanchayat.income) || isNaN(newPanchayat.expenditure)){
      toast.error('Income and Expenditure should be numbers!');
      return;
    }
    
    // Send data to backend
    fetch('http://localhost:5000/add_panchayat_data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newPanchayat),
    })
      .then((res) => res.json())
      .then((data) => {
        // Update the local state with the new data
        console.log(data);  
        setPanchayatData([...panchayatdata, data.data]);
        toast.success('Panchayat data added successfully!');
        closeModal();
      })
      .catch((error) => {
        console.error('Error adding panchayat data:', error);
        toast.error('Error adding panchayat data:', error);
      });
  };

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">
            Panchayat Data
          </span>
        </div>
        <button
          className="py-2 px-4 bg-[#000000] font-medium text-sm text-white rounded-lg cursor-pointer"
          onClick={openModal}
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
                  ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Address
                </th>
                <th scope="col" className="px-6 py-3">
                  Income
                </th>
                <th scope="col" className="px-6 py-3">
                  Expenditure
                </th>
                <th scope="col" className="px-6 py-3">
                  Environmental Data
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : panchayatdata.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No data found.
                  </td>
                </tr>
              ) : (
                panchayatdata.map((data) => (
                  <tr key={data.id} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4">{data.id}</td>
                    <td className="px-6 py-4">{data.address}</td>
                    <td className="px-6 py-4">{data.income}</td>
                    <td className="px-6 py-4">{data.expenditure}</td>
                    <td className="px-6 py-4">{data.environmental_data}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Panchayat Data</h2>
              <button 
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={newPanchayat.address}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              
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
                <label htmlFor="environmental_data" className="block text-sm font-medium text-gray-700 mb-1">
                  Environmental Data
                </label>
                <textarea
                  id="environmental_data"
                  name="environmental_data"
                  value={newPanchayat.environmental_data}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  rows="3"
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
                  Submit
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