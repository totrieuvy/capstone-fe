import api from "../config/axios";

export interface HamsterProfile {
  id: string;
  name: string;
  color: string;
  dob: string;
  species: string;
  speciesId?: string; // May or may not be included in API response
  gender: "Male" | "Female";
  weight: number;
  profilePicture: string;
  healthNote: string;
}

export interface Species {
  id: string;
  speciesName: string;
}

export interface CreateHamsterPayload {
  name: string;
  color: string;
  dob: string;
  gender: "Male" | "Female";
  weight: number;
  speciesId: string;
  profilePicture: string;
  healthNote: string;
}

export interface UpdateHamsterPayload {
  name: string;
  color: string;
  dob: string;
  gender: "Male" | "Female";
  weight: number;
  profilePicture: string;
  healthNote: string;
  speciesId?: string;
}

export interface ChangeSpeciesPayload {
  hamsterId: string;
  speciesId: string;
}

export interface ChangeSpeciesResponse {
  code: number;
  message: string;
}

export class ProfileHamsterService {
  /**
   * Fetch list of hamster profiles
   */
  static async getProfiles(): Promise<HamsterProfile[]> {
    const { data } = await api.get("/api/hamster/profile-list");
    if (data.code === 200) {
      return data.data;
    }
    throw new Error("Failed to fetch hamster profiles");
  }

  /**
   * Fetch a single hamster profile by ID
   */
  static async getProfileById(hamsterId: string): Promise<HamsterProfile> {
    const { data } = await api.get(`/api/hamster/${hamsterId}`);
    if (data.code === 200) {
      return data.data;
    }
    throw new Error("Failed to fetch hamster profile");
  }

  /**
   * Fetch list of hamster species
   */
  static async getSpecies(): Promise<Species[]> {
    const { data } = await api.get("/api/species");
    if (data.code === 200) {
      return data.data;
    }
    throw new Error("Failed to fetch species list");
  }

  /**
   * Upload file and return the file URL
   */
  static async uploadFile(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    
    const { data } = await api.post("/api/file/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    
    if (data.code === 200) {
      return data.data;
    }
    throw new Error("File upload failed");
  }

  /**
   * Create a new hamster profile
   */
  static async createHamster(payload: CreateHamsterPayload): Promise<void> {
    const { data } = await api.post("/api/hamster", payload);
    if (data.code !== 200) {
      throw new Error("Failed to create hamster profile");
    }
  }

  /**
   * Create hamster with file upload (combines upload and create operations)
   */
  static async createHamsterWithFile(
    hamsterData: Omit<CreateHamsterPayload, "profilePicture">,
    file: File
  ): Promise<void> {
    // First upload the file
    const profilePictureUrl = await this.uploadFile(file);
    
    // Then create the hamster profile
    const payload: CreateHamsterPayload = {
      ...hamsterData,
      profilePicture: profilePictureUrl,
    };
    
    await this.createHamster(payload);
  }

  /**
   * Update an existing hamster profile
   */
  static async updateHamster(hamsterId: string, payload: UpdateHamsterPayload): Promise<void> {
    const { data } = await api.put(`/api/hamster/${hamsterId}`, payload);
    if (data.code !== 200) {
      throw new Error("Failed to update hamster profile");
    }
  }

  /**
   * Update hamster with file upload (combines upload and update operations)
   */
  static async updateHamsterWithFile(
    hamsterId: string,
    hamsterData: Omit<UpdateHamsterPayload, "profilePicture">,
    file: File
  ): Promise<void> {
    // First upload the file
    const profilePictureUrl = await this.uploadFile(file);
    
    // Then update the hamster profile
    const payload: UpdateHamsterPayload = {
      ...hamsterData,
      profilePicture: profilePictureUrl,
    };
    
    await this.updateHamster(hamsterId, payload);
  }

  /**
   * Change hamster species
   */
  static async changeSpecies(payload: ChangeSpeciesPayload): Promise<ChangeSpeciesResponse> {
    const { data } = await api.put("/api/hamster/change-species", payload);
    if (data.code !== 200) {
      throw new Error("Failed to change hamster species");
    }
    return data;
  }
}

export default ProfileHamsterService;