const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function listStaff() {
    const { data, error } = await supabase.from('staff').select('*');
    if (error) {
        console.error('Error fetching staff:', error);
        return;
    }
    console.log('Staff List:', JSON.stringify(data, null, 2));
}

listStaff();
