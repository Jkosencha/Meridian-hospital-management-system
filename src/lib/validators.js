export function countDigits(value) {
  return (value.match(/\d/g) || []).length
}
