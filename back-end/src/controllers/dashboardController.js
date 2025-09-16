export const getDashboardData = (req, res) => {
  // Example dashboard data
  const data = {
    usersCount: 10,
    activeChats: 5,
    botsOnline: 2,
    revenue: 1200
  };
  res.json(data);
};
