import React, { useState, useEffect, useRef } from "react";
import "./App.css";
import { Settings, RefreshCw, Maximize, Minimize, Upload } from "lucide-react";

function App() {
  // Timer states
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [timerMode, setTimerMode] = useState("pomodoro"); // 'pomodoro', 'shortBreak', 'longBreak'

  // Timer durations in seconds
  const timerDurations = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60,
  };

  // Reference for the interval
  const timerRef = useRef(null);

  const wallpapers = {
    pomodoro: "https://images.unsplash.com/photo-1519681393784-d120267933ba", // Mountain peaks
    shortBreak: "https://images.unsplash.com/photo-1626081708119-99cb0eff1f4c", // Dark mountain peaks at night
    longBreak: "https://images.unsplash.com/photo-1448375240586-882707db888b", // Forest
  };

  const gradients = {
    pomodoro:
      "linear-gradient(180deg, rgba(128, 91, 143, 0.6) 0%, rgba(53, 92, 125, 0.8) 100%)",
    shortBreak:
      "linear-gradient(180deg, rgba(91, 143, 128, 0.6) 0%, rgba(53, 125, 104, 0.8) 100%)",
    longBreak:
      "linear-gradient(180deg, rgba(91, 110, 143, 0.6) 0%, rgba(53, 74, 125, 0.8) 100%)",
  };

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Add state for custom wallpaper
  const [customWallpaper, setCustomWallpaper] = useState(null);

  // Reference to the file input
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  // Handle file selection
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const fileUrl = URL.createObjectURL(file);
      setCustomWallpaper(fileUrl);

      // Apply the custom wallpaper
      document.documentElement.style.setProperty(
        "--background-image",
        `url('${fileUrl}')`
      );

      // Reset the file input
      event.target.value = "";
    }
  };

  // Trigger file input click
  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  // Modify switchMode to preserve custom wallpaper if it exists
  const switchMode = (mode) => {
    setTimerMode(mode);
    setTimeLeft(timerDurations[mode]);
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    // Only update wallpaper if no custom one is set
    if (!customWallpaper) {
      document.documentElement.style.setProperty(
        "--background-image",
        `url('${wallpapers[mode]}')`
      );
    }

    // Always update the gradient
    document.documentElement.style.setProperty(
      "--overlay-gradient",
      gradients[mode]
    );
  };

  // Start/Pause timer
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Reset timer
  const resetTimer = () => {
    setTimeLeft(timerDurations[timerMode]);
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  // Timer effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timer finished
            setIsRunning(false);
            clearInterval(timerRef.current);

            // Play the sound when timer ends
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch((err) => {
                console.error("Error playing sound:", err);
              });
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Update document title with current timer
  useEffect(() => {
    document.title = `${formatTime(timeLeft)} - focus.so`;
  }, [timeLeft]);

  // Add an effect to set initial wallpaper
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--background-image",
      `url('${wallpapers[timerMode]}')`
    );
    document.documentElement.style.setProperty(
      "--overlay-gradient",
      gradients[timerMode]
    );

    // Preload all background images
    Object.values(wallpapers).forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, []);

  // Add this effect to handle the beforeunload event
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isRunning) {
        // Show warning only if timer is running
        e.preventDefault();
        e.returnValue =
          "Timer is still running. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isRunning]);

  // Add a state to track fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error(
            `Error attempting to enable fullscreen: ${err.message}`
          );
        });
    } else {
      if (document.exitFullscreen) {
        document
          .exitFullscreen()
          .then(() => {
            setIsFullscreen(false);
          })
          .catch((err) => {
            console.error(
              `Error attempting to exit fullscreen: ${err.message}`
            );
          });
      }
    }
  };

  // Listen for fullscreen change events
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Add a keydown listener for "f" to toggle fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === "f") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleFullscreen]);

  return (
    <div className="app-container">
      <header className="header">
        <div className="logo">focus.so</div>
        <div className="subtitle">by zak</div>
      </header>

      <main className="main-content">
        <div className="timer-controls">
          <button
            className={`mode-btn ${timerMode === "pomodoro" ? "active" : ""}`}
            onClick={() => switchMode("pomodoro")}
          >
            pomodoro
          </button>
          <button
            className={`mode-btn ${timerMode === "shortBreak" ? "active" : ""}`}
            onClick={() => switchMode("shortBreak")}
          >
            short break
          </button>
          <button
            className={`mode-btn ${timerMode === "longBreak" ? "active" : ""}`}
            onClick={() => switchMode("longBreak")}
          >
            long break
          </button>
        </div>

        <div className="timer-display">{formatTime(timeLeft)}</div>

        <div className="action-controls">
          <button className="primary-btn" onClick={toggleTimer}>
            {isRunning ? "pause" : "start"}
          </button>
          <button className="icon-btn" onClick={resetTimer}>
            <RefreshCw size={24} />
          </button>
          <button className="icon-btn">
            <Settings size={24} />
          </button>
        </div>
      </main>

      {/* Add hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: "none" }}
      />

      {/* Add upload wallpaper button */}
      <button
        className="wallpaper-btn"
        onClick={handleUploadClick}
        title="Upload your own wallpaper"
      >
        <Upload size={20} />
      </button>

      {/* Update fullscreen button to use a tooltip */}
      <button
        className="fullscreen-btn"
        onClick={toggleFullscreen}
        title={isFullscreen ? "Exit fullscreen" : "Fullscreen your timer"}
      >
        {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
      </button>

      {/* Add hidden audio element */}
      <audio ref={audioRef} src="/bell.mp3" preload="auto" />
    </div>
  );
}

export default App;
