import React, { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";

export default function AssetList() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [panchayat, setPanchayat] = useState([]);
  const [visitorrole, setVisitorrole] = useState(localStorage.getItem("Role"));
  const [visitorid, setVisitorid] = useState(localStorage.getItem("Userid"));
  const [visitorpanchayat, setVisitorpanchayat] = useState('');
  const [newAsset, setNewAsset] = useState({
    id: null,
    asset_name: "",
    asset_address: {
      street: "",
      city: "",
      state: ""
    },
    asset_value: "",
    asset_date: "",
    panchayat_id: ""
  });

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
        setPanchayat(data);
        console.log(data);
      })
      .catch((error) => {
        toast.error('Error fetching panchayat data:', error);
      });
  }, []);

  useEffect(() => {

    fetch("http://localhost:5000/fetch_assets")
      .then((res) => res.json())
      .then((data) => {
        setAssets(data);
        console.log(data);
        if(visitorrole === 'panchayat'){
          setAssets(data.filter((item) => item.panchayat_id === visitorpanchayat));
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching assets:", error);
        setLoading(false);
      });
  }, [visitorrole, visitorpanchayat]);

  const openModal = (isEdit = false, data = null) => {
    setIsEditMode(isEdit);
    if (isEdit && data) {
      setNewAsset({
        id: data.asset_id,
        asset_name: data.asset_name,
        asset_address: {
          street: data.asset_address.street || "",
          city: data.asset_address.city || "",
          state: data.asset_address.state || ""
        },
        asset_value: data.asset_value,
        asset_date: data.asset_date,
        panchayat_id: data.panchayat_id
      });
    } else {
      setNewAsset({
        id: null,
        asset_name: "",
        asset_address: {
          street: "",
          city: "",
          state: ""
        },
        asset_value: "",
        asset_date: "",
        panchayat_id: ""
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
    // Check if we are updating a nested asset_address field
    if (name.startsWith("asset_address.")) {
      const addressField = name.split(".")[1];
      setNewAsset({
        ...newAsset,
        asset_address: {
          ...newAsset.asset_address,
          [addressField]: value
        }
      });
    } else {
      setNewAsset({
        ...newAsset,
        [name]: value
      });
    }
  };

  const validateForm = () => {
    const { asset_name, asset_address, asset_value, asset_date, panchayat_id } = newAsset;
    if (!asset_name || !asset_address.street || !asset_address.city || !asset_address.state ||
        !asset_value || !asset_date || !panchayat_id) {
      toast.error("All fields are required!");
      return false;
    }
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const endpoint = isEditMode
      ? `http://localhost:5000/update_asset/${newAsset.id}`
      : "http://localhost:5000/add_asset";
    const method = isEditMode ? "PUT" : "POST";

    if(visitorrole === 'panchayat'){
      newAsset.panchayat_id = visitorpanchayat;
    }

    fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newAsset),
    })
      .then((res) => res.json())
      .then((data) => {
        if (isEditMode) {
          setAssets(
            assets.map((item) =>
              item.asset_id === newAsset.id ? data.data : item
            )
          );
          toast.success("Asset updated successfully!");
        } else {
          setAssets([...assets, data.data]);
          toast.success("Asset added successfully!");
        }
        closeModal();
      })
      .catch((error) => {
        console.error(`Error ${isEditMode ? "updating" : "adding"} asset:`, error);
        toast.error(`Error ${isEditMode ? "updating" : "adding"} asset!`);
      });
  };

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this asset?")) {
      fetch(`http://localhost:5000/delete_asset/${id}`, {
        method: "DELETE",
      })
        .then((res) => res.json())
        .then(() => {
          setAssets(assets.filter((item) => item.asset_id !== id));
          toast.success("Asset deleted successfully!");
        })
        .catch((error) => {
          console.error("Error deleting asset:", error);
          toast.error("Error deleting asset!");
        });
    }
  };

  const filteredAssets = assets.filter((item) =>
    item.asset_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <span className="text-lg font-semibold text-gray-700">Assets</span>
        <button
          className="py-2 px-4 bg-black font-medium text-sm text-white rounded-lg"
          onClick={() => openModal(false)}
        >
          Add Asset
        </button>
      </div>

      {/* Search Bar */}

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
            placeholder="Search by asset name..." 
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
                <th className="px-6 py-3">Asset ID</th>
                <th className="px-6 py-3">Asset Name</th>
                <th className="px-6 py-3">Address</th>
                <th className="px-6 py-3">Value</th>
                <th className="px-6 py-3">Acquisition Date</th>
                {visitorrole !== 'panchayat' && (
                  <>
                <th className="px-6 py-3">Panchayat ID</th>
                <th className="px-6 py-3">Panchayat Name</th>
                  </>
                )}
                <th className="px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : filteredAssets.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    No assets found.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => (
                  <tr
                    key={asset.asset_id}
                    className="cursor-pointer hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">{asset.asset_id}</td>
                    <td className="px-6 py-4">{asset.asset_name}</td>
                    <td className="px-6 py-4">
                      {asset.asset_address.street}, {asset.asset_address.city},{" "}
                      {asset.asset_address.state}
                    </td>
                    <td className="px-6 py-4">{asset.asset_value}</td>
                    <td className="px-6 py-4">{asset.asset_date}</td>
                    {visitorrole !== 'panchayat' && (
                      <>
                      <td className="px-6 py-4">{asset.panchayat_id}</td>
                      <td className="px-6 py-4">{asset.panchayat_name}</td>
                      </>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal(true, asset)}
                          className="font-medium text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(asset.asset_id)}
                          className="font-medium text-red-600 hover:text-red-800"
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
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {isEditMode ? "Edit Asset" : "Add Asset"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              {/* Asset Name */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Name
                </label>
                <input
                  type="text"
                  name="asset_name"
                  value={newAsset.asset_name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              {/* Address Fields */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  name="asset_address.street"
                  placeholder="Street"
                  value={newAsset.asset_address.street}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md mb-2"
                  required
                />
                <input
                  type="text"
                  name="asset_address.city"
                  placeholder="City"
                  value={newAsset.asset_address.city}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md mb-2"
                  required
                />
                <input
                  type="text"
                  name="asset_address.state"
                  placeholder="State"
                  value={newAsset.asset_address.state}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              {/* Asset Value */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Value
                </label>
                <input
                  type="number"
                  name="asset_value"
                  value={newAsset.asset_value}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              {/* Acquisition Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Acquisition Date
                </label>
                <input
                  type="date"
                  name="asset_date"
                  value={newAsset.asset_date}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              {/* Panchayat ID */}
              {visitorrole !== 'panchayat' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Panchayat ID
                </label>
                {/* <input
                  type="number"
                  name="panchayat_id"
                  value={newAsset.panchayat_id}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  required
                /> */}
                <select
                  name="panchayat_id"
                  className="w-full px-3 py-2 border rounded-lg"
                  value={newAsset.panchayat_id}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Owner</option>
                  {panchayat.map((citizen) => (
                    <option key={citizen.id} value={citizen.id}>
                      {citizen.name} (ID: {citizen.id})
                    </option>
                  ))}
                </select>
              </div>
              )}
              {/* Submit Button */}
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
                  {isEditMode ? "Update" : "Submit"}
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
