import axios from "axios";

export interface ProfileStatusResponse {
  id: string;
  status: string;
}

const client = axios.create({ baseURL: "http://localhost:8000" }); // api-service is on 8000

export const adminService = {
  async freezeAccount(userId: string): Promise<ProfileStatusResponse> {
    const { data } = await client.post<ProfileStatusResponse>(`/admin/profiles/${userId}/freeze`);
    return data;
  },
  
  async unfreezeAccount(userId: string): Promise<ProfileStatusResponse> {
    const { data } = await client.post<ProfileStatusResponse>(`/admin/profiles/${userId}/unfreeze`);
    return data;
  },
  
  async getAccountStatus(userId: string): Promise<ProfileStatusResponse> {
    const { data } = await client.get<ProfileStatusResponse>(`/admin/profiles/${userId}/status`);
    return data;
  }
};
