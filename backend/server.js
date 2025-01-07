const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');

app.use(cors());
app.use(bodyParser.json());

// Simulate a database with an in-memory array
let leaderboardDB = [];

// Endpoint to add a leaderboard entry
app.post('/leaderboard', (req, res) => {
    const { name, score, date } = req.body;
    if (!name || !score || !date) {
        return res.status(400).json({ error: 'Name, score, and date are required.' });
    }

    // Add entry to the "database"
    leaderboardDB.push({ name, score, date });

    // Sort and limit to top 10 scores
    leaderboardDB.sort((a, b) => b.score - a.score);
    leaderboardDB = leaderboardDB.slice(0, 10);

    res.status(201).json({ message: 'Leaderboard updated successfully.', leaderboard: leaderboardDB });
});

// Endpoint to get the leaderboard
app.get('/leaderboard', (req, res) => {
    res.json(leaderboardDB);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
