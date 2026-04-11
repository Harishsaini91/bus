import React from "react";

export default function LiveStatusBadge({ status }) {
  return (
    <span
      style={{
        color: status === "live" ? "green" : "gray",
        fontWeight: "bold"
      }}
    >
      {status}
    </span>
  );
}