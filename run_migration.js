require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // <-- Fixed env name

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function runMigration() {
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', 'ek_hizmetler.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    try {
        const { data, error } = await supabase.rpc('invoke_sql', { sql_query: sql }); // Trying common RPC name or we will just use REST if we had postgres-meta
        if (error) {
            console.log("No RPC found for raw sql. Let's try direct REST fetching or just fail gracefully and ask user to run it.", error);
            // We can't easily run arbitrary SQL via supabase-js without an RPC or the postgres conn string.
            process.exit(1);
        }
        console.log("Success with RPC");
    } catch (e) {
        console.error("Execution error", e);
        process.exit(1);
    }
}

runMigration();
