import React, { useState, useEffect, useRef } from "react";

import Translucent from "./Translucent";

function App() {
  const [displayTranslucent, setDisplayTranslucent] = useState(false);
  const [obituaries, setObituaries] = useState(null);

  async function getOrbituaries() {
    const promise = await fetch(
      "https://l3hyhc2oh26oitky5jd5uvipd40ihcpo.lambda-url.ca-central-1.on.aws",
      {
        method: "POST",
      }
    );

    const resultObituaries = await promise.json();
    const sortedObituaries = resultObituaries.sort(
      (a, b) => a.number - b.number
    );
    setObituaries(sortedObituaries);
    console.log(sortedObituaries);
  }

  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
  };

  const formatDate = (when) => {
    const formatted = new Date(when).toLocaleString("en-US", options);
    if (formatted === "Invalid Date") {
      return "";
    }

    return formatted;
  };

  useEffect(() => {
    getOrbituaries();
  }, []);

  const Obituary = ({ name, born, died, image, chatgpt, polly }) => {
    const audioRef = useRef(null);

    const handlePlayPause = () => {
      const audio = audioRef.current;
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    };

    return (
      <div className="obituary">
        <img
          className="dead-images"
          src={image.replace("/upload", "/upload/e_art:zorro")}
          alt={name}
        />
        <div className="name-date-container">
          <h2 className="names">{name}</h2>
          <p className="dates">
            {formatDate(born)} - {formatDate(died)}
          </p>
        </div>
        <p className="descriptions">{chatgpt}</p>
        <audio ref={audioRef} src={polly} />
        <button onClick={handlePlayPause}>Play/Pause</button>
      </div>
    );
  };

  const handleClick = () => {
    setDisplayTranslucent(true);
  };

  const handleClose = () => {
    setDisplayTranslucent(false);
    getOrbituaries();
  };
  //return <h1>The Last Show</h1>;
  return (
    <div>
      <header>
        <h1>The Last Show</h1>
        <button className="new-obituary" onClick={handleClick}>
          + New Obituary
        </button>
      </header>
      {displayTranslucent && <Translucent onClose={handleClose} />}
      {obituaries ? (
        <div className="obituary-container">
          {obituaries.map(
            (obituary, index) =>
              // wrap every 4 obituaries in a row div
              index % 4 === 0 && (
                <div className="obituary-row" key={obituary.id}>
                  <Obituary
                    name={obituary.name}
                    born={obituary.born}
                    died={obituary.died}
                    image={obituary.image}
                    chatgpt={obituary.chatgpt}
                    polly={obituary.polly}
                  />
                  {obituaries.slice(index + 1, index + 4).map((obituary) => (
                    <Obituary
                      key={obituary.id}
                      name={obituary.name}
                      born={obituary.born}
                      died={obituary.died}
                      image={obituary.image}
                      chatgpt={obituary.chatgpt}
                      polly={obituary.polly}
                    />
                  ))}
                </div>
              )
          )}
        </div>
      ) : (
        <h3 className="obituary-verification">No Obituary Yet.</h3>
      )}
    </div>
  );
}

export default App;
