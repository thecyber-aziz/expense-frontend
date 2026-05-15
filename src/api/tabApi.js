// frontend/src/api/tabApi.js
// ✅ FIXED - Tab API with proper error handling and logging

import { apiCall } from './config.js';

/**
 * Get all tabs for the current user
 */
export const getTabs = async () => {
  try {
    console.log('📂 Fetching all tabs...');
    const response = await apiCall('/tabs', {
      method: 'GET',
    });
    console.log(`✅ Tabs fetched: ${response.data?.length || 0} tabs`);
    return response;
  } catch (error) {
    console.error('❌ Failed to fetch tabs:', error);
    throw error;
  }
};

/**
 * Create a new tab
 */
export const createTab = async (tabName, tabId = null) => {
  try {
    console.log(`📁 Creating tab: ${tabName}${tabId ? ` (${tabId})` : ''}`);
    const response = await apiCall('/tabs', {
      method: 'POST',
      body: JSON.stringify({ 
        name: tabName,
        ...(tabId && { tabId }) // Include tabId if provided
      }),
    });
    console.log('✅ Tab created successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to create tab:', error);
    throw error;
  }
};

/**
 * Rename a tab
 */
export const renameTab = async (tabId, newName) => {
  try {
    console.log(`✏️ Renaming tab: ${tabId} to ${newName}`);
    const response = await apiCall(`/tabs/${tabId}`, {
      method: 'PUT',
      body: JSON.stringify({ name: newName }),
    });
    console.log('✅ Tab renamed successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to rename tab:', error);
    throw error;
  }
};

/**
 * Delete a tab
 */
export const deleteTab = async (tabId) => {
  try {
    console.log(`🗑️ Deleting tab: ${tabId}`);
    const response = await apiCall(`/tabs/${tabId}`, {
      method: 'DELETE',
    });
    console.log('✅ Tab deleted successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to delete tab:', error);
    throw error;
  }
};

/**
 * Update tab balance (cash and online)
 */
export const updateBalance = async (tabId, cashBalance, onlineBalance) => {
  try {
    console.log(`💰 Updating balance for tab: ${tabId}`);
    const response = await apiCall(`/tabs/${tabId}/balance`, {
      method: 'PUT',
      body: JSON.stringify({ 
        cashBalance: cashBalance || 0,
        onlineBalance: onlineBalance || 0
      }),
    });
    console.log('✅ Balance updated successfully');
    return response;
  } catch (error) {
    console.error('❌ Failed to update balance:', error);
    throw error;
  }
};

/**
 * Get tab details
 */
export const getTabDetails = async (tabId) => {
  try {
    console.log(`📂 Fetching tab details: ${tabId}`);
    const response = await apiCall(`/tabs/${tabId}`, {
      method: 'GET',
    });
    console.log('✅ Tab details fetched');
    return response;
  } catch (error) {
    console.error('❌ Failed to fetch tab details:', error);
    throw error;
  }
};