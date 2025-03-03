import React, { useState, useEffect } from "react";

export default function SchemeBenefits() {
  const [schemeData, setSchemeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schemeMap, setSchememap] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  let panchayatName;

  let ind = 0;

  const role = localStorage.getItem("Role");

  useEffect(() => {
    const userId = localStorage.getItem("Userid");
    console.log(userId);
    fetch(`http://localhost:5000/fetch_panchayat_by_member/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        panchayatName = data.panchayat_name;
      });
    let url = "http://localhost:5000/fetch_schemes_benefit";

    if (role === "citizen" && userId) {
      console.log("mooda");
      url = `http://localhost:5000/fetch_schemes_benefit_citizen/${userId}`;
    }
    console.log(url);

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        console.log("Role:", role);
        if (role === "panchayat") {
          console.log("panchayat:", panchayatName);
          data = data.filter((elem) => {
            return elem.panchayat_name === panchayatName;
          });
        }
        setSchemeData(data);
        setFilteredData(data);
        const newSchememap = {};
        if (data) {
          data.forEach((item) => {
            if (newSchememap[item.scheme_name]) {
              newSchememap[item.scheme_name] += 1;
            } else {
              newSchememap[item.scheme_name] = 1;
            }
          });
        }
        setSchememap(newSchememap);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching schemes benefit data:", error);
        setLoading(false);
      });
  }, []);

  const handleSearch = () => {
    const filteredD = schemeData.filter((item) => {
      const query = searchQuery.toLowerCase();
      return item.panchayat_name.toLowerCase().includes(query);
    });
    const newSchememap = {};
    filteredD.forEach((item) => {
      if (newSchememap[item.scheme_name]) {
        newSchememap[item.scheme_name] += 1;
      } else {
        newSchememap[item.scheme_name] = 1;
      }
    });
    setSchememap(newSchememap);
    setFilteredData(filteredD);
  };

  return (
    <div className="p-6 flex-1 bg-white rounded-lg h-full overflow-y-auto">
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row text-center justify-center space-x-2">
          <span className="text-lg font-semibold text-gray-700">
            Scheme Benefits Data
          </span>
        </div>
      </div>
      <div className="mt-4">
        {role !== "citizen" && role !== "panchayat" && (
          <div className="relative flex items-center space-x-2">
            <input
              type="text"
              className="w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by Panchayat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button
              className="py-2 px-4 bg-[#000000] font-medium text-sm text-white rounded-lg cursor-pointer"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
        )}

        {role !== "citizen" && role !== "panchayat" && role !== "admin" && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Scheme Benefits Summary
            </h2>
            <div className="relative overflow-x-auto sm:rounded-lg">
              <table className="w-full text-sm text-left rtl:text-right text-gray-500">
                <thead className="text-base text-gray-700 bg-gray-50 border-b">
                  <tr>
                    <th scope="col" className="px-6 py-3">
                      Scheme Name
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Number of Citizens Benefitted
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(schemeMap).length === 0 ? (
                    <tr>
                      <td colSpan="2" className="text-center py-4">
                        No schemes found.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(schemeMap).map(
                      ([schemeName, numberOfCitizens]) => (
                        <tr
                          key={schemeName}
                          className="cursor-pointer hover:bg-gray-50"
                        >
                          <td className="px-6 py-4">{schemeName}</td>
                          <td className="px-6 py-4">{numberOfCitizens}</td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="relative overflow-x-auto sm:rounded-lg">
          <table className="w-full text-sm text-left rtl:text-right text-gray-500">
            <thead className="text-base text-gray-700 bg-gray-50 border-b">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Scheme ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Scheme Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Scheme Government ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Scheme Description
                </th>
                <th scope="col" className="px-6 py-3">
                  Citizen ID
                </th>
                <th scope="col" className="px-6 py-3">
                  Citizen Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Panchayat Name
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    Loading...
                  </td>
                </tr>
              ) : schemeData.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-4">
                    No data found.
                  </td>
                </tr>
              ) : (
                filteredData.map((scheme) => (
                  <tr key={ind++} className="cursor-pointer hover:bg-gray-50">
                    <td className="px-6 py-4">{scheme.scheme_id}</td>
                    <td className="px-6 py-4">{scheme.scheme_name}</td>
                    <td className="px-6 py-4">{scheme.scheme_gov_id}</td>
                    <td className="px-6 py-4">{scheme.scheme_description}</td>
                    <td className="px-6 py-4">{scheme.citizen_id}</td>
                    <td className="px-6 py-4">{scheme.citizen_name}</td>
                    <td className="px-6 py-4">{scheme.panchayat_name}</td>
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
