import Sidebar from "../components/Sidebar.jsx";
import { Routes, Route } from "react-router-dom";
import Agricultural from "../components/Agricultural.jsx";
import Panchayat from "../components/Panchayat.jsx";
import Citizen from "../components/Citizen.jsx";
import PanchayatMembers from "../components/PanchayatMembers.jsx";
import Assets from "../components/Asset.jsx";
import SchemeBenefits from "../components/Schemebenefits.jsx";
import FamilyMemeber from "../components/FamilyMemeber.jsx";
import GovtMonitors from "../components/GovtMonitors.jsx";
import GovtMonitorsUser from "../components/GovtMonUser.jsx";
import Scheme from "../components/Scheme.jsx";
import Services from "../components/Services.jsx";
import Tax from "../components/Tax.jsx";
import Users from "../components/Users.jsx";

export default function Dashboard() {
  return (
    <div className="flex max-h-screen min-w-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 p-6 pl-1">
        <Routes>
          <Route path="agricultural_data" element={<Agricultural />} />
          <Route path="panchayat" element={<Panchayat />} />
          <Route path="citizen" element={<Citizen />} />
          <Route
            path="citizen_member_of_panchayat"
            element={<PanchayatMembers />}
          />
          <Route path="asset" element={<Assets />} />
          <Route
            path="citizen_benefits_from_schemes"
            element={<SchemeBenefits />}
          />
          <Route path="family_member" element={<FamilyMemeber />} />
          <Route path="government_monitor" element={<GovtMonitors />} />
          <Route
            path="government_monitor_user"
            element={<GovtMonitorsUser />}
          />
          <Route path="scheme" element={<Scheme />} />
          <Route path="service" element={<Services />} />
          <Route path="tax" element={<Tax />} />
          <Route path="users" element={<Users />} />
        </Routes>
      </div>
    </div>
  );
}
