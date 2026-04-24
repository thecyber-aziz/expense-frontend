// Quick debug to see what env variables are loaded
console.log('=== Firebase Environment Variables Debug ===');
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? 'Loaded ✓' : 'NOT LOADED ✗');
console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'Loaded ✓' : 'NOT LOADED ✗');
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'Loaded ✓' : 'NOT LOADED ✗');
console.log('VITE_FIREBASE_STORAGE_BUCKET:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ? 'Loaded ✓' : 'NOT LOADED ✗');
console.log('VITE_FIREBASE_MESSAGING_SENDER_ID:', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ? 'Loaded ✓' : 'NOT LOADED ✗');
console.log('VITE_FIREBASE_APP_ID:', import.meta.env.VITE_FIREBASE_APP_ID ? 'Loaded ✓' : 'NOT LOADED ✗');
console.log('==========================================');
