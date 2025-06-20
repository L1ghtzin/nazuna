const fs = require('fs');
const pathz = require('path');


const STATS_FILE = pathz.join(__dirname, '../../../database/commandStats.json');


function ensureStatsFile() {
  try {
    if (!fs.existsSync(STATS_FILE)) {
      const dir = pathz.dirname(STATS_FILE);
      
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      };
      
      const defaultStats = {
        commands: {},
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(STATS_FILE, JSON.stringify(defaultStats, null, 2));
      return defaultStats;
    };
    
    return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
  } catch (error) {
    console.error('Error ensuring stats file:', error);
    return { commands: {}, lastUpdated: new Date().toISOString() };
  };
};


function trackCommandUsage(command, userId) {
  try {
    const stats = ensureStatsFile();
    
    if (!stats.commands[command]) {
      stats.commands[command] = {
        count: 0,
        users: {},
        lastUsed: new Date().toISOString()
      };
    };

    stats.commands[command].count++;

    if (!stats.commands[command].users[userId]) {
      stats.commands[command].users[userId] = 0;
    };
    
    stats.commands[command].users[userId]++;

    stats.commands[command].lastUsed = new Date().toISOString();
    stats.lastUpdated = new Date().toISOString();

    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    return true;
  } catch (error) {
    console.error('Error tracking command usage:', error);
    return false;
  };
};


function getMostUsedCommands(limit = 10) {
  try {
    const stats = ensureStatsFile();

    const commandsArray = Object.entries(stats.commands).map(([name, data]) => ({
      name,
      count: data.count,
      lastUsed: data.lastUsed,
      uniqueUsers: Object.keys(data.users).length
    }));

    commandsArray.sort((a, b) => b.count - a.count);

    return commandsArray.slice(0, limit);
  } catch (error) {
    console.error('Error getting most used commands:', error);
    return [];
  };
};


function getCommandStats(command) {
  try {
    const stats = ensureStatsFile();
    
    if (!stats.commands[command]) {
      return null;
    };
    
    const commandStats = stats.commands[command];

    const topUsers = Object.entries(commandStats.users)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      name: command,
      count: commandStats.count,
      lastUsed: commandStats.lastUsed,
      uniqueUsers: Object.keys(commandStats.users).length,
      topUsers
    };
  } catch (error) {
    console.error('Error getting command stats:', error);
    return null;
  }
}


module.exports = {
  trackCommandUsage,
  getMostUsedCommands,
  getCommandStats
}; 