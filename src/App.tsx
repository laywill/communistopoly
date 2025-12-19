import Board from './components/board/Board'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>КОММУНИСТОПОЛИЯ</h1>
        <p className="tagline">"All players are equal, but some are more equal than others"</p>
      </header>
      <Board />
    </div>
  )
}

export default App
