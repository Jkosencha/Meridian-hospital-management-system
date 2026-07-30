export function formatKsh(amount) {
  return `KSh ${Math.round(amount).toLocaleString()}`
}
