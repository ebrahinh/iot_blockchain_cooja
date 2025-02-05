import React from "react";
import {
  CDBSidebar,
  CDBSidebarContent,
  CDBSidebarFooter,
  CDBSidebarHeader,
  CDBSidebarMenu,
  CDBSidebarMenuItem,
} from "cdbreact";
import { NavLink } from "react-router-dom";

/**
 * Sidebar Component for IoT Security Dashboard
 */
const Sidebar = () => {
  return (
      <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
        <CDBSidebar textColor="#fff" backgroundColor="#333">
          {/* Sidebar Header */}
          <CDBSidebarHeader prefix={<i className="fa fa-bars fa-large"></i>}>
            <NavLink to="/" className="text-decoration-none" style={{ color: "inherit" }}>
              IoT Security Dashboard
            </NavLink>
          </CDBSidebarHeader>

          {/* Sidebar Navigation Content */}
          <CDBSidebarContent className="sidebar-content">
            <CDBSidebarMenu>
              <NavLink exact to="/module1" activeClassName="activeClicked">
                <CDBSidebarMenuItem icon="chart-pie">
                  Devices Availability & Performance
                </CDBSidebarMenuItem>
              </NavLink>
              <NavLink exact to="/module2" activeClassName="activeClicked">
                <CDBSidebarMenuItem icon="user-shield">
                  Security Incident Monitoring
                </CDBSidebarMenuItem>
              </NavLink>
              <NavLink exact to="/module3" activeClassName="activeClicked">
                <CDBSidebarMenuItem icon="cogs">
                  Maintenance Insights
                </CDBSidebarMenuItem>
              </NavLink>
              <NavLink exact to="/module4" activeClassName="activeClicked">
                <CDBSidebarMenuItem icon="tachometer-alt">
                  Efficiency Analysis: Coolant & Oil
                </CDBSidebarMenuItem>
              </NavLink>
              <NavLink exact to="/module5" activeClassName="activeClicked">
                <CDBSidebarMenuItem icon="boxes">
                  Asset & Inventory Management
                </CDBSidebarMenuItem>
              </NavLink>
            </CDBSidebarMenu>
          </CDBSidebarContent>

          {/* Sidebar Footer */}
          <CDBSidebarFooter style={{ textAlign: "center" }}>
            <div
                style={{
                  padding: "20px",
                  fontSize: "14px",
                  color: "#ccc",
                }}
            >
              IoT Security © {new Date().getFullYear()}
            </div>
          </CDBSidebarFooter>
        </CDBSidebar>
      </div>
  );
};

export default Sidebar;