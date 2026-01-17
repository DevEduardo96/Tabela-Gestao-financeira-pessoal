import { createClient } from "@supabase/supabase-js";

// Substitua pelos seus dados do painel do Supabase
const SUPABASE_URL = "https://bdkvvbinoyrsimsmsylc.supabase.co";
const SUPABASE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJka3Z2Ymlub3lyc2ltc21zeWxjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NjQzMjAsImV4cCI6MjA4NDI0MDMyMH0.-ETBFmeI4lfV-imauHQkb0Zk4bMKbMA-mA6bmIjXWRA";

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
