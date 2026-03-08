const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkStaffSchema() {
    const { data, error } = await supabase.from('staff').select('*').limit(1);
    if (error) {
        console.error('Error fetching staff:', error);
        return;
    }
    console.log('Staff Sample:', JSON.stringify(data[0], null, 2));
}

checkStaffSchema();
