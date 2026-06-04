# Internship & Placement Offers Feature

## Overview
This feature continuously fetches internship and placement offers from various sources and displays them on the platform. Offers are updated every 5 minutes and automatically expire after 48 hours.

## Features

### ✨ Core Functionality
- **Auto-refresh every 5 minutes**: Background job fetches new offers automatically
- **2-day expiration**: Offers are automatically removed after 48 hours
- **Multiple sectors**: Technology, Finance, Consulting, Healthcare, E-Commerce, StartUp
- **Multiple job types**: Internship, Placement, Full-Time, Contract
- **Smart filtering**: Filter by sector, location, job type, salary range, and skills
- **Save favorites**: Users can bookmark offers for later
- **Trending offers**: View most viewed and applied offers
- **Application tracking**: Track which offers users have applied to

### 📊 Statistics & Insights
- Total active offers count
- Offers by sector breakdown
- Average salary ranges
- Company count
- Trending offers (by views and applications)

## Technical Implementation

### Backend Structure

#### 1. **Model** - `server/models/InternshipOffer.js`
```javascript
Schema fields:
- company (String, indexed)
- position (String, indexed)
- jobType (Enum: internship/placement/full-time/contract)
- sector (String, indexed)
- location (String)
- salary (Object: min, max, currency)
- description (String)
- requirements (Array)
- duration (String)
- skills (Array)
- applyLink (String, required)
- source (Enum: linkedin/internshala/coursera/ambitionbox/naukri/indeed/custom)
- sourceId (String)
- postedAt (Date)
- expiresAt (Date)
- isActive (Boolean, indexed)
- views (Number)
- applications (Number)
- createdAt (Date, expires after 172800 seconds = 2 days)
- updatedAt (Date)
```

#### 2. **Utility** - `server/utils/internshipFetcher.js`
Core functions:
- `fetchInternshipOffers()` - Fetches offers from various sources
- `saveOffers(offers)` - Saves or updates offers in database
- `cleanupExpiredOffers()` - Removes offers older than 2 days
- `syncInternshipOffers()` - Main sync function (runs every 5 minutes)
- `getActiveOffers(filters)` - Retrieves active offers with filtering
- `getOffersBySector(sector)` - Gets offers by specific sector
- `getOfferStats()` - Returns statistics about offers
- `recordOfferApplication(offerId)` - Tracks application clicks
- `recordOfferView(offerId)` - Tracks offer views

#### 3. **Routes** - `server/routes/internships.js`

**GET Endpoints:**
- `GET /offers` - Get all active offers with pagination
  - Query params: `sector`, `jobType`, `location`, `search`, `limit`, `skip`
  - Returns: Paginated list of offers

- `GET /sector/:sector` - Get offers by sector
  - Returns: Offers filtered by sector

- `GET /stats` - Get statistics about available offers
  - Returns: Total offers, stats by sector, list of sectors and companies

- `GET /offer/:id` - Get single offer details
  - Records a view for the offer
  - Returns: Full offer details

- `GET /trending` - Get trending offers (most viewed)
  - Query param: `limit` (default 10)
  - Returns: Top viewed/applied offers

- `GET /expiring-soon` - Get offers expiring within 24 hours
  - Returns: Offers that will expire soon

**POST Endpoints:**
- `POST /offer/:id/apply` - Record application to an offer
  - Returns: Application link for redirect

- `POST /search` - Advanced search with multiple filters
  - Body params: `sectors[]`, `jobTypes[]`, `companies[]`, `minSalary`, `maxSalary`, `skills[]`, `locations[]`
  - Returns: Filtered offers

#### 4. **Cron Job** - `server/server.js`
```javascript
// Runs every 5 minutes
cron.schedule('*/5 * * * *', () => {
  syncInternshipOffers();
});
```

### Frontend Components

#### **Page** - `client/src/pages/Internships.jsx`

Features:
- Responsive grid layout (1 column on mobile, 2 columns on tablet+)
- Real-time offer cards with:
  - Company and position details
  - Job type and sector badges
  - Location and salary information
  - Required skills tags
  - Save/bookmark button
  - Apply button with external link redirect

- **Filtering System:**
  - Search by company/position
  - Filter by sector
  - Filter by job type

- **Tabbed Interface:**
  - "All Offers" tab with full filtering
  - "Saved Offers" tab (stored in localStorage)

- **Statistics Dashboard:**
  - Total offers count
  - Number of sectors
  - Number of companies
  - Saved offers count

- **Pagination:**
  - Next/Previous navigation
  - Shows current page and total pages

### Dependencies Added
```json
"node-cron": "^3.0.2"
```

## API Usage Examples

### Fetch all internship offers
```bash
GET /api/internships/offers?limit=20&skip=0&sector=Technology
```

### Get trending offers
```bash
GET /api/internships/trending?limit=10
```

### Search with advanced filters
```bash
POST /api/internships/search
{
  "sectors": ["Technology", "Finance"],
  "jobTypes": ["internship", "placement"],
  "minSalary": 30000,
  "maxSalary": 100000,
  "skills": ["Python", "JavaScript"]
}
```

### Record application
```bash
POST /api/internships/offer/{offerId}/apply
```

## Integration with Real APIs

The current implementation uses mock data. To integrate with real APIs:

1. **LinkedIn API** - Update `fetchInternshipOffers()` to call LinkedIn's API
2. **Internshala API** - Integrate Internshala's job listings
3. **Ambition Box** - Add Ambition Box salary and company data
4. **Naukri API** - Integrate Naukri job listings
5. **Indeed API** - Add Indeed job postings

Example integration template in `server/utils/internshipFetcher.js`:
```javascript
// async function fetchFromInternshala() {
//   try {
//     const response = await axios.get('https://api.internshala.com/jobs', {
//       headers: { 'Authorization': `Bearer ${process.env.INTERNSHALA_API_KEY}` }
//     });
//     return response.data.map(job => ({...}));
//   } catch (error) {
//     console.error('Error fetching from Internshala:', error);
//     return [];
//   }
// }
```

## Database Indices

The model includes optimal indices for performance:
- `company` - For searching by company
- `position` - For searching by position
- `jobType` - For filtering by job type
- `sector` - For filtering by sector
- `isActive` - For filtering active offers
- `createdAt` - For automatic expiration and sorting
- Compound indices for efficient complex queries

## Automatic Cleanup

MongoDB TTL (Time To Live) index automatically removes documents:
- Expires 172800 seconds (2 days) after creation
- Manual cleanup also runs during sync to ensure consistency

## Frontend Integration

### Adding to Navigation
The Internships page is automatically added to the sidebar with a briefcase icon.

### Local Storage
Saved offers are stored in browser's localStorage:
```javascript
localStorage.setItem('savedOffers', JSON.stringify(savedOffers))
```

## Performance Considerations

1. **Pagination** - Large result sets are paginated (default 20 per page)
2. **Indexing** - Database indices optimize query performance
3. **Caching** - Frontend caches data locally
4. **TTL Index** - Automatic cleanup prevents database bloat
5. **Compound Queries** - Optimized indices for common filter combinations

## Future Enhancements

1. **Email Notifications** - Notify users when new offers match their interests
2. **Application History** - Track all applications by users
3. **Wishlist** - Convert saved offers to actual user wishlists
4. **Recommendations** - ML-based offer recommendations based on user profile
5. **Real API Integration** - Connect with LinkedIn, Internshala, etc.
6. **Advanced Analytics** - User engagement metrics and trends
7. **Company Profiles** - Detailed company information and reviews
8. **Resume Matching** - Match offers with user's resume/skills

## Configuration

### Environment Variables
No additional environment variables needed beyond existing setup.

### Schedule
Default: Every 5 minutes (`*/5 * * * *`)
Can be changed in `server/server.js`:
```javascript
cron.schedule('*/5 * * * *', () => syncInternshipOffers());
// Change to: 
// cron.schedule('0 * * * *', ...) // Every hour
// cron.schedule('0 0 * * *', ...) // Daily at midnight
```

## Testing

### Manual Testing Steps

1. **View Internship Page**
   - Navigate to `/internships` in the app

2. **Test Filtering**
   - Filter by sector
   - Filter by job type
   - Search for company/position

3. **Test Save Feature**
   - Click heart icon to save an offer
   - Check "Saved Offers" tab

4. **Test Apply**
   - Click "Apply Now" button
   - Should redirect to external link

5. **Test Pagination**
   - Navigate through pages

### Backend Testing

```bash
# Test API endpoints
curl http://localhost:10000/api/internships/offers
curl http://localhost:10000/api/internships/stats
curl http://localhost:10000/api/internships/trending
```

## Troubleshooting

### No offers appearing
1. Check if MongoDB is connected
2. Verify `node-cron` is installed: `npm install --prefix server`
3. Check server logs for sync errors
4. Manually trigger sync: `npm run dev --prefix server`

### Offers not updating
1. Check cron job is running (should see "Syncing internship offers" in logs every 5 minutes)
2. Verify MongoDB connection
3. Check if `isActive` flag is set to `true`

### Performance issues
1. Add more database indices if needed
2. Implement pagination with smaller `limit` values
3. Optimize query filters in advanced search

## Security Considerations

1. **Input Validation** - All user inputs in search/filters are validated
2. **Rate Limiting** - Consider adding rate limiting for API endpoints
3. **Authentication** - Routes are protected (behind `/api` namespace)
4. **Data Sanitization** - All external data is validated before storage
5. **CORS** - Properly configured CORS headers

## Support & Maintenance

- Monitor MongoDB disk space for offer collection
- Periodically review and update mock data sources
- Add real API integrations as needed
- Monitor cron job execution in server logs
- Update offer expiration time if business requirements change
