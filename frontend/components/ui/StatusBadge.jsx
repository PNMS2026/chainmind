"use client";

export default function StatusBadge({ status, type }) {
  let label = "Unknown";
  let badgeClass = "badge-neutral";
  let dotClass = "dot-neutral";

  if (type === "agent") {
    switch (Number(status)) {
      case 0:
        label = "Idle";
        badgeClass = "badge-neutral";
        dotClass = "dot-neutral";
        break;
      case 1:
        label = "Active";
        badgeClass = "badge-success";
        dotClass = "dot-success dot-pulse";
        break;
      case 2:
        label = "Paused";
        badgeClass = "badge-warning";
        dotClass = "dot-warning";
        break;
      case 3:
        label = "Retired";
        badgeClass = "badge-danger";
        dotClass = "dot-danger";
        break;
    }
  } else if (type === "task") {
    switch (Number(status)) {
      case 0:
        label = "Open";
        badgeClass = "badge-info";
        dotClass = "dot-info";
        break;
      case 1:
        label = "Assigned";
        badgeClass = "badge-warning";
        dotClass = "dot-warning dot-pulse";
        break;
      case 2:
        label = "Submitted";
        badgeClass = "badge-neutral";
        dotClass = "dot-neutral";
        break;
      case 3:
        label = "Verified";
        badgeClass = "badge-success";
        dotClass = "dot-success";
        break;
      case 4:
        label = "Disputed";
        badgeClass = "badge-danger";
        dotClass = "dot-danger";
        break;
    }
  }

  return (
    <span className={`badge ${badgeClass}`}>
      <span className={`dot ${dotClass}`}></span>
      {label}
    </span>
  );
}
