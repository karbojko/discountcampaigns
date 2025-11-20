// In-memory storage for campaigns (persists during function lifecycle)
let campaigns = [
  {
    id: "1",
    name: "Summer Sale 2025",
    description: "Get ready for summer with amazing discounts!",
    discount: 25,
    startDate: "2025-06-01",
    endDate: "2025-08-31",
    facilities: ["facility1", "facility2"],
    active: true
  },
  {
    id: "2",
    name: "Winter Clearance",
    description: "Clear out winter stock with huge savings",
    discount: 40,
    startDate: "2025-01-15",
    endDate: "2025-02-28",
    facilities: ["facility1"],
    active: false
  }
];

export default function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { method } = req;

  if (method === "GET") {
    return res.status(200).json(campaigns);
  }

  if (method === "POST") {
    const newCampaign = {
      id: Date.now().toString(),
      ...req.body,
    };
    campaigns.push(newCampaign);
    return res.status(201).json(newCampaign);
  }

  if (method === "PUT") {
    const id = req.query.id;
    const index = campaigns.findIndex(c => c.id === id);

    if (index === -1) return res.status(404).json({ message: "Not found" });

    campaigns[index] = { ...campaigns[index], ...req.body };
    return res.status(200).json(campaigns[index]);
  }

  if (method === "DELETE") {
    const id = req.query.id;
    const filtered = campaigns.filter(c => c.id !== id);
    campaigns = filtered;
    return res.status(200).json({ message: "Deleted" });
  }

  res.status(405).json({ message: "Method not allowed" });
}
