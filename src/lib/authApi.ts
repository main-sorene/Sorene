import { API_BASE_URL, apiRequest } from "./queryClient";

export interface SendOTPResponse {
  expires_in: number;
  message: string;
  success: boolean;
}

export interface VerifyOTPResponse {
  email: string;
  message: string;
  success: boolean;
  token?: string;
}

export interface ProfileData {
  core: {
    ambiguity_tolerance: string;
    autonomy_need: string;
    collaboration_mode: string;
    description?: {
      ambiguity_tolerance: string;
      autonomy_need: string;
      collaboration_mode: string;
      execution_bias: string;
      exploration_bias: string;
      financial_pressure: string;
      ownership_drive: string;
      primary_motivation: string;
      readiness_level: string;
      risk_emotional: string;
      risk_financial: string;
      structure_preference: string;
      time_availability: string;
    };
    execution_bias: string;
    exploration_bias: string;
    financial_pressure: string;
    ownership_drive: string;
    primary_motivation: string;
    readiness_level: string;
    risk_emotional: string;
    risk_financial: string;
    structure_preference: string;
    time_availability: string;
  };
  energy: {
    drainers: string[];
    givers: string[];
    pattern: string[];
  };
  identity: {
    archetype: string[];
    motivation_driver: string[];
  };
  risk_profile: {
    risk_examples: string[];
    uncertainty_style: string[];
  };
  strength_profile: {
    growth_edges: string[];
    strengths: string[];
  };
  values: {
    constraints: string[];
    core_values: string[];
    ethical: string[];
    lifestyle: string[];
    non_negotiables: string[];
  };
  work_style: {
    collaboration_style: string[];
    decision_style: string[];
    readiness_mode: string[];
  };
}

export interface ProfileResponse {
  profile: ProfileData;
  status: string;
  user_id: string;
}

export interface BioData {
  age: number;
  birthday: string;
  email: string;
  name: string;
  occupation: string;
  sex: string;
  user_id: string;
}

export interface BioResponse {
  profile: unknown;
  status: string;
  user_id: string;
}

export const authApi = {
  sendOTP: async (email: string): Promise<SendOTPResponse> => {
    const res = await apiRequest(
      "POST",
      `${API_BASE_URL}/auth/email/send-otp`,
      {
        email,
      },
    );
    return (await res.json()) as SendOTPResponse;
  },

  verifyOTP: async (email: string, otp: string): Promise<VerifyOTPResponse> => {
    const res = await apiRequest(
      "POST",
      `${API_BASE_URL}/auth/email/verify-otp`,
      {
        email,
        otp,
      },
    );
    return (await res.json()) as VerifyOTPResponse;
  },

  updateProfileBio: async (data: BioData): Promise<BioResponse> => {
    const res = await apiRequest("POST", `${API_BASE_URL}/profile/bio`, data);
    return (await res.json()) as BioResponse;
  },

  getProfile: async (user_id: string): Promise<ProfileResponse> => {
    const res = await apiRequest(
      "GET",
      `${API_BASE_URL}/profile?user_id=${user_id}`,
    );
    return (await res.json()) as ProfileResponse;
  },

};
