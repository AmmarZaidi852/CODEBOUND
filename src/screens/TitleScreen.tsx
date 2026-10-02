import './TitleScreen.css'

function TitleScreen() {
  return (
    <main className="title-screen">
      <p className="title-screen__tag">&gt; python.init()</p>
      <h1 className="title-screen__logo">CODEBOUND</h1>
      <p className="title-screen__tagline">
        Learn Python by playing games and solving coding challenges.
      </p>
      <p className="title-screen__status">
        Foundation build — game coming soon
      </p>
    </main>
  )
}

export default TitleScreen
