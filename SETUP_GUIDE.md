# Quick Setup Guide

## Step-by-Step Installation

### 1. Prerequisites Check

Make sure you have Node.js installed:
```bash
node --version
# Should show v14.0.0 or higher

npm --version
# Should show npm version
```

If not installed, download from: https://nodejs.org/

### 2. Install Dependencies

Run this in your project directory:
```bash
npm install
```

This will install:
- **express**: Web server framework
- **sqlite3**: Database
- **cors**: Cross-origin resource sharing
- **bcryptjs**: Password hashing
- **jsonwebtoken**: Authentication tokens

### 3. Start the Server

```bash
npm start
```

You should see:
```
✅ Server running on http://localhost:3000
📊 Admin panel: http://localhost:3000/admin.html
💬 Chatbot: http://localhost:3000/index.html

🔐 Default admin credentials:
   Username: admin
   Password: admin123
```

### 4. Test the Chatbot

1. Open browser: `http://localhost:3000/index.html`
2. Click a quick question or type your own
3. Try these sample questions:
   - "What is the admission process?"
   - "How much are the fees?"
   - "What documents do I need?"

### 5. Access Admin Panel

1. Open browser: `http://localhost:3000/admin.html`
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. Add, edit, or delete FAQs
4. View analytics

## Common Questions

### How do I add my own FAQs?

**Option 1: Via Admin Panel (Recommended)**
1. Login to admin panel
2. Click "Add New FAQ"
3. Fill in the form:
   - Question: The question users will ask
   - Answer: Your detailed answer
   - Keywords: Comma-separated words for matching (e.g., "fee,cost,price,tuition")
   - Category: Organize your FAQs (e.g., "Admissions", "Fees", "Programs")
4. Click Save

**Option 2: Direct Database**
Edit `server.js` and add to `sampleFAQs` array (lines 46-80)

### How does keyword matching work?

The system compares user questions with:
1. **Question text**: Words in your FAQ questions
2. **Keywords**: Custom keywords you define

**Example:**
- User asks: "How much does it cost?"
- FAQ question: "What are the tuition fees?"
- Keywords: "fees,tuition,cost,price,payment"
- Match: "cost" matches keyword → Returns FAQ answer

**Best Practices for Keywords:**
- Add common variations: "admission,admissions,admit,enroll,enrollment"
- Include synonyms: "fee,cost,price,tuition,payment"
- Add common misspellings if needed
- Keep lowercase, comma-separated

### How do I improve match accuracy?

1. **Add more keywords**: Cover all ways users might ask
2. **Create similar FAQs**: If users ask the same thing differently
3. **Check analytics**: See what questions users are asking
4. **Adjust threshold**: Lower threshold in code (line 201) for more lenient matching

### How do I customize the appearance?

**Change colors:**
1. Open `public/index.html` or `public/admin.html`
2. Find gradient CSS:
   ```css
   background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
   ```
3. Replace with your colors (use https://cssgradient.io/)

**Change text:**
- Edit HTML files directly
- Update header text, welcome messages, etc.

### How do I change admin password?

**After first login:**
You'll need to manually update the database for now.

**For production:**
1. Hash your new password:
   ```javascript
   const bcrypt = require('bcryptjs');
   const hash = bcrypt.hashSync('your-new-password', 10);
   console.log(hash);
   ```
2. Update database or modify `server.js` initialization

### Database location?

SQLite database is created as `chatbot.db` in your project root.

**To reset everything:**
```bash
# Stop server (Ctrl+C)
rm chatbot.db
npm start
# Database recreated with sample data
```

### How do I deploy to production?

See the "Production Deployment" section in README.md

**Quick options:**
1. **Heroku**: Free tier available
2. **DigitalOcean**: $5/month droplet
3. **AWS EC2**: Free tier for 12 months
4. **Vercel/Netlify**: For frontend (need separate backend)

## Troubleshooting

### "Port 3000 already in use"

**Solution 1: Use different port**
1. Open `server.js`
2. Change line 7: `const PORT = 3000;` → `const PORT = 3001;`
3. Update API_URL in HTML files to match

**Solution 2: Kill existing process**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill
```

### "Cannot find module 'express'"

Run: `npm install`

### Chatbot not responding

1. Check console for errors (F12 in browser)
2. Verify server is running
3. Check API_URL in HTML files matches server URL
4. Try different question or click quick question

### Admin login not working

1. Try default credentials: admin / admin123
2. Clear browser cache: `localStorage.clear()` in console
3. Delete `chatbot.db` and restart to reset

### No FAQs showing in chatbot

1. Login to admin panel
2. Add FAQs manually
3. Or restart server to load sample FAQs

## Development Tips

### Enable auto-restart on code changes

```bash
npm install -g nodemon
nodemon server.js
```

Now server restarts when you edit files.

### View logs

All console output shows in terminal where you ran `npm start`

### Test API directly

Use Postman or curl:
```bash
# Test chatbot
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the admission process?"}'

# Get all FAQs
curl http://localhost:3000/api/faqs
```

### Database queries

Use SQLite CLI or DB Browser for SQLite:
```bash
sqlite3 chatbot.db
sqlite> SELECT * FROM faqs;
sqlite> .quit
```

## Next Steps

1. ✅ Setup complete
2. 🎨 Customize appearance and branding
3. 📝 Add your organization's FAQs
4. 🧪 Test with real questions
5. 📊 Monitor analytics
6. 🚀 Deploy to production

## Need Help?

- Review the main README.md
- Check code comments in server.js
- Review browser console for errors
- Check server terminal for logs

Happy chatbot building! 🚀
