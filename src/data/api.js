// API functions for discount campaigns

const API_BASE_URL = 'https://discount-backend-one.vercel.app/api';

export const getCampaigns = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}`);
    if (!response.ok) {
      throw new Error('Failed to fetch campaigns');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
};

export const getCampaignById = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch campaign with id ${id}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching campaign ${id}:`, error);
    throw error;
  }
};

export const createCampaign = async (data) => {
  try {
    const response = await fetch(`${API_BASE_URL}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to create campaign');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
};

export const updateCampaign = async (id, data) => {
  try {
    const response = await fetch(`${API_BASE_URL}?id=${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update campaign with id ${id}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error updating campaign ${id}:`, error);
    throw error;
  }
};

export const deleteCampaign = async (id) => {
  try {
    const response = await fetch(`${API_BASE_URL}?id=${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete campaign with id ${id}`);
    }
    return true;
  } catch (error) {
    console.error(`Error deleting campaign ${id}:`, error);
    throw error;
  }
};
