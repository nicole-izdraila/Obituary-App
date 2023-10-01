import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";

const Translucent = ({ onClose }) => {
  const [name, setName] = useState("");
  const [born, setBorn] = useState("");
  const [died, setDied] = useState("");
  const [file, setFile] = useState(null);
  const [number, setNumber] = useState(0);

  const onSubmitForm = async (e) => {
    e.preventDefault();
    const data = new FormData();

    data.append("file", file);
    data.append("name", name);
    data.append("born", born);
    data.append("died", died);
    data.append("id", uuidv4());
    data.append("number", number);

    setNumber(number + 1);

    console.log(data);

    //there is a / on the URL that the proff didn't copy
    const promise = await fetch(
      "https://s6cc7k3y57s3pqbp6f7qfhjf6m0rakdt.lambda-url.ca-central-1.on.aws",
      {
        method: "POST",
        body: data,
      }
    );

    const result = await promise.json();
    console.log(result);
    onClose();
  };

  const onFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div className="translucent-page">
      <form onSubmit={(e) => onSubmitForm(e)}>
        <h2>Create A New Obituary</h2>
        <label htmlFor="file-input" className="file-label">
          Select an image for the deceased
        </label>
        <input
          id="file-input"
          type="file"
          required
          accept="image/*"
          onChange={onFileChange}
          style={{ display: "none" }}
        />
        {file && <p>{file.name}</p>}
        <input
          className="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name of the deceased"
        />
        <div className="date-inputs">
          <p>Born: </p>
          <input
            value={born}
            required
            onChange={(e) => setBorn(e.target.value)}
            type="datetime-local"
          />
          <p>Died: </p>
          <input
            value={died}
            required
            onChange={(e) => setDied(e.target.value)}
            type="datetime-local"
          />
        </div>
        <button
          className="submit"
          type="submit"
          onClick={(e) => onSubmitForm(e)}
        >
          Write Obituary
        </button>
        <button className="x" onClick={onClose}>
          X
        </button>
      </form>
    </div>
  );
};

export default Translucent;
// dymanodb name, born, died, prompt from gpt, turl: image url from cloudinary and the second is the audio url from cloudinary
