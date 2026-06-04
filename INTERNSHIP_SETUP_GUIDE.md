# 🚀 Internship & Placement Feature - Setup Guide

## Quick Start

### Step 1: Install Dependencies
```bash
# Install the new dependency in server
npm install --prefix server

# This installs node-cron which is required for scheduling
```

### Step 2: Restart Your Server
```bash
# Stop your current server (Ctrl+C)
# Then restart it
npm run dev --prefix server
```

You should see in the logs:
```
🚀 Initializing internship offers sync...
✅ Saved X new internship offers
✅ Internship sync scheduled to run every 5 minutes
```

### Step 3: Access the Feature
1. Go to your DSA Tracker app
2. Look for the **Internships** option in the sidebar (briefcase icon)
3. Click it to view the internship offers dashboard

## What You Get

### ✅ Automatic Offer Fetching
- Fetches internship/placement offers **every 5 minutes**
- Currently uses mock data (includes Google, Microsoft, Amazon, Goldman Sachs, McKinsey, etc.)
- Ready for real API integration

### ✅ Offer Management
- Offers automatically **expire after 2 days**
- Track views and applications
- Save favorite offers

### ✅ User Interface
- Modern, responsive design
- Filter by sector, job type, location
- Search functionality
- Save/bookmark offers
- View trending offers
- Pagination support

### ✅ API Endpoints
All endpoints available under `/api/internships/`:
- `GET /offers` - Get all offers with filters
- `GET /sector/:sector` - Filter by sector
- `GET /stats` - View statistics
- `GET /offer/:id` - View offer details
- `GET /trending` - Trending offers
- `GET /expiring-soon` - Offers expiring soon
- `POST /search` - Advanced search
- `POST /offer/:id/apply` - Track applications

## File Structure

New files added:
```
server/
├── models/
│   └── InternshipOffer.js          (MongoDB model)
├── routes/
│   └── internships.js              (API routes)
└── utils/
    └── internshipFetcher.js        (Fetch & sync logic)

client/
└── src/
    └── pages/
        └── Internships.jsx         (Frontend page)
```

Modified files:
- `server/server.js` - Added cron scheduling
- `server/package.json` - Added node-cron dependency
- `client/src/App.jsx` - Added route
- `client/src/components/Sidebar.jsx` - Added navigation link

## Configuration

### Adjust Sync Frequency
Edit `server/server.js`, find the cron.schedule line:
```javascript
// Current: Every 5 minutes
cron.schedule('*/5 * * * *', () => syncInternshipOffers());

// Change to:
// Every hour: '0 * * * *'
// Daily: '0 0 * * *'
// Every 30 minutes: '*/30 * * * *'
```

### Adjust Offer Expiration
Edit `server/models/InternshipOffer.js`, find the TTL index:
```javascript
expires: 172800  // 2 days in seconds

// Change to:
expires: 86400   // 1 day
expires: 259200  // 3 days
```

## Integrating Real APIs

To add real offer sources, edit `server/utils/internshipFetcher.js`:

### Example: Add Internshala Integration
```javascript
async function fetchFromInternshala() {
  try {
    const response = await axios.get('https://api.internshala.com/jobs', {
      headers: { 
        'Authorization': `Bearer ${process.env.INTERNSHALA_API_KEY}` 
      }
    });
    
    return response.data.internships.map(job => ({
      company: job.company_name,
      position: job.profile,
      jobType: 'internship',
      sector: job.category,
      location: job.location,
      salary: { min: job.salary_from, max: job.salary_to, currency: 'INR' },
      description: job.about,
      requirements: job.qualifications.split(','),
      duration: job.duration,
      skills: job.tags || [],
      applyLink: job.apply_url,
      source: 'internshala',
      sourceId: job.id,
      postedAt: new Date(job.posted_on)
    }));
  } catch (error) {
    console.error('Error fetching from Internshala:', error);
    return [];
  }
}

// Then add to fetchInternshipOffers():
async function fetchInternshipOffers() {
  const offers = [];
  offers.push(...mockOffers);
  offers.push(...await fetchFromInternshala());  // Add this line
  return offers;
}
```

## Features Overview

### 1. Dashboard Stats
- Total active offers
- Number of sectors
- Number of companies
- Your saved offers

### 2. Filtering & Search
- **Search**: Find by company or position name
- **Sector Filter**: Technology, Finance, Consulting, Healthcare, etc.
- **Job Type**: Internship, Placement, Full-Time, Contract
- **Advanced Search**: Filter by salary range, required skills, location

### 3. Offer Cards
Each card shows:
- Company name and position
- Job type badge
- Sector badge
- Duration
- Location
- Salary range (if available)
- Required skills
- Apply button

### 4. Save & Bookmark
- Click heart icon to save offers
- Saved offers stored in browser
- Access from "Saved Offers" tab

### 5. Apply Tracking
- Click "Apply Now" to be redirected
- Application count is tracked
- Application link is recorded

## Monitoring

### Check Sync Status
Look for these logs in server console:
```
[2024-05-11T10:00:00.000Z] 🔄 Syncing internship offers...
✅ Saved 5 new internship offers
🧹 Cleaned up 0 expired offers
✅ Sync completed at 2024-05-11T10:00:05.000Z
```

### Database Query
```javascript
// Check offers in MongoDB
db.internshipoffers.find({ isActive: true }).count()
db.internshipoffers.find({ isActive: true }).limit(5)
```

## Testing Checklist

- [ ] Can see Internships link in sidebar
- [ ] Can view all offers page
- [ ] Filters work (sector, job type, search)
- [ ] Can save/unsave offers
- [ ] Can apply to offers (opens link)
- [ ] Stats dashboard shows correct counts
- [ ] Pagination works
- [ ] Saved offers tab displays correctly
- [ ] Trending offers show most viewed
- [ ] Offers expiring soon visible

## Troubleshooting

### Error: Cannot find module 'node-cron'
**Solution**: Run `npm install --prefix server` and restart server

### Offers not appearing
**Solution**: Check MongoDB connection and restart server

### Sync not running every 5 minutes
**Solution**: Check server logs for errors, verify cron pattern

### Too many offers/not enough offers
**Solution**: Adjust mock data in `internshipFetcher.js` or add real API integrations

## Support

For issues:
1. Check server logs for error messages
2. Verify MongoDB is connected
3. Ensure `node-cron` package is installed
4. Check that routes are registered in server
5. Test API endpoints directly: `http://localhost:10000/api/internships/offers`

## Next Steps

1. ✅ Installation complete
2. Start using the feature
3. Monitor offer syncing in logs
4. Consider adding real API integrations
5. Add email notifications (future enhancement)
6. Track user applications (future enhancement)

## Performance Notes

- **Initial load**: First sync happens on server start
- **Subsequent syncs**: Every 5 minutes automatically
- **Expiration**: Offers removed after 48 hours
- **Database**: Uses TTL index for automatic cleanup
- **Frontend**: Pagination reduces load (20 offers per page default)

Enjoy the feature! 🎉
