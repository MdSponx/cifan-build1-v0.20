# Google Maps API Setup Guide

This guide will help you set up Google Maps integration for the venues page.

## 🚀 Quick Setup

### Step 1: Get Google Maps API Key

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Create or select a project**
3. **Enable the Maps Embed API**:
   - Go to "APIs & Services" > "Library"
   - Search for "Maps Embed API"
   - Click "Enable"
4. **Create API Key**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

### Step 2: Configure API Key Restrictions (Recommended)

1. **Click on your API key** in the credentials list
2. **Set Application Restrictions**:
   - Choose "HTTP referrers (web sites)"
   - Add these referrers:
     ```
     http://localhost:*
     https://localhost:*
     https://yourdomain.com/*
     ```
3. **Set API Restrictions**:
   - Choose "Restrict key"
   - Select "Maps Embed API"
4. **Save**

### Step 3: Add API Key to Your Project

1. **Create/Update `.env` file** in your project root:
   ```env
   REACT_APP_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   ```

2. **Restart your development server**:
   ```bash
   npm run dev
   ```

## 🔧 Current Implementation

The venues page has been built with a **smart fallback system**:

- ✅ **With API Key**: Shows interactive Google Maps
- ✅ **Without API Key**: Shows beautiful static placeholders with direct links to Google Maps

## 🎯 Features

### With Google Maps API Key:
- Interactive embedded maps for each venue
- Zoom, pan, and explore functionality
- Professional map integration

### Without API Key (Fallback):
- Beautiful static venue cards
- Direct "Open in Google Maps" buttons
- All venue information still displayed
- Fully functional page

## 🛠️ Troubleshooting

### Common Issues:

1. **"This IP, site or mobile application is not authorized"**
   - Check API key restrictions in Google Cloud Console
   - Ensure `localhost:*` is added to HTTP referrers
   - Verify the API key is correctly set in `.env`

2. **Maps not loading**
   - Check browser console for errors
   - Verify Maps Embed API is enabled
   - Ensure API key has proper permissions

3. **Development vs Production**
   - Add your production domain to API key restrictions
   - Use environment variables for different environments

### Testing Your Setup:

1. **Check if API key is loaded**:
   ```javascript
   console.log('API Key:', process.env.REACT_APP_GOOGLE_MAPS_API_KEY);
   ```

2. **Test the venues page**: Navigate to `#venues` and check if maps load

## 💡 Cost Considerations

- **Maps Embed API** is free for most usage levels
- Check Google's pricing: https://cloud.google.com/maps-platform/pricing
- Consider setting usage quotas to control costs

## 🔒 Security Best Practices

1. **Always restrict your API key**
2. **Use HTTP referrer restrictions**
3. **Enable only necessary APIs**
4. **Monitor usage in Google Cloud Console**
5. **Never commit API keys to version control**

## 📱 Mobile Considerations

The venues page is fully responsive and works great on mobile devices, with or without the Google Maps API key.

---

**Need Help?** The venues page works perfectly even without the Google Maps API key - users can still access all venue information and get directions through the fallback system!
