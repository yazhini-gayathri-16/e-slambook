const express = require('express');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo');
const multer = require('multer');
const session = require('express-session');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const connectDB = require('./connection'); // Import as a function
require('dotenv').config();
const Slam = require('./models/slam');
const uploadsDir = path.join(__dirname, 'public/uploads');
const stickersDir = path.join(__dirname, 'public/stickers');


if (!fs.existsSync(uploadsDir)){
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();


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
    // Check mimetype instead of file extension
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Please upload an image file (JPG, JPEG, PNG)'), false);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Connect to MongoDB first
connectDB().then(() => {
  // Middleware
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
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

  [uploadsDir, stickersDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  const requiredStickers = ['cat.png', 'ham.png', 'heart.png', 'logo.png'];
const missingStickers = requiredStickers.filter(sticker => 
  !fs.existsSync(path.join(stickersDir, sticker))
);

if (missingStickers.length > 0) {
  console.warn('Warning: Missing sticker files:', missingStickers);
}

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

  app.post('/submit', (req, res) => {
    upload.single('photo')(req, res, function(err) {
      if (err instanceof multer.MulterError) {
        // A Multer error occurred during upload
        return res.status(400).render('error', { 
          error: 'File upload error: ' + err.message 
        });
      } else if (err) {
        // An unknown error occurred
        return res.status(400).render('error', { 
          error: err.message 
        });
      }
      
      // No file was uploaded
      if (!req.file) {
        return res.status(400).render('error', { 
          error: 'Please select a photo to upload' 
        });
      }
  
      // Create and save the slam entry
      const slamData = {
        ...req.body,
        photo: `/uploads/${req.file.filename}`
      };
  
      const slam = new Slam(slamData);
      slam.save()
        .then(savedSlam => {
          res.redirect(`/responses/${savedSlam._id}`);
        })
        .catch(error => {
          console.error('Error saving entry:', error);
          res.status(500).render('error', { 
            error: error.message || 'Error saving your entry'
          });
        });
    });
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