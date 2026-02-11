const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Database
const db = new sqlite3.Database('./chatbot.db', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Create tables
function initializeDatabase() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS faqs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question TEXT NOT NULL,
      answer TEXT NOT NULL,
      keywords TEXT,
      category TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS chat_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_question TEXT NOT NULL,
      matched_faq_id INTEGER,
      confidence_score REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (matched_faq_id) REFERENCES faqs(id)
    )`);

    // Create default admin (username: admin, password: admin123)
    const hashedPassword = bcrypt.hashSync('admin123', 10);
    db.run(`INSERT OR IGNORE INTO admins (username, password) VALUES (?, ?)`,
      ['admin', hashedPassword]);

    // Add sample FAQs
    const sampleFAQs = [
      {
        question: "What is the admission process?",
        answer: "The admission process involves: 1) Fill out the online application form, 2) Submit required documents (transcripts, ID proof), 3) Pay the application fee, 4) Attend the entrance exam/interview, 5) Wait for the admission decision which typically takes 2-3 weeks.",
        keywords: "admission,apply,enroll,registration,join,entrance",
        category: "Admissions"
      },
      {
        question: "What are the tuition fees?",
        answer: "Tuition fees vary by program. Undergraduate programs: $15,000-20,000 per year. Graduate programs: $20,000-30,000 per year. Financial aid and scholarships are available for eligible students.",
        keywords: "fees,tuition,cost,price,payment,money,scholarship",
        category: "Fees"
      },
      {
        question: "What documents are required for admission?",
        answer: "Required documents include: 1) Completed application form, 2) High school/previous degree transcripts, 3) Passport-size photographs, 4) ID proof (passport/driving license), 5) Entrance exam scores (if applicable), 6) Letters of recommendation (for graduate programs).",
        keywords: "documents,requirements,papers,certificates,transcripts",
        category: "Admissions"
      },
      {
        question: "What programs do you offer?",
        answer: "We offer various programs including: Computer Science, Business Administration, Engineering (Mechanical, Electrical, Civil), Medicine, Arts and Humanities, Law, and more. Both undergraduate and graduate programs are available.",
        keywords: "programs,courses,degrees,majors,study,fields",
        category: "Programs"
      },
      {
        question: "How do I contact the admissions office?",
        answer: "You can contact the admissions office via: Email: admissions@college.edu, Phone: +1-555-0123, Office hours: Monday-Friday, 9 AM - 5 PM. You can also visit us at the main campus administration building.",
        keywords: "contact,email,phone,reach,support,help",
        category: "Contact"
      }
    ];

    const stmt = db.prepare(`INSERT OR IGNORE INTO faqs (question, answer, keywords, category) VALUES (?, ?, ?, ?)`);
    sampleFAQs.forEach(faq => {
      stmt.run(faq.question, faq.answer, faq.keywords, faq.category);
    });
    stmt.finalize();
  });
}

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Keyword matching algorithm
function calculateMatchScore(userQuestion, faq) {
  const userWords = userQuestion.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);

  const questionWords = faq.question.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/);

  const keywordWords = (faq.keywords || '').toLowerCase().split(',').map(k => k.trim());
  const allFaqWords = [...questionWords, ...keywordWords];

  let score = 0;
  let matchedWords = 0;

  userWords.forEach(userWord => {
    allFaqWords.forEach(faqWord => {
      // Exact match
      if (userWord === faqWord) {
        score += 10;
        matchedWords++;
      }
      // Partial match (word contains or is contained)
      else if (userWord.includes(faqWord) || faqWord.includes(userWord)) {
        if (Math.abs(userWord.length - faqWord.length) <= 2) {
          score += 7;
          matchedWords++;
        } else {
          score += 3;
        }
      }
    });
  });

  // Normalize score
  const maxPossibleScore = userWords.length * 10;
  const normalizedScore = maxPossibleScore > 0 ? (score / maxPossibleScore) * 100 : 0;

  return {
    score: normalizedScore,
    matchedWords: matchedWords
  };
}

// API Routes

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;

  db.get('SELECT * FROM admins WHERE username = ?', [username], async (err, admin) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, username: admin.username });
  });
});

// Get all FAQs (Public)
app.get('/api/faqs', (req, res) => {
  const category = req.query.category;
  let query = 'SELECT id, question, answer, keywords, category, created_at FROM faqs';
  let params = [];

  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Get all categories
app.get('/api/categories', (req, res) => {
  db.all('SELECT DISTINCT category FROM faqs ORDER BY category', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows.map(r => r.category));
  });
});

// Search/Ask question (Public)
app.post('/api/ask', (req, res) => {
  const { question } = req.body;

  if (!question || question.trim().length === 0) {
    return res.status(400).json({ error: 'Question is required' });
  }

  db.all('SELECT * FROM faqs', (err, faqs) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (faqs.length === 0) {
      return res.json({
        found: false,
        message: 'No FAQs available yet. Please contact support.'
      });
    }

    // Calculate match scores for all FAQs
    const scoredFaqs = faqs.map(faq => {
      const matchResult = calculateMatchScore(question, faq);
      return {
        ...faq,
        score: matchResult.score,
        matchedWords: matchResult.matchedWords
      };
    });

    // Sort by score
    scoredFaqs.sort((a, b) => b.score - a.score);

    const bestMatch = scoredFaqs[0];
    const threshold = 20; // Minimum 20% match required

    // Log the interaction
    db.run(
      'INSERT INTO chat_logs (user_question, matched_faq_id, confidence_score) VALUES (?, ?, ?)',
      [question, bestMatch.score >= threshold ? bestMatch.id : null, bestMatch.score]
    );

    if (bestMatch.score >= threshold) {
      res.json({
        found: true,
        answer: bestMatch.answer,
        question: bestMatch.question,
        confidence: Math.round(bestMatch.score),
        category: bestMatch.category,
        suggestions: scoredFaqs.slice(1, 4).filter(f => f.score > 15).map(f => ({
          question: f.question,
          category: f.category
        }))
      });
    } else {
      res.json({
        found: false,
        message: 'I couldn\'t find a good match for your question. Here are some topics I can help with:',
        suggestions: scoredFaqs.slice(0, 5).map(f => ({
          question: f.question,
          category: f.category
        }))
      });
    }
  });
});

// Admin: Get all FAQs with full details
app.get('/api/admin/faqs', authenticateToken, (req, res) => {
  db.all('SELECT * FROM faqs ORDER BY created_at DESC', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(rows);
  });
});

// Admin: Add FAQ
app.post('/api/admin/faqs', authenticateToken, (req, res) => {
  const { question, answer, keywords, category } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: 'Question and answer are required' });
  }

  db.run(
    'INSERT INTO faqs (question, answer, keywords, category) VALUES (?, ?, ?, ?)',
    [question, answer, keywords || '', category || 'General'],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json({ id: this.lastID, message: 'FAQ added successfully' });
    }
  );
});

// Admin: Update FAQ
app.put('/api/admin/faqs/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { question, answer, keywords, category } = req.body;

  db.run(
    'UPDATE faqs SET question = ?, answer = ?, keywords = ?, category = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [question, answer, keywords, category, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'FAQ not found' });
      }
      res.json({ message: 'FAQ updated successfully' });
    }
  );
});

// Admin: Delete FAQ
app.delete('/api/admin/faqs/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM faqs WHERE id = ?', [id], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'FAQ not found' });
    }
    res.json({ message: 'FAQ deleted successfully' });
  });
});

// Admin: Get analytics
app.get('/api/admin/analytics', authenticateToken, (req, res) => {
  const queries = {
    totalQuestions: 'SELECT COUNT(*) as count FROM chat_logs',
    matchedQuestions: 'SELECT COUNT(*) as count FROM chat_logs WHERE matched_faq_id IS NOT NULL',
    averageConfidence: 'SELECT AVG(confidence_score) as avg FROM chat_logs WHERE matched_faq_id IS NOT NULL',
    recentQuestions: 'SELECT * FROM chat_logs ORDER BY timestamp DESC LIMIT 10',
    popularFAQs: `
      SELECT f.question, f.category, COUNT(cl.id) as hits
      FROM faqs f
      LEFT JOIN chat_logs cl ON f.id = cl.matched_faq_id
      GROUP BY f.id
      ORDER BY hits DESC
      LIMIT 10
    `
  };

  const results = {};

  db.get(queries.totalQuestions, (err, row) => {
    results.totalQuestions = row.count;

    db.get(queries.matchedQuestions, (err, row) => {
      results.matchedQuestions = row.count;
      results.matchRate = results.totalQuestions > 0
        ? Math.round((results.matchedQuestions / results.totalQuestions) * 100)
        : 0;

      db.get(queries.averageConfidence, (err, row) => {
        results.averageConfidence = Math.round(row.avg || 0);

        db.all(queries.recentQuestions, (err, rows) => {
          results.recentQuestions = rows;

          db.all(queries.popularFAQs, (err, rows) => {
            results.popularFAQs = rows;
            res.json(results);
          });
        });
      });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin panel: http://localhost:${PORT}/admin.html`);
  console.log(`💬 Chatbot: http://localhost:${PORT}/index.html`);
  console.log(`\n🔐 Default admin credentials:`);
  console.log(`   Username: admin`);
  console.log(`   Password: admin123`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err);
    } else {
      console.log('\n✅ Database connection closed');
    }
    process.exit(0);
  });
});
