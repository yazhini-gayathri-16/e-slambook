const express = require('express');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const session = require('express-session');
const mongoose = require('mongoose');
const connectDB = require('./connection'); // Import as a function
require('dotenv').config();
const Slam = require('./models/slam');

const app = express();
const path = require('path');
const ejs = require('ejs');

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, path.join(__dirname, 'public/uploads/'));
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: function(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});

// Connect to MongoDB first
connectDB().then(() => {
  // Middleware
  app.use(express.static('public'));
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send(err.message);
  });
  app.set('view engine', 'ejs');

  // Schema and Model
  // const Entry = mongoose.model('Entry', {
  //   name: String,
  //   nickname: String,
  //   favMemory: String,
  //   message: String
  // });

  // Routes
  app.get('/', (req, res) => {
    res.render('index');
  });

  app.get('/export', async (req, res) => {
    try {
      const responses = await Slam.find({}, 'name _id').sort('-createdAt');
      res.render('export', { responses });
    } catch (error) {
      console.error('Error fetching responses:', error);
      res.status(500).render('error', { error: 'Error fetching responses' });
    }
  });
  
  app.get('/responses/:id', async (req, res) => {
    try {
      const slam = await Slam.findById(req.params.id);
      if (!slam) {
        return res.status(404).render('error', { error: 'Entry not found' });
      }
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        res.render('response', { slam, name: slam.name, layout: false });
      } else {
        res.render('response', { slam, name: slam.name });
      }
    } catch (error) {
      console.error('Error fetching entry:', error);
      res.status(500).render('error', { error: 'Error fetching entry' });
    }
  });

app.post('/submit', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).send('Please select a photo');
    }

    const slamData = {
      ...req.body,
      photo: `/uploads/${req.file.filename}`
    };

    const slam = new Slam(slamData);
    await slam.save();
    
    // Redirect to the response page instead of thanks page
    res.redirect(`/responses/${slam._id}`);
  } catch (error) {
    console.error('Error saving entry:', error);
    res.status(500).render('error', { 
      error: error.message || 'Error saving your entry'
    });
  }
});

  // Server start
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 E-slam book is live at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});