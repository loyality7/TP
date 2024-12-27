export const formatTimeSpent = (minutes) => {
  if (!minutes || minutes < 0) return "Less than a minute";
  if (minutes < 1) return "Less than a minute";
  if (minutes < 60) return `${minutes} min`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return hours === 1 ? "1 hour" : `${hours} hours`;
  }
  
  return hours === 1 
    ? `1 hour ${remainingMinutes} min`
    : `${hours} hours ${remainingMinutes} min`;
}; 