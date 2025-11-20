import { put, list, del } from "@vercel/blob";
import { v4 as uuid } from "uuid";

export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  const { method } = req;

  try {
    // GET — zwraca listę kampanii
    if (method === "GET") {
      const blobs = await list({ prefix: "campaigns/" });

      const campaigns = await Promise.all(
        blobs.blobs.map(async (file) => {
          const response = await fetch(file.url);
          return await response.json();
        })
      );

      return res.status(200).json(campaigns);
    }

    // POST — dodaje nową kampanię
    if (method === "POST") {
      const id = uuid();
      const data = { id, ...req.body };

      const blobName = `campaigns/${id}.json`;
      await put(blobName, JSON.stringify(data), { access: "public" });

      return res.status(201).json(data);
    }

    // PUT — aktualizuje istniejącą kampanię
    if (method === "PUT") {
      const id = req.query.id;
      const blobName = `campaigns/${id}.json`;

      // Pobierz istniejący rekord
      const blobs = await list({ prefix: `campaigns/${id}.json` });
      if (blobs.blobs.length === 0) {
        return res.status(404).json({ message: "Not found" });
      }

      const existing = await fetch(blobs.blobs[0].url);
      const existingData = await existing.json();
      const updated = { ...existingData, ...req.body };

      // Nadpisz blob
      await put(blobName, JSON.stringify(updated), { access: "public" });

      return res.status(200).json(updated);
    }

    // DELETE — usuwa kampanię
    if (method === "DELETE") {
      const id = req.query.id;
      await del(`campaigns/${id}.json`);

      return res.status(200).json({ message: "Deleted" });
    }

    res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
}
