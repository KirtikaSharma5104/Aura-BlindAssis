
import React, { useState } from 'react';
import { PersonProfile, EmergencyContact, SavedLocation } from '../types';
import Logo from './Logo';

interface SetupViewProps {
  profiles: PersonProfile[];
  setProfiles: (p: PersonProfile[]) => void;
  contacts: EmergencyContact[];
  setContacts: (c: EmergencyContact[]) => void;
  locations: SavedLocation[];
  setLocations: (l: SavedLocation[]) => void;
  userName: string;
  setUserName: (n: string) => void;
  onStart: () => void;
}

const SetupView: React.FC<SetupViewProps> = ({
  profiles, setProfiles, contacts, setContacts, locations, setLocations, userName, setUserName, onStart
}) => {
  const [newPerson, setNewPerson] = useState({ name: '', rel: '' });
  const [newLoc, setNewLoc] = useState({ name: '', desc: '' });
  const [newContact, setNewContact] = useState({ name: '', phone: '' });

  const handleAddPerson = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPerson.name && newPerson.rel) {
      setProfiles([...profiles, { id: Date.now().toString(), name: newPerson.name, relationship: newPerson.rel }]);
      setNewPerson({ name: '', rel: '' });
    }
  };

  const handleAddLoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (newLoc.name && newLoc.desc) {
      setLocations([...locations, { id: Date.now().toString(), name: newLoc.name, description: newLoc.desc }]);
      setNewLoc({ name: '', desc: '' });
    }
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (newContact.name && newContact.phone) {
      setContacts([...contacts, { id: Date.now().toString(), name: newContact.name, phone: newContact.phone }]);
      setNewContact({ name: '', phone: '' });
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto h-full flex flex-col overflow-y-auto bg-slate-950 scrollbar-hide text-slate-100 selection:bg-indigo-500 selection:text-white">
      <header className="mb-14 text-center pt-12 flex flex-col items-center">
        <Logo size="lg" />
        <h1 className="text-6xl font-black text-white mt-6 mb-2 tracking-tight">Aura</h1>
        <p className="text-indigo-300 font-medium text-lg tracking-wide max-w-[280px]">Your companion for a clearer world.</p>
      </header>

      <div className="space-y-14 pb-48">
        {/* User Identity */}
        <section className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl shadow-2xl">
          <label className="block text-xs font-bold mb-4 uppercase tracking-[0.2em] text-indigo-400">What should I call you?</label>
          <input 
            type="text" 
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Your name"
            className="w-full bg-slate-800/40 border-2 border-white/5 rounded-2xl p-6 text-2xl font-semibold focus:border-indigo-500 outline-none transition-all placeholder:text-slate-700"
          />
        </section>

        {/* Friends & Family Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold mb-4 text-white flex items-center px-4">
            <span className="w-1.5 h-6 bg-indigo-500 mr-4 rounded-full" />
            Friends & Family
          </h2>
          
          <form onSubmit={handleAddPerson} className="grid grid-cols-1 gap-4 bg-slate-900/30 p-6 rounded-[2rem] border border-white/5">
            <div className="grid grid-cols-2 gap-4">
              <input 
                placeholder="Name" 
                value={newPerson.name} 
                onChange={e => setNewPerson({...newPerson, name: e.target.value})}
                className="bg-slate-800/30 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 text-lg"
              />
              <input 
                placeholder="Who are they?" 
                value={newPerson.rel} 
                onChange={e => setNewPerson({...newPerson, rel: e.target.value})}
                className="bg-slate-800/30 border border-white/5 p-4 rounded-2xl outline-none focus:border-indigo-500 text-lg"
              />
            </div>
            <button type="submit" className="w-full bg-white text-slate-950 font-bold py-4 rounded-2xl hover:bg-indigo-50 transition-all active:scale-[0.98]">
              Remember them
            </button>
          </form>

          <div className="grid gap-3 px-2">
            {profiles.map(p => (
              <div key={p.id} className="flex justify-between items-center bg-slate-900/20 p-5 rounded-2xl border border-white/5">
                <div>
                  <p className="text-xl font-bold text-white">{p.name}</p>
                  <p className="text-sm font-medium text-indigo-400/80">{p.relationship}</p>
                </div>
                <button onClick={() => setProfiles(profiles.filter(item => item.id !== p.id))} className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">✕</button>
              </div>
            ))}
          </div>
        </section>

        {/* Favorite Spots Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold mb-4 text-white flex items-center px-4">
            <span className="w-1.5 h-6 bg-emerald-500 mr-4 rounded-full" />
            Favorite Places
          </h2>
          
          <form onSubmit={handleAddLoc} className="grid grid-cols-1 gap-4 bg-slate-900/30 p-6 rounded-[2rem] border border-white/5">
            <div className="grid grid-cols-2 gap-4">
              <input 
                placeholder="Label" 
                value={newLoc.name} 
                onChange={e => setNewLoc({...newLoc, name: e.target.value})}
                className="bg-slate-800/30 border border-white/5 p-4 rounded-2xl outline-none focus:border-emerald-500 text-lg"
              />
              <input 
                placeholder="Description" 
                value={newLoc.desc} 
                onChange={e => setNewLoc({...newLoc, desc: e.target.value})}
                className="bg-slate-800/30 border border-white/5 p-4 rounded-2xl outline-none focus:border-emerald-500 text-lg"
              />
            </div>
            <button type="submit" className="w-full bg-emerald-600/80 text-white font-bold py-4 rounded-2xl hover:bg-emerald-600 transition-all active:scale-[0.98]">
              Save location
            </button>
          </form>

          <div className="grid gap-3 px-2">
            {locations.map(l => (
              <div key={l.id} className="flex justify-between items-center bg-slate-900/20 p-5 rounded-2xl border border-white/5">
                <div>
                  <p className="text-xl font-bold text-white">{l.name}</p>
                  <p className="text-sm text-slate-400">{l.description}</p>
                </div>
                <button onClick={() => setLocations(locations.filter(item => item.id !== l.id))} className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">✕</button>
              </div>
            ))}
          </div>
        </section>

        {/* Emergency Contacts Section */}
        <section className="space-y-6">
          <h2 className="text-xl font-bold mb-4 text-white flex items-center px-4">
            <span className="w-1.5 h-6 bg-amber-500 mr-4 rounded-full" />
            Safe Contacts
          </h2>
          
          <form onSubmit={handleAddContact} className="grid grid-cols-1 gap-4 bg-slate-900/30 p-6 rounded-[2rem] border border-white/5">
            <div className="grid grid-cols-2 gap-4">
              <input 
                placeholder="Contact Name" 
                value={newContact.name} 
                onChange={e => setNewContact({...newContact, name: e.target.value})}
                className="bg-slate-800/30 border border-white/5 p-4 rounded-2xl outline-none focus:border-amber-500 text-lg"
              />
              <input 
                placeholder="Phone number" 
                value={newContact.phone} 
                onChange={e => setNewContact({...newContact, phone: e.target.value})}
                className="bg-slate-800/30 border border-white/5 p-4 rounded-2xl outline-none focus:border-amber-500 text-lg"
              />
            </div>
            <button type="submit" className="w-full bg-amber-600/80 text-white font-bold py-4 rounded-2xl hover:bg-amber-600 transition-all active:scale-[0.98]">
              Add safe contact
            </button>
          </form>

          <div className="grid gap-3 px-2">
            {contacts.map(c => (
              <div key={c.id} className="flex justify-between items-center bg-slate-900/20 p-5 rounded-2xl border border-white/5">
                <div>
                  <p className="text-xl font-bold text-white">{c.name}</p>
                  <p className="text-sm text-slate-400">{c.phone}</p>
                </div>
                <button onClick={() => setContacts(contacts.filter(item => item.id !== c.id))} className="w-10 h-10 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all">✕</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Activation Fixed Button */}
      <div className="fixed bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent backdrop-blur-sm z-20">
        <button 
          onClick={onStart}
          className="w-full max-w-lg mx-auto block bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-2xl font-bold py-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(79,70,229,0.3)] transform active:scale-[0.98] transition-all tracking-tight"
        >
          Start Journey
        </button>
      </div>
    </div>
  );
};

export default SetupView;
