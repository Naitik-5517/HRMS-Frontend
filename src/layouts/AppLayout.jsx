import React from "react";
import Header from "../components/header/Header";
import { ViewState } from "../utils/constants";
import { useAuth } from "../context/AuthContext";

const AppLayout = ({ children }) => {
  // Get user and permissions from context
  const { 
    user: currentUser, 
    // You can add more permission logic here if needed
  } = useAuth();

  return (
    <>
      <Header
        currentUser={currentUser}
        // Add more props as needed, or remove unused ones
      />

      {/* page content */}
      <main className="p-6 bg-slate-50">
        {children}
      </main>
    </>
  );
};

export default AppLayout;