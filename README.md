# FAQ / College / Company Chatbot

A full-stack FAQ chatbot application with intelligent keyword matching, admin panel, and analytics. Perfect for colleges, companies, or any organization that needs to automate FAQ responses.

## 🌟 Features

### User-Facing Chatbot
- **Smart Keyword Matching**: Advanced algorithm that matches user questions with FAQs
- **Confidence Scoring**: Shows match confidence percentage
- **Related Suggestions**: Suggests related questions if no perfect match found
- **Quick Questions**: Pre-populated popular questions for easy access
- **Category Filtering**: Questions organized by categories
- **Real-time Chat**: Instant responses with typing indicators
- **Responsive Design**: Works on desktop and mobile devices

### Admin Panel
- **Authentication**: Secure login with JWT tokens
- **FAQ Management**: Add, edit, and delete FAQs easily
- **Analytics Dashboard**: 
  - Total FAQs count
  - User questions statistics
  - Match rate percentage
  - Average confidence scores
- **Recent Activity**: View recent user questions and match status
- **Category Management**: Organize FAQs by categories
- **Keyword Configuration**: Set custom keywords for better matching

### Technical Features
- RESTful API architecture
- SQLite database (easy setup, no external DB required)
- Keyword matching with fuzzy logic
- Chat logging for analytics
- CORS enabled for cross-origin requests
- Token-based authentication
- Beautiful, modern UI with gradients and animations

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## 🚀 Installation

1. **Install Dependencies**
```bash
npm install
```

2. **Start the Server**
```bash
npm start
```

The server will start on `http://localhost:3000`

## 📱 Usage

### Access the Chatbot
Open your browser and navigate to:
```
http://localhost:3000/index.html
```

Try asking questions like:
- "What is the admission process?"
- "How much are the fees?"
- "What documents do I need?"
- "What programs do you offer?"

### Access the Admin Panel
Navigate to:
```
http://localhost:3000/admin.html
```

**Default Credentials:**
- Username: `admin`
- Password: `admin123`

⚠️ **Important**: Change these credentials in production!

## 🎯 How It Works

### Keyword Matching Algorithm

The chatbot uses a sophisticated keyword matching system:

1. **Tokenization**: Breaks user questions into words
2. **Keyword Extraction**: Compares with FAQ questions and keywords
3. **Scoring System**:
   - Exact word match: 10 points
   - Partial match (similar words): 3-7 points
4. **Normalization**: Converts score to percentage
5. **Threshold**: Minimum 20% match required for response

### Example:

User asks: "How do I apply for admission?"

System matches:
- FAQ: "What is the admission process?"
- Keywords: admission, apply, enroll, registration
- Match score: 85%
- Result: Returns the admission FAQ answer

## 🔧 API Endpoints

### Public Endpoints

#### Get All FAQs
```http
GET /api/faqs?category={optional}
```

#### Ask a Question
```http
POST /api/ask
Content-Type: application/json

{
  "question": "What is the admission process?"
}
```

#### Get Categories
```http
GET /api/categories
```

### Admin Endpoints (Require Authentication)

#### Login
```http
POST /api/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

#### Get All FAQs (Admin)
```http
GET /api/admin/faqs
Authorization: Bearer {token}
```

#### Add FAQ
```http
POST /api/admin/faqs
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "What is the deadline?",
  "answer": "The deadline is...",
  "keywords": "deadline,last date,cutoff",
  "category": "Admissions"
}
```

#### Update FAQ
```http
PUT /api/admin/faqs/{id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "Updated question",
  "answer": "Updated answer",
  "keywords": "updated,keywords",
  "category": "Category"
}
```

#### Delete FAQ
```http
DELETE /api/admin/faqs/{id}
Authorization: Bearer {token}
```

#### Get Analytics
```http
GET /api/admin/analytics
Authorization: Bearer {token}
```

## 📊 Database Schema

### FAQs Table
```sql
CREATE TABLE faqs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT,
  category TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Admins Table
```sql
CREATE TABLE admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### Chat Logs Table
```sql
CREATE TABLE chat_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_question TEXT NOT NULL,
  matched_faq_id INTEGER,
  confidence_score REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (matched_faq_id) REFERENCES faqs(id)
)
```

## 🎨 Customization

### Change Colors
Edit the gradient colors in the HTML files:

**Current gradient:**
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Add More Sample FAQs
Edit the `sampleFAQs` array in `server.js` (lines 46-80)

### Change Admin Credentials
Modify the default admin creation in `server.js`:
```javascript
const hashedPassword = bcrypt.hashSync('your-new-password', 10);
db.run(`INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`, 
  ['your-username', hashedPassword]);
```

### Adjust Match Threshold
Change the matching threshold in `server.js` (line 201):
```javascript
const threshold = 20; // Minimum 20% match required
```

Lower value = more lenient matching
Higher value = stricter matching

## 🔒 Security Considerations

For production deployment:

1. **Change JWT Secret**: Update `JWT_SECRET` in server.js
2. **Use Environment Variables**: Store sensitive data in `.env`
3. **Enable HTTPS**: Use SSL/TLS certificates
4. **Rate Limiting**: Add rate limiting middleware
5. **Input Validation**: Add comprehensive input sanitization
6. **Database**: Consider migrating to PostgreSQL or MySQL
7. **Password Policy**: Enforce strong password requirements

## 🚀 Production Deployment

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start server.js --name faq-chatbot

# Save configuration
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

### Using Docker

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t faq-chatbot .
docker run -p 3000:3000 faq-chatbot
```

## 📈 Future Enhancements

Potential features to add:

- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Integration with popular messaging platforms (WhatsApp, Telegram)
- [ ] AI-powered suggestions using ML
- [ ] Export/Import FAQs (CSV, JSON)
- [ ] User feedback system (thumbs up/down)
- [ ] Advanced analytics with charts
- [ ] Role-based access control
- [ ] FAQ versioning
- [ ] Rich text editor for answers

## 🐛 Troubleshooting

### Port Already in Use
If port 3000 is occupied:

1. Change PORT in `server.js`
2. Update API_URL in HTML files

### Database Errors
Delete `chatbot.db` to reset database:
```bash
rm chatbot.db
npm start
```

### Authentication Issues
Clear browser storage:
```javascript
localStorage.clear()
```

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Support

For questions or issues, please check the FAQ in the application or review the code comments.

---

**Built with ❤️ using Node.js, Express, and SQLite**
