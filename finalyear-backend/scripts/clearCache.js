// Clear metrics cache and force fresh data fetch
import { getAllTeamMetricsData } from '../src/services/userSheetsService.js';

async function clearCacheAndRefresh() {
  try {
    console.log('🔄 Clearing metrics cache and fetching fresh data...');
    
    // Force fresh data by calling with no cache
    const SPREADSHEET_ID = '1vl5gTB6OkLVSvYvnCfLwHW_FyjKUinkiKxav-5zaA80';
    const freshData = await getAllTeamMetricsData(SPREADSHEET_ID, true); // true = force refresh
    
    console.log('✅ Fresh data retrieved successfully!');
    console.log('📊 Team Members:', freshData.teamMembers);
    console.log('📈 Aggregated KPIs:', freshData.aggregatedKPIs);
    
    // Show individual KPIs sample
    if (freshData.individualKPIs) {
      console.log('\n👤 Individual KPIs Sample:');
      const firstMember = Object.keys(freshData.individualKPIs)[0];
      if (firstMember) {
        console.log(`${firstMember}:`, freshData.individualKPIs[firstMember]);
      }
    }
    
    console.log('\n🎉 Cache cleared and data refreshed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing cache:', error);
    process.exit(1);
  }
}

clearCacheAndRefresh();