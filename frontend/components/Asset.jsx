import React, { useState, useEffect } from "react";

export default function AssetList() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from the backend API endpoint
    fetch("http://localhost:5000/fetch_assets")
      .then((res) => res.json())
      .then((data) => {
        setAssets(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching assets:", error);
        setLoading(false);
      });
  }, []);

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">Assets</span>
        </div>
        <button className="py-2 px-4 bg-[#000000] font-medium text-sm text-white rounded-lg">
          Add Asset
        </button>
      </div>
      <div className="mt-4">
        <div className="relative overflow-x-auto sm:rounded-lg">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500">
            <thead className="text-base text-gray-700 bg-gray-50 border-b">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Asset ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Asset Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Address
                </th>
                <th scope="col" className="px-6 py-3">
                  Value
                </th>
                <th scope="col" className="px-6 py-3">
                  Acquisition Date
                </th>
                <th scope="col" className="px-6 py-3">
                  Panchayat ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Panchayat Name
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
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-4">
                    No assets found.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr
                    key={asset.asset_id}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">{asset.asset_id}</td>
                    <td className="px-6 py-4">{asset.asset_name}</td>
                    <td className="px-6 py-4">
                      {asset.asset_address.street} {asset.asset_address.city}
                      {asset.asset_address.state}
                    </td>
                    <td className="px-6 py-4">{asset.asset_value}</td>
                    <td className="px-6 py-4">{asset.asset_date}</td>
                    <td className="px-6 py-4">{asset.panchayat_id}</td>
                    <td className="px-6 py-4">{asset.panchayat_name}</td>
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
