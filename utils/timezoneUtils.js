// Map timezones to measurement systems
const imperialTimezones = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
];

function getUnitSystem(timezone = "UTC") {
  return imperialTimezones.includes(timezone) ? "imperial" : "metric";
}

module.exports = {
  getUnitSystem,
};
