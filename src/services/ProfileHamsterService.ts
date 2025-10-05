import api from "../config/axios";

export interface HamsterProfile {
  id: string;
  name: string;
  color: string;
  dob: string;
  species: string;
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
}

export default ProfileHamsterService;