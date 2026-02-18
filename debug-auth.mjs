import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jkhkgviyxkmuayenohhd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpraGtndml5eGttdWF5ZW5vaGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEwNTY2OTQsImV4cCI6MjA4NjYzMjY5NH0.WDZ4eAyxloZqsrnN_8Bt1VF8EdOpxZoZFRZeKIJT4aI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAuth() {
    console.log('--- Testing Auth Debug 2 ---');

    const testEmail = `debug_user_${Date.now()}@tempest.demo`;
    console.log(`\n1. Attempting SignUp for ${testEmail}...`);
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: 'Password123!',
    });

    if (signUpError) {
        console.error('SERVER ERROR during SignUp:', signUpError);
    } else {
        console.log('SignUp Success!');
        console.log('User ID:', signUpData.user?.id);
        console.log('Session exists?', !!signUpData.session);
    }

    // 2. Try SignIn with the NEW USER
    console.log(`\n2. Attempting SignIn for ${testEmail}...`);
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: 'Password123!',
    });

    if (signInError) {
        console.log('SignIn Failed (Expected if email not confirmed):');
        console.log('Status:', signInError.status);
        console.log('Message:', signInError.message);
    } else {
        console.log('SignIn Success for New User!');
        console.log('Session:', !!signInData.session);
    }

    // 3. Try SignIn for Doctor from SQL Seed
    console.log('\n3. Attempting SignIn for doctor_demo@tempest.demo (SQL Seeded)...');
    const { error: doctorError } = await supabase.auth.signInWithPassword({
        email: 'doctor_demo@tempest.demo',
        password: 'Demo@123',
    });
    if (doctorError) {
        console.log('Doctor Login Status:', doctorError.status);
        console.log('Doctor Login Message:', doctorError.message);
    } else {
        console.log('Doctor Login Success!');
    }
}

testAuth();
