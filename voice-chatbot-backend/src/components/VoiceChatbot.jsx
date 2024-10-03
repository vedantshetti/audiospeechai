import React, { useState } from 'react';
import { ReactMic } from 'react-mic';
import axios from 'axios';

const VoiceChatbot = () => {
  const [record, setRecord] = useState(false);
  const [text, setText] = useState('');
  const [response, setResponse] = useState('');

  const startRecording = async () => {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const audioContext = new AudioContext();
      await audioContext.resume();
    }

    setRecord(true);
  };

  const stopRecording = async (recordedBlob) => {
    console.log('Recorded Blob:', recordedBlob);
    setRecord(false);
    const formData = new FormData();

    if (recordedBlob && recordedBlob.blob) {
      formData.append('audio', recordedBlob.blob, 'recording.wav');
    } else {
      console.error('recordedBlob.blob is not available:', recordedBlob);
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/audio', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setText(res.data.text);
      setResponse(res.data.response);
    } catch (error) {
      console.error('Error sending audio:', error);
    }
  };

  return (
    <div>
      <button className="record-button" onClick={record ? stopRecording : startRecording}>
        {record ? 'Stop' : 'Record'}
      </button>
      <ReactMic
        record={record}
        className="sound-wave"
        onStop={stopRecording}
        strokeColor="#000000"
        backgroundColor="#FF4081" 
      />
      <div className="transcribed-text">Transcribed Text: {text}</div>
      <div className="chatbot-response">
        Chatbot Response: 
        {response && (
          <a href={response} target="_blank" rel="noopener noreferrer">
            Listen to the response
          </a>
        )}
      </div>
      {response && (
        <audio controls>
          <source src={response} type="audio/mpeg" />
          Your browser does not support the audio tag.
        </audio>
      )}
    </div>
  );
};

export default VoiceChatbot;
