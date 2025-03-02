import React, { useState, useEffect } from 'react';

export default function Services() {
  const [servicesData, setServicesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch data from the backend API endpoint
    fetch('http://localhost:5000/fetch_services')
      .then((res) => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then((data) => {
        setServicesData(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching services data:', error);
        setError(error.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">
            Services Data
          </span>
        </div>
        <button
          className="py-2 px-4 bg-[#000000] font-medium text-sm text-white rounded-lg"
        >
          Add Data
        </button>
      </div>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          Error: {error}
        </div>
      )}
      
      <div className="mt-4">
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
                servicesData.map((data) => (
                  <tr key={data.service_id} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4">{data.service_id}</td>
                    <td className="px-6 py-4">{data.service_name}</td>
                    <td className="px-6 py-4">{data.service_type}</td>
                    <td className="px-6 py-4">{data.service_issued_date}</td>
                    <td className="px-6 py-4">{data.service_expiry_date}</td>
                    <td className="px-6 py-4">{data.citizen_id}</td>
                    <td className="px-6 py-4">{data.citizen_name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
