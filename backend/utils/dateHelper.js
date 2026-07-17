const date = new Date();

/**
 * Get current quarter in the format YYYY-QX (e.g. 2026-Q3)
 * @returns {string}
 */
function getCurrentQuarter() {
  const date = new Date();
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  const quarter = Math.floor(month / 3) + 1;
  return `${year}-Q${quarter}`;
}

module.exports = {
  getCurrentQuarter
};
