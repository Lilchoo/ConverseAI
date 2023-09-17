import React, { useState, useEffect } from "react";
import Textarea from "@mui/joy/Textarea";
import Button from "@mui/joy/Button";
import Box from "@mui/joy/Box";
import { Send, HeadphonesOutlined } from "@mui/icons-material/";
import Typography from "@mui/material/Typography";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import "./App.css";

function App() {
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState("");
  const [query, setQuery] = useState("");
  const [audio, setAudio] = useState("");
  const [voicePromptQueue, setVoicePromptQueue] = useState([]);
  const [chatHistory, setChatHistory] = useState([]); // Store chat history
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (audio) {
      const audioElement = document.getElementById("audio");
      if (audioElement) {
        audioElement.load();
        audioElement.play();
      }
    }
  }, [audio]);

  useEffect(() => {
    setQuery(transcript);
    if (transcript && !listening) {
      // Add the user's voice prompt to the queue and chat history
      addToVoicePromptQueue(transcript, true);
    }
  }, [transcript, listening]);

  useEffect(() => {
    if (voicePromptQueue.length > 0) {
      generateStory();
    }
  }, [voicePromptQueue]);

  const startListening = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: false });
  };

  const stopListening = () => {
    SpeechRecognition.stopListening();
  };

  const generateStory = () => {
    setLoading(true);
    const nextVoicePrompt = voicePromptQueue.shift();
    console.log("story about: ", nextVoicePrompt);

    // Add the user's voice prompt to chat history
    setChatHistory([...chatHistory, { text: nextVoicePrompt, isUser: true }]);

    fetch(`http://127.0.0.1:8000/chat/chatgpt/${nextVoicePrompt}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Request failed");
        }
      })
      .then((data) => {
        console.log("story: ", data);
        if (data) {
          setStory(data);

          // Add the AI's response to chat history
          setChatHistory([...chatHistory, { text: data, isUser: false }]);
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const generateAudio = () => {
    setLoading(true);
    console.log("audio about: ", story);

    fetch(`http://127.0.0.1:8000/voice/${story}`, {
      method: "GET",
      headers: {
        accept: "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw Error("Request failed");
        }
      })
      .then((data) => {
        console.log("audio path: ", data);
        if (data) {
          setAudio(data);
        }
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const addToVoicePromptQueue = (prompt, isUser) => {
    // Add the voice prompt to the queue and chat history
    setVoicePromptQueue([...voicePromptQueue, prompt]);
    setChatHistory([...chatHistory, { text: prompt, isUser }]);
  };

  const handleStartButtonClick = () => {
    startListening();
  };

  const handleStopButtonClick = () => {
    stopListening();
  };

  return (
    <Box
      sx={{
        marginTop: "32px",
        marginBottom: "32px",
        display: "flex",
        flexWrap: "wrap",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        minHeight: "100vh",
      }}
    >
      <Typography variant="h5" component="h5">
        ConverseAI
      </Typography>
      <div>
        <p>Microphone: {listening ? "on" : "off"}</p>
        <Button
          type="start"
          sx={{ marginTop: "16px", marginRight: "16px" }}
          onClick={handleStartButtonClick}
        >
          Start
        </Button>
        <Button
          type="stop"
          sx={{ marginTop: "16px", marginLeft: "16px" }}
          onClick={handleStopButtonClick}
        >
          Stop
        </Button>
      </div>
      <Box sx={{ marginTop: "32px", width: "600px" }}>
        <form onSubmit={"handleSubmit"}>
          {/* Input voice prompt */}
          <div className="voice-prompt-box">
            <Textarea
              value={query}
              sx={{ width: "100%" }}
              onChange={(e) => setQuery(e.target.value)}
              minRows={2}
              maxRows={4}
              placeholder="Type anything…"
            />
            <Button
              disabled={loading || query === ""}
              type="submit"
              sx={{ marginTop: "16px" }}
              loading={loading}
            >
              <Send />
            </Button>
          </div>
        </form>
      </Box>
      {story && (
        <Box sx={{ marginTop: "32px", width: "600px" }}>
          {/* Chat history */}
          <div className="chat-history-box">
            {chatHistory.map((item, index) => (
              <div
                key={index}
                className={item.isUser ? "user-message" : "ai-message"}
              >
                {item.text}
              </div>
            ))}
          </div>

          {/* Output story */}
          <div className="output-story-box">
            <Textarea sx={{ width: "100%" }} value={story} />
            <Button
              loading={loading}
              sx={{ marginTop: "16px" }}
              onClick={generateAudio}
            >
              <HeadphonesOutlined />
            </Button>
          </div>

          {/* Audio player */}
          <div className="audio-player-box">
            {audio && (
              <div>
                <audio id="audio" controls>
                  <source src={audio} type="audio/mpeg" />
                  Your browser does not support the audio element.
                </audio>
              </div>
            )}
          </div>
        </Box>
      )}
    </Box>
  );
}

export default App;
