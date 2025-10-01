# How to Fix the Hydration Error

The hydration error is happening because your browser has cached the old JavaScript code. Here's how to fix it:

## Option 1: Hard Refresh (Recommended)
1. Go to http://155.138.165.47:10001/projects/1
2. Press **Ctrl + Shift + R** (Windows/Linux) or **Cmd + Shift + R** (Mac)
3. This forces the browser to reload all resources

## Option 2: Clear Browser Cache
1. Open Chrome DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

## Option 3: Open in Incognito/Private Mode
1. Open a new incognito/private browser window
2. Navigate to http://155.138.165.47:10001/projects/1
3. This ensures no cached files are used

## What Was Fixed

### 1. Date Formatting
Changed from locale-specific formatting to ISO format:
```javascript
// OLD (causes hydration error):
{new Date(doc.created_at).toLocaleString()}

// NEW (consistent between server and client):
{new Date(doc.created_at).toISOString().replace('T', ' ').slice(0, -5)}
```

### 2. Action Buttons Layout
- Improved layout with flexbox
- Fixed URLs for HTML/MD viewing
- Delete button always visible

## After Clearing Cache

You should see:
- Dates in format: "2025-08-31 11:48:00"
- For completed documents: View HTML | Download MD | Delete
- For failed documents: "No output available" | Delete

The server has been restarted with the fixes applied. Just clear your browser cache to see the changes!