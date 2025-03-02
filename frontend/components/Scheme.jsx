import React, { useState, useEffect } from "react";

export default function Scheme() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from the backend API endpoint
    fetch("http://localhost:5000/fetch_schemes")
      .then((res) => res.json())
      .then((data) => {
        setSchemes(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching scheme data:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">
            Scheme Data
          </span>
        </div>
        <button className="py-2 px-4 bg-[#000000] font-medium text-sm text-white rounded-lg">
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
                  Scheme Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Scheme Description
                </th>
                <th scope="col" className="px-6 py-3">
                  Gov. Monitor ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Gov. Monitor Name
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
              ) : schemes.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4">
                    No data found.
                  </td>
                </tr>
              ) : (
                schemes.map((scheme) => (
                  <tr
                    key={scheme.scheme_id}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">{scheme.scheme_id}</td>
                    <td className="px-6 py-4">{scheme.scheme_name}</td>
                    <td className="px-6 py-4">{scheme.scheme_description}</td>
                    <td className="px-6 py-4">
                      {scheme.government_monitor_id}
                    </td>
                    <td className="px-6 py-4">
                      {scheme.government_monitor_name}
                    </td>
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
