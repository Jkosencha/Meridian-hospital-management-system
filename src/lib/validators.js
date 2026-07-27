export function countDigits(value) {
  return (value.match(/\d/g) || []).length
}

export function normalizeGender(value) {
  return String(value || '').trim().toLowerCase() === 'female' ? 'Female' : 'Male'
}
