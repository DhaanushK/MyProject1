import { sheets } from './googleSheets.js';

// Cache metrics data for 5 minutes
let metricsCache = {
  data: null,
  timestamp: null
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

export async function getAllTeamMetricsData(sheetId, forceRefresh = false) {
  try {
    // Check cache first (5 minute TTL) unless force refresh
    const cacheAge = Date.now() - metricsCache.timestamp;
    if (!forceRefresh && metricsCache.data && cacheAge < CACHE_TTL) {
      console.log('Returning cached metrics data');
      return metricsCache.data;
    }

    console.log('Cache miss - fetching fresh metrics data');
    console.log('Using spreadsheet ID:', sheetId);
    
    // Set a timeout for the entire operation
    const timeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Google Sheets operation timed out')), 25000)
    );
    
    if (!sheetId) {
      throw new Error('Spreadsheet ID is required');
    }

    // Race between the sheets operation and timeout
    let spreadsheet;
    try {
      spreadsheet = await Promise.race([
        sheets.spreadsheets.get({
          spreadsheetId: sheetId,
        }),
        timeout
      ]);
    } catch (error) {
      console.error('Error getting spreadsheet:', error);
      if (error.message === 'Google Sheets operation timed out') {
        // Return cached data if available, even if expired
        if (metricsCache.data) {
          console.log('Returning expired cache data due to timeout');
          return metricsCache.data;
        }
      }
      throw new Error(`Failed to access spreadsheet: ${error.message}`);
    }

    if (!spreadsheet.data || !spreadsheet.data.sheets) {
      throw new Error('Invalid spreadsheet structure');
    }

    // Get all team member sheets (excluding default sheets and templates)
    const allUserSheets = spreadsheet.data.sheets.filter(sheet => {
      const title = sheet.properties.title.toLowerCase();
      return title !== 'sheet1' && 
             !title.includes('template') && 
             !title.includes('example') &&
             title.trim() !== '';
    });

    console.log('Found user sheets:', allUserSheets.map(s => s.properties.title));

    const allMetrics = [];

    // Fetch data from each user sheet
    for (const userSheet of allUserSheets) {
      try {
        console.log(`Fetching data from sheet: ${userSheet.properties.title}`);
        const res = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: `${userSheet.properties.title}!A2:I`,
        });

        const rows = res.data.values || [];
        console.log(`Found ${rows.length} rows in ${userSheet.properties.title}`);
        
        const userMetrics = rows.map(row => {
          const [
            date,
            name,
            email,
            ticketsAssigned,
            ticketsResolved,
            slaBreaches,
            reopenedTickets,
            clientInteractions,
            remarks
          ] = row;

          return {
            date,
            name: name || userSheet.properties.title, // Use sheet name if name field is empty
            email,
            sheetName: userSheet.properties.title, // Add sheet name for reference
            totalTasks: parseInt(ticketsAssigned, 10) || 0,
            completed: parseInt(ticketsResolved, 10) || 0,
            pending: (parseInt(ticketsAssigned, 10) || 0) - (parseInt(ticketsResolved, 10) || 0),
            late: parseInt(slaBreaches, 10) || 0,
            reopened: parseInt(reopenedTickets, 10) || 0,
            clientInteractions: parseInt(clientInteractions, 10) || 0,
            notes: remarks || ""
          };
        });

        allMetrics.push(...userMetrics);
        console.log(`Added ${userMetrics.length} metrics from ${userSheet.properties.title}`);
      } catch (error) {
        console.error(`Error fetching data for sheet ${userSheet.properties.title}:`, error);
        // Continue with other sheets even if one fails
      }
    }

    console.log(`Total metrics collected: ${allMetrics.length}`);
    
    // Simple count by sheet name using for loop
    const sheetCounts = {};
    for (let i = 0; i < allMetrics.length; i++) {
      const metric = allMetrics[i];
      sheetCounts[metric.sheetName] = (sheetCounts[metric.sheetName] || 0) + 1;
    }
    console.log('Metrics by sheet name:', sheetCounts);

    // Process and format the data
    const teamData = {
      totalMetrics: allMetrics.length,
      teamMembers: [...new Set(allMetrics.map(metric => metric.sheetName))],
      userMetrics: {},
      individualKPIs: {}
    };

    // Group metrics by team member using for loop
    for (let i = 0; i < allMetrics.length; i++) {
      const metric = allMetrics[i];
      const memberName = metric.sheetName;
      
      if (!teamData.userMetrics[memberName]) {
        teamData.userMetrics[memberName] = [];
      }
      teamData.userMetrics[memberName].push(metric);

      // Calculate individual KPIs
      if (!teamData.individualKPIs[memberName]) {
        teamData.individualKPIs[memberName] = {
          totalTasks: 0,
          completedTasks: 0,
          pendingTasks: 0,
          lateTasks: 0,
          totalClientInteractions: 0,
          completionRate: 0,
          efficiency: 0
        };
      }

      const kpi = teamData.individualKPIs[memberName];
      kpi.totalTasks += metric.totalTasks || 0;
      kpi.completedTasks += metric.completed || 0;
      kpi.pendingTasks += metric.pending || 0;
      kpi.lateTasks += metric.late || 0;
      kpi.totalClientInteractions += metric.interactions || 0;
    }

    // Calculate individual completion rates and efficiency for each member
    for (const memberName in teamData.individualKPIs) {
      const kpi = teamData.individualKPIs[memberName];
      kpi.completionRate = kpi.totalTasks > 0 ? Math.round((kpi.completedTasks / kpi.totalTasks) * 100) : 0;
      kpi.efficiency = (kpi.totalTasks - kpi.pendingTasks) > 0 ? 
        parseFloat((kpi.completedTasks / (kpi.totalTasks - kpi.pendingTasks)).toFixed(2)) : 0;
    }

    // Calculate aggregated KPIs using simple loop instead of reduce
    const aggregatedKPIs = {
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      lateTasks: 0,
      totalClientInteractions: 0
    };

    // Simple loop to avoid reduce() errors
    for (const memberName in teamData.individualKPIs) {
      const kpi = teamData.individualKPIs[memberName];
      aggregatedKPIs.totalTasks += kpi.totalTasks || 0;
      aggregatedKPIs.completedTasks += kpi.completedTasks || 0;
      aggregatedKPIs.pendingTasks += kpi.pendingTasks || 0;
      aggregatedKPIs.lateTasks += kpi.lateTasks || 0;
      aggregatedKPIs.totalClientInteractions += kpi.totalClientInteractions || 0;
    }

    // Add derived KPIs
    aggregatedKPIs.completionRate = Math.round((aggregatedKPIs.completedTasks / aggregatedKPIs.totalTasks) * 100);
    aggregatedKPIs.efficiency = parseFloat((aggregatedKPIs.completedTasks / (aggregatedKPIs.totalTasks - aggregatedKPIs.pendingTasks)).toFixed(2));

    teamData.aggregatedKPIs = aggregatedKPIs;

    // Update cache with the processed data
    metricsCache.data = teamData;
    metricsCache.timestamp = Date.now();
    console.log('Updated metrics cache');

    console.log('=== RETURNING TEAM DATA ===');
    console.log('Type:', typeof teamData);
    console.log('Keys:', Object.keys(teamData));
    console.log('individualKPIs keys:', Object.keys(teamData.individualKPIs || {}));
    
    return teamData;
  } catch (error) {
    console.error("Error fetching all team metrics:", error);
    throw error;
  }
}

export async function getUserMetricsData(sheetId, userName) {
  try {
    console.log('Attempting to fetch metrics for user:', userName);
    console.log('Using spreadsheet ID:', sheetId);
    
    if (!sheetId) {
      throw new Error('Spreadsheet ID is required');
    }
    
    if (!userName) {
      throw new Error('User name is required');
    }

    // First get all sheets in the spreadsheet
    console.log('Attempting to access spreadsheet with ID:', sheetId);
    
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
    }).catch(error => {
      console.error('Error getting spreadsheet:', error);
      throw new Error(`Failed to access spreadsheet: ${error.message}`);
    });

    if (!spreadsheet.data || !spreadsheet.data.sheets) {
      console.error('Invalid spreadsheet response:', spreadsheet);
      throw new Error('Invalid spreadsheet structure');
    }

    console.log(`Searching for sheet for user: ${userName}`);

    // Log all available sheets first
    const availableSheets = spreadsheet.data.sheets.map(s => s.properties.title);
    console.log('All available sheets:', availableSheets);
    
    // Try to find the most appropriate sheet for the user
    let userSheet = null;
    
    // First try: Exact match
    userSheet = spreadsheet.data.sheets.find(sheet => 
      sheet.properties.title === userName
    );
    
    // Second try: Case-insensitive match
    if (!userSheet) {
      userSheet = spreadsheet.data.sheets.find(sheet => 
        sheet.properties.title.toLowerCase() === userName.toLowerCase()
      );
    }
    
    // Third try: Partial match
    if (!userSheet) {
      userSheet = spreadsheet.data.sheets.find(sheet => {
        const sheetTitle = sheet.properties.title.toLowerCase();
        const searchName = userName.toLowerCase();
        return sheetTitle.includes(searchName) || searchName.includes(sheetTitle);
      });
    }
    
    // If still no match, try matching individual parts of the name
    if (!userSheet) {
      const nameParts = userName.toLowerCase().split(' ');
      userSheet = spreadsheet.data.sheets.find(sheet => {
        const sheetTitle = sheet.properties.title.toLowerCase();
        return nameParts.some(part => sheetTitle.includes(part));
      });
    }
    
    console.log('User sheet found:', userSheet ? userSheet.properties.title : 'None');

    if (!userSheet) {
      throw new Error(`No sheet found for user: ${userName}. Please ensure a sheet exists with the user's name.`);
    }
    
    console.log(`Found sheet: ${userSheet.properties.title} for user: ${userName}`);

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${userSheet.properties.title}!A2:I`,
    });

    const rows = res.data.values || [];

    return rows.map(row => {
      // Match the columns from your sheet
      const [
        date,
        name,
        email,
        ticketsAssigned,
        ticketsResolved,
        slaBreaches,
        reopenedTickets,
        clientInteractions,
        remarks
      ] = row;

      return {
        date,
        name,
        email,
        totalTasks: parseInt(ticketsAssigned, 10) || 0,
        completed: parseInt(ticketsResolved, 10) || 0,
        pending: parseInt(ticketsAssigned, 10) - parseInt(ticketsResolved, 10) || 0,
        late: parseInt(slaBreaches, 10) || 0,
        reopened: parseInt(reopenedTickets, 10) || 0,
        interactions: parseInt(clientInteractions, 10) || 0,
        notes: remarks || ""
      };
    });
  } catch (error) {
    console.error("Error fetching user metrics:", error);
    throw error;
  }
}
