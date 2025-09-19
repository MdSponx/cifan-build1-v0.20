// Test script to resolve Google Maps URLs to actual coordinates
const https = require('https');
const { URL } = require('url');

const venueUrls = [
  'https://maps.app.goo.gl/cxMLzFkjeu9fqX4t7', // Stage Zone & Market
  'https://maps.app.goo.gl/cxMLzFkjeu9fqX4t8', // EXPO Zone
  'https://maps.app.goo.gl/fzULD32UgoeKK6B16', // Major Theatre 7 & IMAX
  'https://maps.app.goo.gl/mb3EyMUu7TTDEwJc6'  // Anusarn
];

async function resolveGoogleMapsUrl(shortUrl) {
  return new Promise((resolve, reject) => {
    const options = {
      method: 'HEAD',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(shortUrl, options, (res) => {
      const location = res.headers.location;
      console.log(`\n${shortUrl}`);
      console.log(`Redirects to: ${location}`);
      
      if (location) {
        // Try to extract coordinates from the redirected URL
        const coordPatterns = [
          /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
          /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
          /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
          /!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/
        ];
        
        let coords = null;
        for (const pattern of coordPatterns) {
          const match = location.match(pattern);
          if (match) {
            coords = {
              lat: parseFloat(match[1]),
              lng: parseFloat(match[2])
            };
            break;
          }
        }
        
        if (coords) {
          console.log(`Coordinates: ${coords.lat}, ${coords.lng}`);
        } else {
          console.log('Could not extract coordinates from URL');
        }
        
        resolve({ url: shortUrl, redirectUrl: location, coords });
      } else {
        resolve({ url: shortUrl, redirectUrl: null, coords: null });
      }
    });

    req.on('error', (err) => {
      console.error(`Error resolving ${shortUrl}:`, err.message);
      resolve({ url: shortUrl, error: err.message });
    });

    req.end();
  });
}

async function testAllUrls() {
  console.log('Testing Google Maps URLs to resolve actual coordinates...\n');
  
  for (const url of venueUrls) {
    await resolveGoogleMapsUrl(url);
    // Add a small delay to be respectful to Google's servers
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

testAllUrls().catch(console.error);
