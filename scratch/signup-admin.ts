import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qwnycqjgrgygpivoybfx.supabase.co',
  'sb_publishable_Yu7rOCW2yvEYCRQUqI0Z1w_Vwcev5ek'
);

async function run() {
  console.log("Attempting to sign up csmcsd@gnits.ac.in on the new project...");
  const { data, error } = await supabase.auth.signUp({
    email: 'csmcsd@gnits.ac.in',
    password: 'csmcsd@1234',
  });
  
  if (error) {
    console.error("Sign up failed:", error.message);
  } else {
    console.log("Sign up succeeded!");
    console.log("User details:", data.user);
    if (data.session) {
      console.log("Session created successfully.");
    } else {
      console.log("Note: Email confirmation is likely still enabled on Supabase, so the user might need to be confirmed.");
    }
  }
}

run();
