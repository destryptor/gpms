import { useEffect } from "react";
import { useState } from "react";
import { Link,NavLink, useNavigate } from "react-router-dom";

const navItems = [
    { name: "Agricultural Data", to: "/dashboard/agricultural_data", icon: "bxs-data" },
    { name: "Asset", to: "/dashboard/asset", icon: "bxs-data" },
    { name: "Citizen Benefits From Schemes", to: "/dashboard/citizen_benefits_from_schemes", icon: "bxs-data" },
    { name: "Citizen Member Of Panchayat", to: "/dashboard/citizen_member_of_panchayat", icon: "bxs-data" },
    { name: "Citizens", to: "/dashboard/citizen", icon: "bxs-data" },
    { name: "Family Member", to: "/dashboard/family_member", icon: "bxs-data" },
    { name: "Government Monitor", to: "/dashboard/government_monitor", icon: "bxs-data" },
    { name: "Government Monitor User", to: "/dashboard/government_monitor_user", icon: "bxs-data" },
    { name: "Panchayat", to: "/dashboard/panchayat", icon: "bxs-data" },
    { name: "Scheme", to: "/dashboard/scheme", icon: "bxs-data" },
    { name: "Service", to: "/dashboard/service", icon: "bxs-data" },
    { name: "Tax", to: "/dashboard/tax", icon: "bxs-data" },
    { name: "Users", to: "/dashboard/users", icon: "bxs-data" },
];

const citizenItems = [
    { name: "Citizen", to: "/dashboard/citizen", icon: "bxs-data" },
    { name: "Family Member", to: "/dashboard/family_member", icon: "bxs-data" },
    { name: "Citizen Benefits From Schemes", to: "/dashboard/citizen_benefits_from_schemes", icon: "bxs-data" },
];

const panchayatItems = [
    { name: "Panchayat", to: "/dashboard/panchayat", icon: "bxs-data" },
    { name: "Government Monitor", to: "/dashboard/government_monitor", icon: "bxs-data" },
    { name: "Government Monitor User", to: "/dashboard/government_monitor_user", icon: "bxs-data" },
    { name: "Scheme", to: "/dashboard/scheme", icon: "bxs-data" },
    { name: "Service", to: "/dashboard/service", icon: "bxs-data" },
    { name: "Tax", to: "/dashboard/tax", icon: "bxs-data" },
    { name: "Asset", to: "/dashboard/asset", icon: "bxs-data" },
    { name: "Agricultural Data", to: "/dashboard/agricultural_data", icon: "bxs-data" },
];



<i class='bx '></i>

// public | agricultural_data             | table | 22CS30032
// public | asset                         | table | 22CS30032
// public | citizen                       | table | 22CS30032
// public | citizen_benefits_from_schemes | table | 22CS30032
// public | citizen_member_of_panchayat   | table | 22CS30032
// public | citizen_user                  | table | 22CS30032
// public | family_member                 | table | 22CS30032
// public | government_monitor            | table | 22CS30032
// public | government_monitor_user       | table | 22CS30032
// public | panchayat                     | table | 22CS30032
// public | scheme                        | table | 22CS30032
// public | service                       | table | 22CS30032
// public | tax                           | table | 22CS30032
// public | users                         | table | 22CS30032

const Sidebar = () => {
    const [visitorrole, setVisitorrole] = useState("citizen");
    const [table, setTable] = useState(navItems);

    useEffect(() => {
        const role = localStorage.getItem("Role");
        setVisitorrole(role);
    }, []);

    useEffect(() => {
        if (visitorrole === "citizen") {
            setTable(citizenItems);
        } else if (visitorrole === "panchayat") {
            setTable(panchayatItems);
        } else {
            setTable(navItems);
        }
    }, [visitorrole]);   


    return (
        <>

            <div className="w-64 h-screen  flex flex-col bg-gray-100">
                {/* Header */}
                <div className="p-4  flex flex-row justify-center items-center space-x-2">
                    {/* <img src="/logo192.png" alt="" className='h-8 w-8'/> */}
                    <h1 className="text-lg font-semibold text-center text-gray-700">
                        GPMS
                    </h1>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 p-2 space-y-1 overflow-auto no-scrollbar">
                    {table.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center px-3 py-2 rounded-md text-sm font-medium transition ${isActive
                                    ? "bg-white text-black font-semibold"
                                    : "text-gray-600 hover:bg-gray-100"
                                }`
                            }
                        >
                            <i className={`bx ${item.icon} text-xl mr-3`}></i>
                            <span className="">
                                {item.name}
                            </span>
                        </NavLink>
                    ))}
                </nav>


                <div className="p-4 ">
                    <NavLink
                        to="/dashboard/update"
                        className={({ isActive }) =>
                            `flex items-center px-3 py-2 rounded-md text-sm font-medium transition ${isActive
                                ? "bg-gray-200 text-black font-semibold"
                                : "text-gray-600 hover:bg-gray-100"
                            }`
                        }
                    >
                        <i className={`bx bxs-edit-location text-xl mr-3`}></i>
                        Update
                    </NavLink>

                    <NavLink
                        to="/login"
                        className={({ isActive }) =>
                            `flex items-center px-3 py-2 rounded-md text-sm font-medium transition ${isActive
                                ? "bg-gray-200 text-black font-semibold"
                                : "text-gray-600 hover:bg-gray-100"
                            }`
                        }
                    >
                        <i className={`bx bx-log-out text-xl mr-3`}></i>
                        logout
                    </NavLink>

                </div>
            </div>
        </>
    );
};

export default Sidebar;