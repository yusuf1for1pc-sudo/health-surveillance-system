const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jkhkgviyxkmuayenohhd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraGtndml5eGttdWF5ZW5vaGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNTY2OTQsImV4cCI6MjA4NjYzMjY5NH0.WDZ4eAyxloZqsrnN_8Bt1VF8EdOpxZoZFRZeKIJT4aI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdmin() {
    const email = 'admin@tempest.com';
    const password = 'admin123';

    console.log(`Creating admin user: ${email}`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: 'platform_admin',
                full_name: 'Platform Administrator',
                phone: '9998887776'
            }
        }
    });

    if (error) {
        console.error('Error creating admin:', error.message);
    } else {
        console.log('Admin user created successfully:', data.user ? data.user.id : 'No user data returned (maybe email confirmation required?)');
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            console.log('User already exists.');
        }
    }
}

createAdmin();
