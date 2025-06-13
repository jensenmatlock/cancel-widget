import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sdhhujiktuqldbbeczyy.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkaGh1amlrdHVxbGRiYmVjenl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNzQyMjEsImV4cCI6MjA2NDY1MDIyMX0.bYqQhptKU6-QjC_8YY_ieirpj-kaT3wLTNklPb-hYlM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
