import Sidebar from "../src/Components/Sidebar.jsx"
import { Routes, Route } from 'react-router-dom';
import Agricultural from "../src/Components/Agricultural.jsx";
import Panchayat from "../src/Components/Panchayat.jsx";
import Citizen from "../src/Components/Citizen.jsx";
import PanchayatMembers from "../src/Components/PanchayatMembers.jsx";
import Assets from "../src/Components/Asset.jsx";
import SchemeBenefits from "../src/Components/Schemebenefits.jsx";
import FamilyMemeber from "../src/Components/FamilyMemeber.jsx";
import GovtMonitors from "../src/Components/GovtMonitors.jsx";
import GovtMonitorsUser from "../src/Components/GovtMonUser.jsx";
import Scheme from "../src/Components/Scheme.jsx";
import Services from "../src/Components/Services.jsx";
import Tax from "../src/Components/Tax.jsx";
import Users from "../src/Components/Users.jsx";

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
            <Route path="citizen_member_of_panchayat" element={<PanchayatMembers />}/>
            <Route path="asset" element={<Assets />} />
            <Route path="citizen_benefits_from_schemes" element={<SchemeBenefits />} />
            <Route path="family_member" element={<FamilyMemeber />} />
            <Route path="government_monitor" element={<GovtMonitors />} />
            <Route path="government_monitor_user" element={<GovtMonitorsUser />} />
            <Route path="scheme" element={<Scheme />} />
            <Route path="service" element={<Services />} />
            <Route path="tax" element={<Tax />} />
            <Route path="users" element={<Users />} />
        </Routes>
      </div>
    </div>
    )
}