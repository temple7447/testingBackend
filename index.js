require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const cors = require('cors'); // add this line

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Mongoose model
const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true }
});
const Image = mongoose.model('Image', ImageSchema);

// Multer config (memory storage)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Express app setup
const app = express();
app.use(cors()); // allow all origins
app.use(morgan('dev'));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Upload image endpoint
app.post('/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload_stream(
      { resource_type: 'image' },
      async (error, result) => {
        if (error) return res.status(500).json({ error: 'Cloudinary upload failed' });

        // Save to MongoDB
        const image = new Image({ url: result.secure_url });
        await image.save();

        res.json({ url: result.secure_url });
      }
    );
    result.end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload video endpoint
app.post('/upload-video', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    cloudinary.uploader.upload_stream(
      { resource_type: 'video' },
      async (error, result) => {
        if (error) return res.status(500).json({ error: 'Cloudinary upload failed' });

        const video = new Image({ url: result.secure_url });
        await video.save();

        res.json({ url: result.secure_url });
      }
    ).end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload generic file endpoint
app.post('/upload-file', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    cloudinary.uploader.upload_stream(
      { resource_type: 'raw' },
      async (error, result) => {
        if (error) return res.status(500).json({ error: 'Cloudinary upload failed' });

        const file = new Image({ url: result.secure_url });
        await file.save();

        res.json({ url: result.secure_url });
      }
    ).end(req.file.buffer);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
