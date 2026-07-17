'use client';
import { useState, useEffect } from 'react';

export default function AssessmentPage() {
  const [filteredQuestions, setFilteredQuestions] = useState<any[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [difficulties, setDifficulties] = useState<string[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});

  // Proctoring
  useEffect(() => {
    if (!hasStarted || isSubmitted) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(prev => {
          const newCount = prev + 1;
          if (newCount >= 2) {
            alert("Malpractice detected: Test auto-submitted.");
            setIsSubmitted(true);
          } else {
            alert("Warning: Tab switching is not allowed!");
          }
          return newCount;
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [hasStarted, isSubmitted]);

  // Fetching
  useEffect(() => {
    fetch('http://localhost:8000/topics').then(res => res.json()).then(data => setTopics(data.topics || []));
  }, []);

  useEffect(() => {
    if (selectedTopic) {
      fetch(`http://localhost:8000/difficulties?topic=${encodeURIComponent(selectedTopic)}`)
        .then(res => res.json()).then(data => setDifficulties(data.difficulties || []));
    }
  }, [selectedTopic]);

  const handleStartTest = async () => {
    const res = await fetch(`http://localhost:8000/exams/questions-by-topic?topic=${encodeURIComponent(selectedTopic)}&difficulty=${encodeURIComponent(selectedDifficulty)}`);
    const data = await res.json();
    if (data.questions?.length > 0) {
      setFilteredQuestions(data.questions);
      setHasStarted(true);
    }
  };

  if (isSubmitted) return <div className="p-10 text-center font-bold text-xl">Test Submitted.</div>;

  if (!hasStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 bg-white shadow rounded-xl w-full max-w-sm">
          <h1 className="text-xl font-bold mb-4">Aptitude Assessment</h1>
          <select onChange={(e) => setSelectedTopic(e.target.value)} className="w-full p-2 border mb-4 rounded"><option>Select Topic...</option>{topics.map(t => <option key={t} value={t}>{t}</option>)}</select>
          <select onChange={(e) => setSelectedDifficulty(e.target.value)} className="w-full p-2 border mb-4 rounded"><option>Select Difficulty...</option>{difficulties.map(d => <option key={d} value={d}>{d}</option>)}</select>
          <button onClick={handleStartTest} className="w-full bg-blue-600 text-white p-2 rounded">Start Test</button>
        </div>
      </div>
    );
  }

  const currentQ = filteredQuestions[currentIdx];

  return (
    <div className="max-w-2xl mx-auto p-10">
      <h1 className="text-2xl font-bold mb-4">Aptitude Assessment</h1>
      <div className="flex justify-between mb-4 text-sm text-gray-500 font-bold border-b pb-2">
        <span>Question {currentIdx + 1} / {filteredQuestions.length}</span>
        <span className={tabSwitches >= 1 ? "text-red-600" : ""}>Warnings: {tabSwitches} / 2</span>
      </div>
      
      <h2 className="text-lg mb-6 whitespace-pre-wrap">{currentQ.question_text}</h2>
      
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Your Answer:</label>
        <input
          type="text"
          className="w-full p-4 border-2 border-gray-200 rounded-lg focus:border-blue-500 outline-none"
          placeholder="Type your answer here..."
          value={selectedAnswers[currentQ.id] || ''}
          onChange={(e) => setSelectedAnswers({...selectedAnswers, [currentQ.id]: e.target.value})}
        />
      </div>

      <div className="mt-8 flex justify-between">
        <button 
          disabled={currentIdx === 0} 
          onClick={() => setCurrentIdx(prev => prev - 1)} 
          className="px-6 py-2 bg-gray-500 text-white rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button 
          onClick={() => currentIdx === filteredQuestions.length - 1 ? setIsSubmitted(true) : setCurrentIdx(prev => prev + 1)} 
          className="px-6 py-2 bg-blue-600 text-white rounded"
        >
          {currentIdx === filteredQuestions.length - 1 ? "Submit" : "Next"}
        </button>
      </div>
    </div>
  );
}