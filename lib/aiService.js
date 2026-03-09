// lib/aiService.js - QuickInsights Only (Simplified)
// No external API calls, pure database insights

import { supabase } from './supabase';

console.log('📊 QuickInsights Mode - No external AI APIs');

// Simple database-based insights only
export const generateBusinessInsights = async (supabaseClient) => {
  try {
    console.log('🧠 Generating quick business insights from database...');
    return generateQuickInsights(supabaseClient);
  } catch (error) {
    console.error('QuickInsights Error:', error);
    return { success: false, error: error.message, insights: [] };
  }
};

export const generateQuickInsights = async (supabaseClient) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Fetch today's sales and low stock items
    const [{ data: todaySales }, { data: lowStock }] = await Promise.all([
      supabaseClient.from('sales').select('total_amount').gte('created_at', today),
      supabaseClient.from('products').select('name, quantity').lte('quantity', 5).limit(3)
    ]);

    const insights = [];

    // Insight 1: Sales Status
    if (!todaySales || todaySales.length === 0) {
      insights.push({
        type: 'info',
        icon: 'information-circle',
        color: '#1a73e8',
        message: 'No sales recorded today. Consider running a promotion or checking your marketing channels.',
        priority: 'medium'
      });
    } else {
      const totalSales = todaySales.reduce((sum, sale) => sum + (sale.total_amount || 0), 0);
      insights.push({
        type: 'success',
        icon: 'trending-up',
        color: '#4caf50',
        message: `Great! You've made $${totalSales.toFixed(2)} in sales today.`,
        priority: 'medium'
      });
    }

    // Insight 2: Stock Alert
    if (lowStock && lowStock.length > 0) {
      insights.push({
        type: 'stock_alert',
        icon: 'warning',
        color: '#f57c00',
        message: `Critical: ${lowStock[0].name} has only ${lowStock[0].quantity} units left. Reorder soon to avoid stockouts.`,
        priority: 'high'
      });
    } else {
      insights.push({
        type: 'success',
        icon: 'checkmark-circle',
        color: '#4caf50',
        message: 'All stock levels are healthy!',
        priority: 'medium'
      });
    }

    // Insight 3: Operational Status
    insights.push({
      type: 'info',
      icon: 'information-circle',
      color: '#1a73e8',
      message: 'Check the dashboard for detailed reports and analytics.',
      priority: 'medium'
    });

    return { success: true, insights };

  } catch (error) {
    console.error('QuickInsights Error:', error);
    return { 
      success: false, 
      error: error.message, 
      insights: [] 
    };
  }
};