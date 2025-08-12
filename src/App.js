import './App.css';
import { useState, useEffect, useRef } from 'react';

const WIN_MESSAGES = [
  "LET'S GO",
  'i love u',
  'jin loves u',
  'andreana loves u',
  'u made capy happy',
  'gengar is happy',
  'rj is happy',
  'FUCK YEAH',
  "where's the freakin' gabagool?",
  'hayley williams <3',
];

const LOSE_MESSAGES = [
  'r u stupid?',
  'do u hate me?',
  'am i better than u?',
  "we're not friends",
  'u like bob haircuts',
  'rachel zegler',
  'u made rj cry',
  'u made gengar cry',
  'u made capy cry',
  'i hate u',
  'AW FUCK',
  'HELLO? R U DENSE?',
  'r u mad at me?',
  'damn bitch, u live like this?',
  'why i outtaa',
];

function App() {
  const [lyric, setLyric] = useState(null);
  const [album, setAlbum] = useState(null);
  const [song, setSong] = useState(null);
  const [loading, setLoading] = useState(true);
  const [albumGuess, setAlbumGuess] = useState('');
  const [songGuess, setSongGuess] = useState('');
  const [streak, setStreak] = useState(0);
  const [albumGuessedCorrect, setAlbumGuessedCorrect] = useState(false);
  const [songGuessedCorrect, setSongGuessedCorrect] = useState(false);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const [celebrated, setCelebrated] = useState(false);
  const celebrationTimeoutRef = useRef(null);
  const [winMessage, setWinMessage] = useState(null);
  const [loseMessage, setLoseMessage] = useState(null);
  const loseMessageTimeoutRef = useRef(null);
  const [usedLoseIndices, setUsedLoseIndices] = useState([]);
  const [loseMessageId, setLoseMessageId] = useState(0);

  function pickUniqueLoseMessage() {
    const total = LOSE_MESSAGES.length;
    const available = Array.from({ length: total }, (_, i) => i).filter(
      i => !usedLoseIndices.includes(i),
    );
    let chosenIndex;
    if (available.length === 0) {
      chosenIndex = Math.floor(Math.random() * total);
      setUsedLoseIndices([chosenIndex]);
    } else {
      const idx = Math.floor(Math.random() * available.length);
      chosenIndex = available[idx];
      setUsedLoseIndices(prev => [...prev, chosenIndex]);
    }
    return LOSE_MESSAGES[chosenIndex];
  }

  function normalize(input) {
    if (!input) return '';
    return String(input)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '')
      .trim();
  }

  useEffect(() => {
    fetch('https://taylorswiftapi.onrender.com/get')
      .then(res => res.json())
      .then(data => {
        setLyric(data.quote);
        setAlbum(data.album);
        setSong(data.song);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching lyric:', err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const storedStreak = localStorage.getItem('streak');
    if (storedStreak && !Number.isNaN(Number(storedStreak))) {
      setStreak(Number(storedStreak));
    }
  }, []);

  useEffect(() => {
    if (albumGuessedCorrect && songGuessedCorrect && !celebrated) {
      setCelebrated(true);
      const msg = WIN_MESSAGES[Math.floor(Math.random() * WIN_MESSAGES.length)];
      setWinMessage(msg);
      if (typeof window !== 'undefined' && window.confetti) {
        window.confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        window.confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
        });
        window.confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
        });
      }
      celebrationTimeoutRef.current = setTimeout(() => {
        fetchLyric();
      }, 3000);
    }
    return () => {
      if (celebrationTimeoutRef.current) {
        clearTimeout(celebrationTimeoutRef.current);
        celebrationTimeoutRef.current = null;
      }
    };
  }, [albumGuessedCorrect, songGuessedCorrect, celebrated]);

  useEffect(() => {
    if (wrongAttempts >= 3) {
      setStreak(0);
      localStorage.setItem('streak', '0');
    }
  }, [wrongAttempts]);

  if (loading) {
    return (
      <div className="App">
        <h1>Loading...</h1>
      </div>
    );
  }

  function fetchLyric() {
    fetch('https://taylorswiftapi.onrender.com/get')
      .then(res => res.json())
      .then(data => {
        setLyric(data.quote);
        setAlbum(data.album);
        setSong(data.song);
        setAlbumGuess('');
        setSongGuess('');
        setAlbumGuessedCorrect(false);
        setSongGuessedCorrect(false);
        setWrongAttempts(0);
        setWinMessage(null);
        setCelebrated(false);
        setLoseMessage(null);
        setUsedLoseIndices([]);
        setLoseMessageId(0);
        if (loseMessageTimeoutRef.current) {
          clearTimeout(loseMessageTimeoutRef.current);
          loseMessageTimeoutRef.current = null;
        }
      })
      .catch(err => {
        console.error('Error fetching lyric:', err);
      });
  }

  function checkGuesses() {
    if (wrongAttempts >= 3) {
      return;
    }
    const albumGuessNormalized = normalize(albumGuess);
    const songGuessNormalized = normalize(songGuess);

    const isAlbumCorrectThisSubmit =
      !albumGuessedCorrect &&
      albumGuessNormalized &&
      albumGuessNormalized === normalize(album);
    const isSongCorrectThisSubmit =
      !songGuessedCorrect &&
      songGuessNormalized &&
      songGuessNormalized === normalize(song);

    if (isAlbumCorrectThisSubmit) {
      setAlbumGuessedCorrect(true);
    }
    if (isSongCorrectThisSubmit) {
      setSongGuessedCorrect(true);
    }

    const albumCorrectNow = albumGuessedCorrect || isAlbumCorrectThisSubmit;
    const songCorrectNow = songGuessedCorrect || isSongCorrectThisSubmit;
    const bothCorrectNow = albumCorrectNow && songCorrectNow;
    const bothWereCorrectBefore = albumGuessedCorrect && songGuessedCorrect;

    if (!bothWereCorrectBefore && bothCorrectNow) {
      setStreak(prev => {
        const updated = prev + 1;
        localStorage.setItem('streak', String(updated));
        return updated;
      });
    }

    if (!bothCorrectNow) {
      setWrongAttempts(prev => (prev < 3 ? prev + 1 : prev));
      const msg = pickUniqueLoseMessage();
      setLoseMessage(msg);
      setLoseMessageId(prev => prev + 1);
      if (loseMessageTimeoutRef.current) {
        clearTimeout(loseMessageTimeoutRef.current);
      }
      loseMessageTimeoutRef.current = setTimeout(() => {
        setLoseMessage(null);
        loseMessageTimeoutRef.current = null;
      }, 2000);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    checkGuesses();
  }

  const isRoundComplete =
    wrongAttempts >= 3 || (albumGuessedCorrect && songGuessedCorrect);

  return (
    <div className="App">
      <div className="title">Bar & Car</div>
      <div className="container-emojis">
        <div className="emoji">🍸</div>
        <div className="emoji">🚗</div>
        <div className="emoji">🍹</div>
        <div className="emoji">🚙</div>
        <div className="emoji">🥂</div>
        <div className="emoji">🚕</div>
      </div>
      <div className="container-label">
        <strong>Streak:</strong> {streak}
      </div>
      <div className="container-lyric">{lyric}</div>
      <div className="container-attempts-and-reveal">
        <div className="container-wrong-attempts">
          {wrongAttempts > 0 ? '❌'.repeat(wrongAttempts) : null}
        </div>
        {wrongAttempts >= 3 && (
          <div className="container-reveal">
            <div className="container-label">
              <strong>Song:</strong> {song}
            </div>
            <div className="container-label">
              <strong>Album:</strong> {album}
            </div>
          </div>
        )}
      </div>

      <div className="container-form">
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <input
              type="text"
              placeholder="Song"
              value={songGuess}
              onChange={e => setSongGuess(e.target.value)}
              disabled={isRoundComplete}
            />
            <span className="correct">{songGuessedCorrect ? '✅' : ''}</span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Album"
              value={albumGuess}
              onChange={e => setAlbumGuess(e.target.value)}
              disabled={isRoundComplete}
            />
            <span className="correct">{albumGuessedCorrect ? '✅' : ''}</span>
          </div>

          <div className="container-buttons">
            <button type="submit" disabled={isRoundComplete}>
              Check Answers
            </button>
            <button type="button" onClick={fetchLyric}>
              Get New Lyric
            </button>
            {winMessage && <div className="win-message">{winMessage}</div>}
            {loseMessage && (
              <div key={loseMessageId} className="lose-message">
                {loseMessage}
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default App;
