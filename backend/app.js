const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Student Task Manager API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/assignment', assignmentRoutes);

if (require.main === module) {
  connectDB();

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

module.exports = app;