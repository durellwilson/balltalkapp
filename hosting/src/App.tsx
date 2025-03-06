import './App.css';
import SongList from './components/SongList';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Ball Talk - Song Preview</h1>
      </header>
      <main>
        <SongList />
      </main>
    </div>
  );
}

export default App;
