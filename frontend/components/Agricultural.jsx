import React, { useState, useEffect } from "react";

export default function Agricultural() {
  const [agricultureData, setAgricultureData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from the backend API endpoint
    fetch("http://localhost:5000/fetch_agriculture_data")
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
        setAgricultureData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching agricultural data:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">
            Agricultural Data
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
                  Address
                </th>
                <th scope="col" className="px-6 py-3">
                  Area in Hectares
                </th>
                <th scope="col" className="px-6 py-3">
                  Crops Grown
                </th>
                <th scope="col" className="px-6 py-3">
                  Owner ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Owner Name
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
              ) : agricultureData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-4">
                    No data found.
                  </td>
                </tr>
              ) : (
                agricultureData.map((data) => (
                  <tr key={data.id} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4">{data.id}</td>
                    <td className="px-6 py-4">
                      {data.address
                        ? `${data.address.street}, ${data.address.city}, ${data.address.zipcode}`
                        : "N/A"}
                    </td>
                    <td className="px-6 py-4">{data.area_in_hectares}</td>
                    <td className="px-6 py-4">
                      {Array.isArray(data.crops_grown)
                        ? data.crops_grown.join(", ")
                        : data.crops_grown}
                    </td>
                    <td className="px-6 py-4">{data.citizen_id}</td>
                    <td className="px-6 py-4">
                      {/* <span className='border p-1 rounded-lg' > */}
                      {data.citizen_name}
                      {/* </span> */}
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
