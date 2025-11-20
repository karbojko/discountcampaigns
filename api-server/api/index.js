import { get, put } from '@vercel/blob';

const BLOB_PATH = 'discount-db/db.json';

async function readDB() {
  try {
    const blob = await get(BLOB_PATH, {
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
    
    if (!blob) {
      return [];
    }
    
    const text = await blob.text();
    return JSON.parse(text);
  } catch (error) {
    // If file doesn't exist or error occurs, return empty array
    console.error('Error reading from Blob Storage:', error);
    return [];
  }
}

async function writeDB(data) {
  try {
    await put(BLOB_PATH, JSON.stringify(data, null, 2), {
      access: 'public',
      contentType: 'application/json',
      token: process.env.BLOB_READ_WRITE_TOKEN
    });
  } catch (error) {
    console.error('Error writing to Blob Storage:', error);
    throw error;
  }
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;

  try {
    if (method === "GET") {
      const campaigns = await readDB();
      return res.status(200).json(campaigns);
    }

    if (method === "POST") {
      const campaigns = await readDB();
      const newCampaign = {
        id: Date.now().toString(),
        ...req.body,
      };
      campaigns.push(newCampaign);
      await writeDB(campaigns);
      return res.status(201).json(newCampaign);
    }

    if (method === "PUT") {
      const campaigns = await readDB();
      const id = req.query.id;
      const index = campaigns.findIndex(c => c.id === id);

      if (index === -1) return res.status(404).json({ message: "Not found" });

      campaigns[index] = { ...campaigns[index], ...req.body };
      await writeDB(campaigns);
      return res.status(200).json(campaigns[index]);
    }

    if (method === "DELETE") {
      const campaigns = await readDB();
      const id = req.query.id;
      const filtered = campaigns.filter(c => c.id !== id);
      await writeDB(filtered);
      return res.status(200).json({ message: "Deleted" });
    }

    res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
