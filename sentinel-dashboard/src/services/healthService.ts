import axios from "axios";

export interface HealthStatus {
  service: string;
  version: string;
  status: "UP" | "DOWN";
  kafka?: string;
  mongodb?: string;
  postgresql?: string;
}

const check = async (url: string): Promise<HealthStatus> => {
  try {
    const { data } = await axios.get<HealthStatus>(url, { timeout: 5000 });
    return data;
  } catch (err) {
    return { service: url, version: "unknown", status: "DOWN" };
  }
};

export const healthService = {
  async getHealth() {
    const [api, logger, fraud, notification] = await Promise.all([
      check("http://localhost:8000/health"),
      check("http://localhost:8001/health"),
      check("http://localhost:8002/health"),
      check("http://localhost:8003/health")
    ]);
    
    return { api, logger, fraud, notification };
  }
};
