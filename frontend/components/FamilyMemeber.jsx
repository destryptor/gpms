import React, { useState, useEffect } from 'react';

export default function FamilyMember() {
  const [familyMemberData, setFamilyMemberData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from the backend API endpoint
    fetch('http://localhost:5000/fetch_family_member')
      .then((res) => res.json())
      .then((data) => {
        setFamilyMemberData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching family member data:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">
            Family Data
          </span>
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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : familyMemberData.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No data found.
                  </td>
                </tr>
              ) : (
                familyMemberData.map((data, index) => (
                  <tr key={index} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4">{data.citizen_id}</td>
                    <td className="px-6 py-4">{data.citizen_name}</td>
                    <td className="px-6 py-4">{data.family_member_id}</td>
                    <td className="px-6 py-4">{data.family_member_name}</td>
                    <td className="px-6 py-4">{data.relationship}</td>
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