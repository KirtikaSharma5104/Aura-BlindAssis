
import React, { useState, useEffect } from 'react';
import { AppState, PersonProfile, EmergencyContact, SavedLocation } from './types';
import SetupView from './components/SetupView';
import LiveView from './components/LiveView';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [profiles, setProfiles] = useState<PersonProfile[]>([]);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const savedProfiles = localStorage.getItem('aihelp_profiles');
    const savedContacts = localStorage.getItem('aihelp_contacts');
    const savedLocations = localStorage.getItem('aihelp_locations');
    const savedUser = localStorage.getItem('aihelp_user');

    if (savedProfiles) setProfiles(JSON.parse(savedProfiles));
    if (savedContacts) setContacts(JSON.parse(savedContacts));
    if (savedLocations) setLocations(JSON.parse(savedLocations));
    if (savedUser) setUserName(savedUser);
  }, []);

  const handleUpdateMemory = (data: { profiles?: PersonProfile[], contacts?: EmergencyContact[], locations?: SavedLocation[] }) => {
    if (data.profiles) {
      setProfiles(data.profiles);
      localStorage.setItem('aihelp_profiles', JSON.stringify(data.profiles));
    }
    if (data.contacts) {
      setContacts(data.contacts);
      localStorage.setItem('aihelp_contacts', JSON.stringify(data.contacts));
    }
    if (data.locations) {
      setLocations(data.locations);
      localStorage.setItem('aihelp_locations', JSON.stringify(data.locations));
    }
  };

  const handleStartLive = () => setAppState(AppState.LIVE);
  const handleBackToSetup = () => setAppState(AppState.SETUP);

  return (
    <div className="h-screen w-screen bg-black text-white font-sans overflow-hidden">
      {appState === AppState.SETUP ? (
        <SetupView 
          profiles={profiles} 
          setProfiles={(p) => handleUpdateMemory({ profiles: p })}
          contacts={contacts}
          setContacts={(c) => handleUpdateMemory({ contacts: c })}
          locations={locations}
          setLocations={(l) => handleUpdateMemory({ locations: l })}
          userName={userName}
          setUserName={(n) => { setUserName(n); localStorage.setItem('aihelp_user', n); }}
          onStart={handleStartLive}
        />
      ) : (
        <LiveView 
          profiles={profiles}
          contacts={contacts}
          locations={locations}
          userName={userName}
          onExit={handleBackToSetup}
          onUpdateMemory={handleUpdateMemory}
        />
      )}
    </div>
  );
};

export default App;
