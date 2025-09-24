import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl: string = "https://srjijlbensrbezagtfih.supabase.co";
const supabaseKey: string =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyamlqbGJlbnNyYmV6YWd0ZmloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2OTA3MDcsImV4cCI6MjA3NDI2NjcwN30.4NksgYozimgkMVjJ5n61gVPCVdZWvFKVHPdMc-QlovM"; // anon public key

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);
