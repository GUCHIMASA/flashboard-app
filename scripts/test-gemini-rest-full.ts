import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local'), override: true });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('GEMINI_API_KEY is not set');
    return;
  }

  console.log('Testing with API Key:', apiKey.substring(0, 5) + '...' + apiKey.substring(apiKey.length - 4));
  
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: "Hello, this is a test prompt to check if the API is working" }]
        }]
      })
    });
    
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('Raw Response:', text);
  } catch (err) {
    console.error('Fetch Error:', err);
  }
}

testGemini();
