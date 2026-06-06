/**
 * Truncate an Ethereum address (e.g. 0x1234...5678)
 */
export function truncateAddress(address) {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

/**
 * Get display name of agent type
 */
export function getAgentTypeName(typeId) {
  const types = {
    0: "Sentiment Analysis",
    1: "Price Prediction",
    2: "Risk Assessment",
    3: "Data Oracle",
    4: "Custom Agent"
  };
  return types[typeId] || "Unknown";
}

/**
 * Get display name of agent status
 */
export function getAgentStatusName(statusId) {
  const statuses = {
    0: "Inactive",
    1: "Active",
    2: "Suspended"
  };
  return statuses[statusId] || "Unknown";
}

/**
 * Get display name of task type
 */
export function getTaskTypeName(typeId) {
  const types = {
    0: "Sentiment Analysis",
    1: "Price Prediction",
    2: "Risk Assessment",
    3: "Data Query",
    4: "Custom Workload"
  };
  return types[typeId] || "Unknown";
}

/**
 * Get display name of task status
 */
export function getTaskStatusName(statusId) {
  const statuses = {
    0: "Open",
    1: "Assigned",
    2: "Submitted",
    3: "Completed",
    4: "Disputed"
  };
  return statuses[statusId] || "Unknown";
}

/**
 * Format timestamp to time ago (e.g., "5 mins ago")
 */
export function timeAgo(timestamp) {
  if (!timestamp) return "";
  const s = Math.floor((Date.now() - new Date(Number(timestamp) * 1000).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
