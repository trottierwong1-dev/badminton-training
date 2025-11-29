import React, { useState, useEffect } from 'react';
import { Calendar, Clock, TrendingUp, Users, PlayCircle, Award, Plus, X, Check, ChevronRight, BarChart3, Target, Timer } from 'lucide-react';

const BadmintonTrainingApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userRole, setUserRole] = useState('player');
  const [sessions, setSessions] = useState([]);
  const [drills, setDrills] = useState([
    { id: 1, name: 'Shadow Footwork', category: 'Footwork', duration: 15, difficulty: 'Beginner', description: 'Practice court movement without shuttlecock' },
    { id: 2, name: 'Net Kill Practice', category: 'Shots', duration: 20, difficulty: 'Intermediate', description: 'Improve net shots and kills' },
    { id: 3, name: 'Smash Training', category: 'Shots', duration: 25, difficulty: 'Advanced', description: 'Power and accuracy smash drills' },
    { id: 4, name: 'Endurance Rally', category: 'Stamina', duration: 30, difficulty: 'Intermediate', description: 'Continuous rally practice' },
    { id: 5, name: 'Drop Shot Accuracy', category: 'Shots', duration: 15, difficulty: 'Intermediate', description: 'Precision drop shot placement' },
    { id: 6, name: 'Defense Drill', category: 'Defense', duration: 20, difficulty: 'Advanced', description: 'Defensive positioning and clears' }
  ]);
  const [activeTimer, setActiveTimer] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [showAddSession, setShowAddSession] = useState(false);
  const [showDrillTimer, setShowDrillTimer] = useState(false);
  const [selectedDrill, setSelectedDrill] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [metrics, setMetrics] = useState({
    totalSessions: 0,
    totalHours: 0,
    skillLevels: { footwork: 65, shots: 70, stamina: 60, defense: 55 }
  });
  const [scheduleFormData, setScheduleFormData] = useState({
    date: '',
    time: '',
    drill: ''
  });
  const [showSixCorners, setShowSixCorners] = useState(false);
  const [sixCornersConfig, setSixCornersConfig] = useState({
    sets: 3,
    shotsPerSet: 20,
    restBetweenShots: 2.0,
    restBetweenSets: 30
  });
  const [sixCornersState, setSixCornersState] = useState({
    isRunning: false,
    currentSet: 1,
    currentShot: 0,
    phase: 'ready', // 'ready', 'active', 'restShot', 'restSet'
    timeRemaining: 3,
    totalSets: 3,
    currentCorner: null,
    nextCorner: null
  });

  // Auto-open 9 Corners Shadow training if URL has #9corners
  useEffect(() => {
    const hash = window.location.hash;
    console.log('Current hash:', hash); // Debug log
    if (hash === '#9corners' || hash === '#9-corners') {
      console.log('Opening 9 Corners Shadow training'); // Debug log
      setTimeout(() => {
        setShowSixCorners(true);
      }, 100);
      // Clean up hash
      if (window.history.replaceState) {
        window.history.replaceState(null, null, window.location.pathname);
      }
    }
  }, []);

  useEffect(() => {
    let interval;
    if (activeTimer) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer]);

  useEffect(() => {
    let interval;
    if (sixCornersState.isRunning) {
      interval = setInterval(() => {
        setSixCornersState(prev => {
          if (prev.timeRemaining > 0.25) {
            return { ...prev, timeRemaining: Math.round((prev.timeRemaining - 0.25) * 100) / 100 };
          }
          
          // Time's up, transition to next phase
          if (prev.phase === 'ready') {
            // Get ready time over, show first shot
            const firstCorner = getRandomCorner();
            speakCorner(firstCorner);
            return {
              ...prev,
              phase: 'active',
              currentShot: 1,
              currentCorner: firstCorner,
              nextCorner: getRandomCorner(firstCorner),
              timeRemaining: 0
            };
          } else if (prev.phase === 'active') {
            // Shot displayed, now rest (no screen change)
            return {
              ...prev,
              phase: 'restShot',
              timeRemaining: sixCornersConfig.restBetweenShots
            };
          } else if (prev.phase === 'restShot') {
            // Rest between shots done
            if (prev.currentShot < sixCornersConfig.shotsPerSet) {
              // Show next shot
              const newCorner = prev.nextCorner;
              speakCorner(newCorner);
              return {
                ...prev,
                phase: 'active',
                currentShot: prev.currentShot + 1,
                currentCorner: newCorner,
                nextCorner: getRandomCorner(newCorner),
                timeRemaining: 0
              };
            } else {
              // Set complete
              if (prev.currentSet < prev.totalSets) {
                // Rest between sets
                if ('speechSynthesis' in window) {
                  const utterance = new SpeechSynthesisUtterance(`Set complete. Rest for ${sixCornersConfig.restBetweenSets} seconds`);
                  window.speechSynthesis.speak(utterance);
                }
                return {
                  ...prev,
                  phase: 'restSet',
                  timeRemaining: sixCornersConfig.restBetweenSets
                };
              } else {
                // Workout complete
                if ('speechSynthesis' in window) {
                  const utterance = new SpeechSynthesisUtterance('Workout complete! Great job!');
                  window.speechSynthesis.speak(utterance);
                }
                const totalTime = (sixCornersConfig.shotsPerSet * sixCornersConfig.restBetweenShots * sixCornersConfig.sets) + 
                                 (sixCornersConfig.restBetweenSets * (sixCornersConfig.sets - 1)) + 3;
                const newSession = {
                  id: Date.now(),
                  drillName: '9 Corners Shadow',
                  duration: totalTime / 60,
                  date: new Date().toISOString(),
                  category: 'Footwork',
                  notes: `${sixCornersConfig.sets} sets, ${sixCornersConfig.shotsPerSet} shots per set`
                };
                setSessions(prevSessions => [newSession, ...prevSessions]);
                setShowSixCorners(false);
                return {
                  isRunning: false,
                  currentSet: 1,
                  currentShot: 0,
                  phase: 'ready',
                  timeRemaining: 3,
                  totalSets: sixCornersConfig.sets,
                  currentCorner: null,
                  nextCorner: null
                };
              }
            }
          } else if (prev.phase === 'restSet') {
            // Rest between sets done, start next set
            const firstCorner = getRandomCorner();
            if ('speechSynthesis' in window) {
              const utterance = new SpeechSynthesisUtterance(`Starting set ${prev.currentSet + 1}`);
              window.speechSynthesis.speak(utterance);
              setTimeout(() => speakCorner(firstCorner), 1500);
            }
            return {
              ...prev,
              currentSet: prev.currentSet + 1,
              currentShot: 1,
              phase: 'active',
              currentCorner: firstCorner,
              nextCorner: getRandomCorner(firstCorner),
              timeRemaining: 0
            };
          }
          
          return prev;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [sixCornersState.isRunning, sixCornersConfig]);

  useEffect(() => {
    const total = sessions.length;
    const hours = sessions.reduce((sum, s) => sum + s.duration, 0) / 60;
    setMetrics(prev => ({ ...prev, totalSessions: total, totalHours: hours.toFixed(1) }));
  }, [sessions]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRandomCorner = (excludeCurrent = null) => {
    const corners = [
      { 
        id: 1, 
        name: '2', 
        position: { bottom: '20%', right: '20%' }, 
        voice: '2', 
        shots: [
          { name: 'Lift', variations: ['Cross', 'Straight'], target: { top: '20%', right: '20%' } },
          { name: 'Clear', variations: ['Cross', 'Straight'], target: { top: '15%', left: '20%' } },
          { name: 'Drop', variations: ['Cross', 'Straight', 'Tight'], target: { top: '48%', left: '20%' } },
          { name: 'Smash', variations: ['Cross', 'Straight', 'Short'], target: { top: '30%', left: '20%' } },
          { name: 'Drive', variations: ['Cross', 'Straight'], target: { top: '25%', left: '15%' } }
        ]
      },
      { 
        id: 2, 
        name: '1', 
        position: { bottom: '35%', right: '20%' }, 
        voice: '1', 
        shots: [
          { name: 'Net', variations: ['Cross', 'Straight', 'Tumbling'], target: { top: '48%', left: '20%' } },
          { name: 'Kill', variations: ['Cross', 'Straight'], target: { top: '40%', left: '20%' } },
          { name: 'Push', variations: ['Cross', 'Flat'], target: { top: '35%', left: '20%' } },
          { name: 'Lift', variations: ['Cross', 'Straight'], target: { top: '20%', right: '20%' } }
        ]
      },
      { 
        id: 3, 
        name: '3', 
        position: { bottom: '10%', right: '20%' }, 
        voice: '3', 
        shots: [
          { name: 'Clear', variations: ['Cross', 'Straight'], target: { top: '15%', left: '20%' } },
          { name: 'Drop', variations: ['Cross', 'Straight', 'Tight'], target: { top: '48%', left: '20%' } },
          { name: 'Smash', variations: ['Cross', 'Straight', 'Short'], target: { top: '30%', left: '20%' } }
        ]
      },
      { 
        id: 4, 
        name: '4', 
        position: { bottom: '10%', left: '20%' }, 
        voice: '4', 
        shots: [
          { name: 'Clear', variations: ['Cross', 'Straight'], target: { top: '15%', right: '20%' } },
          { name: 'Drop', variations: ['Cross', 'Straight', 'Tight'], target: { top: '48%', right: '20%' } },
          { name: 'Smash', variations: ['Cross', 'Straight', 'Short'], target: { top: '30%', right: '20%' } }
        ]
      },
      { 
        id: 5, 
        name: '6', 
        position: { bottom: '35%', left: '20%' }, 
        voice: '6', 
        shots: [
          { name: 'Net', variations: ['Cross', 'Straight', 'Tumbling'], target: { top: '48%', right: '20%' } },
          { name: 'Kill', variations: ['Cross', 'Straight'], target: { top: '40%', right: '20%' } },
          { name: 'Push', variations: ['Cross', 'Flat'], target: { top: '35%', right: '20%' } },
          { name: 'Lift', variations: ['Cross', 'Straight'], target: { top: '20%', left: '20%' } }
        ]
      },
      { 
        id: 6, 
        name: '5', 
        position: { bottom: '20%', left: '20%' }, 
        voice: '5', 
        shots: [
          { name: 'Lift', variations: ['Cross', 'Straight'], target: { top: '20%', left: '20%' } },
          { name: 'Clear', variations: ['Cross', 'Straight'], target: { top: '15%', right: '20%' } },
          { name: 'Drop', variations: ['Cross', 'Straight', 'Tight'], target: { top: '48%', right: '20%' } },
          { name: 'Smash', variations: ['Cross', 'Straight', 'Short'], target: { top: '30%', right: '20%' } },
          { name: 'Drive', variations: ['Cross', 'Straight'], target: { top: '25%', right: '15%' } }
        ]
      },
      { 
        id: 7, 
        name: '8', 
        position: { bottom: '20%', left: '50%' }, 
        voice: '8', 
        shots: [
          { name: 'Lift', variations: ['Cross', 'Straight'], target: { top: '20%', left: '50%' } },
          { name: 'Clear', variations: ['Cross', 'Straight'], target: { top: '15%', right: '20%' } },
          { name: 'Drop', variations: ['Cross', 'Straight', 'Tight'], target: { top: '48%', right: '20%' } },
          { name: 'Smash', variations: ['Cross', 'Straight', 'Short'], target: { top: '25%', right: '20%' } },
          { name: 'Drive', variations: ['Cross', 'Straight'], target: { top: '25%', right: '15%' } }
        ]
      },
      { 
        id: 8, 
        name: '7', 
        position: { bottom: '35%', left: '50%' }, 
        voice: '7', 
        shots: [
          { name: 'Net', variations: ['Cross', 'Straight', 'Tumbling'], target: { top: '48%', right: '20%' } },
          { name: 'Kill', variations: ['Cross', 'Straight'], target: { top: '40%', right: '20%' } },
          { name: 'Push', variations: ['Cross', 'Flat'], target: { top: '35%', right: '20%' } },
          { name: 'Lift', variations: ['Cross', 'Straight'], target: { top: '20%', right: '20%' } }
        ]
      },
      { 
        id: 9, 
        name: '9', 
        position: { bottom: '10%', left: '50%' }, 
        voice: '9', 
        shots: [
          { name: 'Clear', variations: ['Cross', 'Straight'], target: { top: '15%', right: '20%' } },
          { name: 'Drop', variations: ['Cross', 'Straight', 'Tight'], target: { top: '48%', right: '20%' } },
          { name: 'Smash', variations: ['Cross', 'Straight', 'Short'], target: { top: '25%', right: '20%' } }
        ]
      }
    ];
    
    let availableCorners = corners;
    if (excludeCurrent) {
      availableCorners = corners.filter(c => c.id !== excludeCurrent.id);
    }
    
    const selectedCorner = availableCorners[Math.floor(Math.random() * availableCorners.length)];
    const selectedShot = selectedCorner.shots[Math.floor(Math.random() * selectedCorner.shots.length)];
    const selectedVariation = selectedShot.variations[Math.floor(Math.random() * selectedShot.variations.length)];
    
    return {
      id: selectedCorner.id,
      name: selectedCorner.name,
      position: selectedCorner.position,
      voice: selectedCorner.voice,
      shots: selectedCorner.shots,
      shot: selectedShot.name,
      variation: selectedVariation,
      target: selectedShot.target,
      fullName: `${selectedVariation} ${selectedShot.name}, ${selectedCorner.name}`
    };
  };

  const speakCorner = (corner) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(corner.fullName);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const startDrill = (drill) => {
    setSelectedDrill(drill);
    setShowDrillTimer(true);
    setActiveTimer(drill.id);
    setTimerSeconds(0);
  };

  const stopDrill = () => {
    const newSession = {
      id: Date.now(),
      drillName: selectedDrill.name,
      duration: timerSeconds / 60,
      date: new Date().toISOString(),
      category: selectedDrill.category,
      notes: ''
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveTimer(null);
    setTimerSeconds(0);
    setShowDrillTimer(false);
    setSelectedDrill(null);
  };

  const addScheduledSession = (date, drill, time) => {
    setSchedule(prev => [...prev, {
      id: Date.now(),
      date,
      drill,
      time,
      completed: false
    }]);
  };

  const DashboardView = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Sessions</p>
              <p className="text-3xl font-bold mt-1">{metrics.totalSessions}</p>
            </div>
            <Calendar className="w-12 h-12 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Training Hours</p>
              <p className="text-3xl font-bold mt-1">{metrics.totalHours}</p>
            </div>
            <Clock className="w-12 h-12 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Avg Skill Level</p>
              <p className="text-3xl font-bold mt-1">
                {Math.round(Object.values(metrics.skillLevels).reduce((a, b) => a + b) / 4)}%
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-purple-200" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-600" />
          Skill Progress
        </h3>
        <div className="space-y-4">
          {Object.entries(metrics.skillLevels).map(([skill, level]) => (
            <div key={skill}>
              <div className="flex justify-between mb-1">
                <span className="capitalize font-medium">{skill}</span>
                <span className="text-gray-600">{level}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${level}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold mb-4">Recent Sessions</h3>
        {sessions.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No sessions yet. Start training to see your history!</p>
        ) : (
          <div className="space-y-3">
            {sessions.slice(0, 5).map(session => (
              <div key={session.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                <div>
                  <p className="font-semibold">{session.drillName}</p>
                  <p className="text-sm text-gray-600">{new Date(session.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-blue-600">{session.duration.toFixed(0)} min</p>
                  <p className="text-sm text-gray-500">{session.category}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const DrillsView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Drill Library</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSixCorners(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition shadow-md"
          >
            <Target className="w-5 h-5" />
            9 Corners Shadow
          </button>
          <select 
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            defaultValue="all"
          >
            <option value="all">All Categories</option>
            <option value="footwork">Footwork</option>
            <option value="shots">Shots</option>
            <option value="stamina">Stamina</option>
            <option value="defense">Defense</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {drills.map(drill => (
          <div key={drill.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg">{drill.name}</h3>
              <span className={`text-xs px-2 py-1 rounded-full ${
                drill.difficulty === 'Beginner' ? 'bg-green-100 text-green-700' :
                drill.difficulty === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
                'bg-red-100 text-red-700'
              }`}>
                {drill.difficulty}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-4">{drill.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Clock className="w-4 h-4" />
                <span>{drill.duration} min</span>
              </div>
              <button
                onClick={() => startDrill(drill)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                <PlayCircle className="w-4 h-4" />
                Start
              </button>
            </div>
          </div>
        ))}
      </div>

      {showDrillTimer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">{selectedDrill.name}</h3>
              <p className="text-gray-600 mb-6">{selectedDrill.description}</p>
              <div className="text-6xl font-bold text-blue-600 mb-8">
                {formatTime(timerSeconds)}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={stopDrill}
                  className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  Complete Session
                </button>
                <button
                  onClick={() => {
                    setActiveTimer(null);
                    setTimerSeconds(0);
                    setShowDrillTimer(false);
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSixCorners && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            {!sixCornersState.isRunning ? (
              <div>
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-purple-900 mb-2">9 Corners Shadow Training</h2>
                  <p className="text-gray-600">Randomized shot placement with visual court guide</p>
                </div>
                
                <div className="bg-white rounded-xl p-6 mb-6 space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-blue-800">
                      <strong>🔊 Audio:</strong> Voice announcements will play when you start training. Make sure your volume is up!
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Number of Sets</label>
                      <select
                        value={sixCornersConfig.sets}
                        onChange={(e) => setSixCornersConfig({...sixCornersConfig, sets: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold"
                        style={{ fontSize: '16px' }}
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                        <option value="5">5</option>
                        <option value="6">6</option>
                        <option value="7">7</option>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Shots Per Set</label>
                      <select
                        value={sixCornersConfig.shotsPerSet}
                        onChange={(e) => setSixCornersConfig({...sixCornersConfig, shotsPerSet: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold"
                        style={{ fontSize: '16px' }}
                      >
                        <option value="5">5</option>
                        <option value="10">10</option>
                        <option value="15">15</option>
                        <option value="20">20</option>
                        <option value="25">25</option>
                        <option value="30">30</option>
                        <option value="35">35</option>
                        <option value="40">40</option>
                        <option value="45">45</option>
                        <option value="50">50</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rest Between Shots (seconds)</label>
                      <select
                        value={sixCornersConfig.restBetweenShots.toFixed(2)}
                        onChange={(e) => setSixCornersConfig({...sixCornersConfig, restBetweenShots: parseFloat(e.target.value)})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold"
                        style={{ fontSize: '16px' }}
                      >
                        <option value="0.50">0.5</option>
                        <option value="0.75">0.75</option>
                        <option value="1.00">1.0</option>
                        <option value="1.25">1.25</option>
                        <option value="1.50">1.5</option>
                        <option value="1.75">1.75</option>
                        <option value="2.00">2.0</option>
                        <option value="2.25">2.25</option>
                        <option value="2.50">2.5</option>
                        <option value="2.75">2.75</option>
                        <option value="3.00">3.0</option>
                        <option value="3.25">3.25</option>
                        <option value="3.50">3.5</option>
                        <option value="3.75">3.75</option>
                        <option value="4.00">4.0</option>
                        <option value="4.25">4.25</option>
                        <option value="4.50">4.5</option>
                        <option value="4.75">4.75</option>
                        <option value="5.00">5.0</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rest Between Sets (seconds)</label>
                      <select
                        value={sixCornersConfig.restBetweenSets}
                        onChange={(e) => setSixCornersConfig({...sixCornersConfig, restBetweenSets: parseInt(e.target.value)})}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold"
                        style={{ fontSize: '16px' }}
                      >
                        <option value="15">15</option>
                        <option value="30">30</option>
                        <option value="45">45</option>
                        <option value="60">60 (1 min)</option>
                        <option value="75">75</option>
                        <option value="90">90 (1.5 min)</option>
                        <option value="120">120 (2 min)</option>
                        <option value="150">150 (2.5 min)</option>
                        <option value="180">180 (3 min)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-100 rounded-xl p-4 mb-6">
                  <h3 className="font-semibold text-purple-900 mb-2">Workout Summary</h3>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-600">Total Sets</p>
                      <p className="text-2xl font-bold text-purple-600">{sixCornersConfig.sets}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-600">Total Shots</p>
                      <p className="text-2xl font-bold text-purple-600">{sixCornersConfig.sets * sixCornersConfig.shotsPerSet}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3">
                      <p className="text-gray-600">Est. Time</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {Math.round(((sixCornersConfig.shotsPerSet * sixCornersConfig.restBetweenShots * sixCornersConfig.sets) + 
                        (sixCornersConfig.restBetweenSets * (sixCornersConfig.sets - 1)) + 3) / 60)} min
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSixCornersState({
                        isRunning: true,
                        currentSet: 1,
                        currentShot: 0,
                        phase: 'ready',
                        timeRemaining: 3,
                        totalSets: sixCornersConfig.sets,
                        currentCorner: null,
                        nextCorner: null
                      });
                    }}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-bold text-lg shadow-lg"
                  >
                    Start Training
                  </button>
                  <button
                    onClick={() => setShowSixCorners(false)}
                    className="flex-1 bg-gray-200 text-gray-700 px-6 py-4 rounded-xl hover:bg-gray-300 transition font-semibold"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <div className="inline-block bg-white rounded-full px-6 py-2 shadow-md">
                    <span className="text-sm font-semibold text-gray-600">Set</span>
                    <span className="text-2xl font-bold text-purple-600 mx-2">{sixCornersState.currentSet}</span>
                    <span className="text-sm font-semibold text-gray-600">of {sixCornersState.totalSets}</span>
                  </div>
                  <div className="inline-block bg-white rounded-full px-6 py-2 shadow-md">
                    <span className="text-sm font-semibold text-gray-600">Shot</span>
                    <span className="text-2xl font-bold text-green-600 mx-2">
                      {sixCornersState.phase === 'restSet' ? sixCornersConfig.shotsPerSet : sixCornersState.currentShot}
                    </span>
                    <span className="text-sm font-semibold text-gray-600">of {sixCornersConfig.shotsPerSet}</span>
                  </div>
                </div>

                {sixCornersState.phase === 'ready' && (
                  <div className="text-center mb-8">
                    <div className="bg-gradient-to-br from-blue-400 to-cyan-500 p-8 rounded-2xl mb-4">
                      <p className="text-white text-2xl font-bold mb-4">GET READY!</p>
                      <div className="text-7xl font-bold text-white">
                        {sixCornersState.timeRemaining}
                      </div>
                    </div>
                  </div>
                )}

                {(sixCornersState.phase === 'active' || sixCornersState.phase === 'restShot') && sixCornersState.currentCorner && (
                  <div className="mb-8">
                    <div className="bg-white rounded-2xl p-6 shadow-lg">
                      <div className="relative bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl p-8" style={{ height: '500px', maxHeight: '70vh', maxWidth: '240px', margin: '0 auto' }}>
                        {/* Badminton court - 13.4m x 6.1m (doubles) scaled to fit */}
                        <div className="absolute inset-8">
                          {/* Outer boundary - doubles court (13.4m x 6.1m) */}
                          <div className="absolute inset-0 border-4 border-white rounded-sm"></div>
                          
                          {/* Singles sidelines - 0.46m from doubles sideline on each side */}
                          <div className="absolute top-0 bottom-0 left-[15.5%] w-1 bg-white"></div>
                          <div className="absolute top-0 bottom-0 right-[15.5%] w-1 bg-white"></div>
                          
                          {/* Center line - divides service courts */}
                          <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-white transform -translate-x-1/2"></div>
                          
                          {/* Short service lines - 1.98m from net */}
                          <div className="absolute left-0 right-0 h-1 bg-white" style={{ top: 'calc(50% - 14.8%)' }}></div>
                          <div className="absolute left-0 right-0 h-1 bg-white" style={{ bottom: 'calc(50% - 14.8%)' }}></div>
                          
                          {/* Long service line for doubles - 0.76m from back line */}
                          <div className="absolute left-0 right-0 h-1 bg-white" style={{ top: '6%' }}></div>
                          <div className="absolute left-0 right-0 h-1 bg-white" style={{ bottom: '6%' }}></div>
                          
                          {/* Net in middle (yellow line) */}
                          <div className="absolute top-1/2 left-0 right-0 h-2 bg-yellow-400 shadow-lg transform -translate-y-1/2 z-20"></div>
                          
                          {/* Court side labels */}
                          <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2 text-white text-xs font-bold opacity-50">
                            OPPONENT
                          </div>
                          <div className="absolute bottom-[20%] left-1/2 transform -translate-x-1/2 text-white text-xs font-bold opacity-50">
                            YOUR SIDE
                          </div>
                        </div>
                        
                        {/* Corner number labels on player's side (bottom half) - only show current corner */}
                        {sixCornersState.currentCorner && sixCornersState.currentCorner.name === '1' && (
                          <div className="absolute" style={{ bottom: '35%', right: '20%', transform: 'translate(50%, 50%)' }}>
                            <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-xl animate-pulse">1</div>
                          </div>
                        )}
                        {sixCornersState.currentCorner && sixCornersState.currentCorner.name === '2' && (
                          <div className="absolute" style={{ bottom: '20%', right: '20%', transform: 'translate(50%, 50%)' }}>
                            <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-xl animate-pulse">2</div>
                          </div>
                        )}
                        {sixCornersState.currentCorner && sixCornersState.currentCorner.name === '3' && (
                          <div className="absolute" style={{ bottom: '10%', right: '20%', transform: 'translate(50%, 50%)' }}>
                            <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-xl animate-pulse">3</div>
                          </div>
                        )}
                        {sixCornersState.currentCorner && sixCornersState.currentCorner.name === '4' && (
                          <div className="absolute" style={{ bottom: '10%', left: '20%', transform: 'translate(-50%, 50%)' }}>
                            <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-xl animate-pulse">4</div>
                          </div>
                        )}
                        {sixCornersState.currentCorner && sixCornersState.currentCorner.name === '5' && (
                          <div className="absolute" style={{ bottom: '20%', left: '20%', transform: 'translate(-50%, 50%)' }}>
                            <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-xl animate-pulse">5</div>
                          </div>
                        )}
                        {sixCornersState.currentCorner && sixCornersState.currentCorner.name === '6' && (
                          <div className="absolute" style={{ bottom: '35%', left: '20%', transform: 'translate(-50%, 50%)' }}>
                            <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-xl animate-pulse">6</div>
                          </div>
                        )}
                        {sixCornersState.currentCorner && sixCornersState.currentCorner.name === '7' && (
                          <div className="absolute" style={{ bottom: '35%', left: '50%', transform: 'translate(-50%, 50%)' }}>
                            <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-xl animate-pulse">7</div>
                          </div>
                        )}
                        {sixCornersState.currentCorner && sixCornersState.currentCorner.name === '8' && (
                          <div className="absolute" style={{ bottom: '20%', left: '50%', transform: 'translate(-50%, 50%)' }}>
                            <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-xl animate-pulse">8</div>
                          </div>
                        )}
                        {sixCornersState.currentCorner && sixCornersState.currentCorner.name === '9' && (
                          <div className="absolute" style={{ bottom: '10%', left: '50%', transform: 'translate(-50%, 50%)' }}>
                            <div className="bg-blue-600 text-white rounded-full w-16 h-16 flex items-center justify-center text-3xl font-bold shadow-xl animate-pulse">9</div>
                          </div>
                        )}
                        
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-md">
                          <p className="text-sm font-semibold text-gray-700">Shadow Training</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {sixCornersState.phase === 'restSet' && (
                  <div className="text-center mb-8">
                    <div className="bg-gradient-to-br from-orange-400 to-amber-500 p-8 rounded-2xl">
                      <p className="text-white text-xl font-semibold mb-4">☕ SET BREAK</p>
                      <div className="text-6xl font-bold text-white mb-2">
                        {sixCornersState.timeRemaining}
                      </div>
                      <p className="text-white text-lg">Get ready for set {sixCornersState.currentSet + 1}</p>
                    </div>
                  </div>
                )}

                <button
                  onClick={() => {
                    window.speechSynthesis.cancel();
                    setSixCornersState({
                      isRunning: false,
                      currentSet: 1,
                      currentShot: 0,
                      phase: 'ready',
                      timeRemaining: 3,
                      totalSets: sixCornersConfig.sets,
                      currentCorner: null,
                      nextCorner: null
                    });
                  }}
                  className="w-full bg-red-500 text-white px-8 py-3 rounded-xl hover:bg-red-600 transition font-semibold shadow-lg"
                >
                  Stop Training
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const AnalyticsView = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Performance Analytics</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-lg mb-4">Training by Category</h3>
          <div className="space-y-3">
            {['Footwork', 'Shots', 'Stamina', 'Defense'].map(cat => {
              const count = sessions.filter(s => s.category === cat).length;
              const percentage = sessions.length > 0 ? (count / sessions.length) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="flex justify-between mb-1">
                    <span>{cat}</span>
                    <span className="text-gray-600">{count} sessions</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-lg mb-4">Weekly Progress</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span>Sessions This Week</span>
              <span className="text-2xl font-bold text-blue-600">
                {sessions.filter(s => {
                  const sessionDate = new Date(s.date);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return sessionDate > weekAgo;
                }).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Hours This Week</span>
              <span className="text-2xl font-bold text-green-600">
                {sessions.filter(s => {
                  const sessionDate = new Date(s.date);
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  return sessionDate > weekAgo;
                }).reduce((sum, s) => sum + s.duration, 0).toFixed(1)}h
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-bold text-lg mb-4">Session History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3">Date</th>
                <th className="text-left py-3">Drill</th>
                <th className="text-left py-3">Category</th>
                <th className="text-left py-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map(session => (
                <tr key={session.id} className="border-b hover:bg-gray-50">
                  <td className="py-3">{new Date(session.date).toLocaleDateString()}</td>
                  <td className="py-3 font-medium">{session.drillName}</td>
                  <td className="py-3">{session.category}</td>
                  <td className="py-3">{session.duration.toFixed(0)} min</td>
                </tr>
              ))}
            </tbody>
          </table>
          {sessions.length === 0 && (
            <p className="text-center text-gray-500 py-8">No training data yet</p>
          )}
        </div>
      </div>
    </div>
  );

  const ScheduleView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Training Schedule</h2>
        <button
          onClick={() => {
            setScheduleFormData({ date: '', time: '', drill: drills[0].name });
            setShowAddSession(true);
          }}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          Schedule Session
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="space-y-3">
          {schedule.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No scheduled sessions. Click "Schedule Session" to add one!</p>
          ) : (
            schedule.map(item => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-4">
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => {
                      setSchedule(prev => prev.map(s => 
                        s.id === item.id ? {...s, completed: !s.completed} : s
                      ));
                    }}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <div>
                    <p className={`font-semibold ${item.completed ? 'line-through text-gray-400' : ''}`}>
                      {item.drill}
                    </p>
                    <p className="text-sm text-gray-600">{item.date} at {item.time}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSchedule(prev => prev.filter(s => s.id !== item.id))}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Schedule Training Session</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  type="date"
                  value={scheduleFormData.date}
                  onChange={(e) => setScheduleFormData({...scheduleFormData, date: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time</label>
                <input
                  type="time"
                  value={scheduleFormData.time}
                  onChange={(e) => setScheduleFormData({...scheduleFormData, time: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Drill</label>
                <select
                  value={scheduleFormData.drill}
                  onChange={(e) => setScheduleFormData({...scheduleFormData, drill: e.target.value})}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {drills.map(drill => (
                    <option key={drill.id} value={drill.name}>{drill.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  if (scheduleFormData.date && scheduleFormData.time && scheduleFormData.drill) {
                    addScheduledSession(scheduleFormData.date, scheduleFormData.drill, scheduleFormData.time);
                    setShowAddSession(false);
                  }
                }}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Schedule
              </button>
              <button
                onClick={() => setShowAddSession(false)}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="bg-white shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 rounded-lg p-2">
                <Award className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Badminton Training Pro</h1>
                <p className="text-sm text-gray-600">Your complete training companion</p>
              </div>
            </div>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="player">Player</option>
              <option value="coach">Coach</option>
              <option value="partner">Training Partner</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-md mb-6">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${
                activeTab === 'dashboard' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('drills')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${
                activeTab === 'drills' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <PlayCircle className="w-5 h-5" />
              Drills
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${
                activeTab === 'analytics' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('schedule')}
              className={`flex items-center gap-2 px-6 py-4 font-medium transition whitespace-nowrap ${
                activeTab === 'schedule' 
                  ? 'text-blue-600 border-b-2 border-blue-600' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar className="w-5 h-5" />
              Schedule
            </button>
          </div>
        </div>

        <div>
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'drills' && <DrillsView />}
          {activeTab === 'analytics' && <AnalyticsView />}
          {activeTab === 'schedule' && <ScheduleView />}
        </div>
      </div>
    </div>
  );
};

export default BadmintonTrainingApp;