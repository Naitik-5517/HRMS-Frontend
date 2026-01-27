// Utility hook to get current user and role
import { useContext } from "react";
import { UserContext } from "../context/UserContext";

export function useCurrentUserRole() {
  const { currentUser } = useContext(UserContext);
  return currentUser?.role || null;
}
