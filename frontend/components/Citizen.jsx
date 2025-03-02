import React, { useState, useEffect } from 'react';

export default function Citizen() {
  const [citizendata, setCitizenData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from the backend API endpoint
    fetch('http://localhost:5000/fetch_citizen_data')
      .then((res) => res.json())
      .then((data) => {
        setCitizenData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching agricultural data:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">
            Citizens Data
          </span>
        </div>
        <button
          className="py-2 px-4 bg-[#000000] font-medium text-sm text-white rounded-lg"
        >


          Add Data
        </button>
      </div>
      <div className="mt-4">
        <div className="relative overflow-x-auto sm:rounded-lg">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500">
            <thead className="text-base text-gray-700 bg-gray-50 border-b">
{/*  id |     name      | date_of_birth | sex  | occupation | qualification |                           address                            |      phone_number       | income 
 */}
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

              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : citizendata.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    No data found.
                  </td>
                </tr>
              ) : (
                citizendata.map((data) => (
                  <tr key={data.id} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4">{data.id}</td>
                    <td className="px-6 py-4">{data.name}</td>
                    <td className="px-6 py-4">{data.date_of_birth}</td>
                    <td className="px-6 py-4">{data.sex}</td>
                    <td className="px-6 py-4">{data.occupation}</td>
                    <td className="px-6 py-4">{data.qualification}</td>
                    <td className="px-6 py-4">{data.address}</td>
                    <td className="px-6 py-4">{data.phone_number}</td>
                    <td className="px-6 py-4">{data.income}</td>
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
