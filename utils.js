// Format RAP for display (e.g., 270000 -> "270K", 7500000 -> "7.5M")
function formatRap(rap) {
  const n = parseInt(rap, 10) || 0;
  if (n >= 1000000) {
    return (n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1) + "M";
  }
  if (n >= 1000) {
    return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + "K";
  }
  return n.toString();
}

// Format price for display
function formatPrice(price) {
  return "$" + (parseFloat(price) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 });
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
