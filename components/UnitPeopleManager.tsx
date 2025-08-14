'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Plus, Search, Home, X, UserCheck } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface UnitPerson {
  id: string;
  role: string;
  person: Person;
}

interface UnitPeopleManagerProps {
  unitId: string;
}

const UNIT_ROLES = [
  { value: 'tenant', label: 'Mieter', color: 'bg-blue-100 text-blue-700' },
  { value: 'co_tenant', label: 'Mitmieter', color: 'bg-green-100 text-green-700' },
  { value: 'subtenant', label: 'Untermieter', color: 'bg-purple-100 text-purple-700' },
  { value: 'guarantor', label: 'Bürge', color: 'bg-orange-100 text-orange-700' },
  { value: 'emergency_contact', label: 'Notfallkontakt', color: 'bg-red-100 text-red-700' },
  { value: 'other', label: 'Sonstiges', color: 'bg-gray-100 text-gray-700' }
];

export default function UnitPeopleManager({ unitId }: UnitPeopleManagerProps) {
  const [unitPeople, setUnitPeople] = useState<UnitPerson[]>([]);
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUnitPeople();
    fetchAllPeople();
  }, [unitId]);

  const fetchUnitPeople = async () => {
    try {
      const response = await fetch(`/api/units/${unitId}/people`);
      if (response.ok) {
        const data = await response.json();
        setUnitPeople(data);
      }
    } catch (error) {
      console.error('Error fetching unit people:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPeople = async () => {
    try {
      const response = await fetch('/api/people');
      if (response.ok) {
        const data = await response.json();
        setAllPeople(data.people);
      }
    } catch (error) {
      console.error('Error fetching all people:', error);
    }
  };

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPerson || !selectedRole) {
      alert('Bitte wähle sowohl eine Person als auch eine Rolle aus');
      return;
    }

    try {
      const response = await fetch(`/api/units/${unitId}/people`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: selectedPerson,
          role: selectedRole,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Hinzufügen der Person');
      }

      setSelectedPerson('');
      setSelectedRole('');
      setShowAddForm(false);
      fetchUnitPeople();
    } catch (error) {
      console.error('Error adding person to unit:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Hinzufügen der Person');
    }
  };

  const handleRemovePerson = async (unitPerson: UnitPerson) => {
    if (!confirm('Möchtest du diese Person wirklich von der Einheit entfernen?')) return;

    try {
      const response = await fetch(`/api/units/${unitId}/people?personId=${unitPerson.person.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Entfernen der Person');
      }

      fetchUnitPeople();
    } catch (error) {
      console.error('Error removing person from unit:', error);
      alert(error instanceof Error ? error.message : 'Fehler beim Entfernen der Person');
    }
  };

  const getAvailablePeople = () => {
    const assignedPersonIds = unitPeople.map(up => up.person.id);
    const filtered = allPeople.filter(person => !assignedPersonIds.includes(person.id));
    
    if (searchTerm) {
      return filtered.filter(person => 
        person.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        person.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getRoleLabel = (role: string) => {
    const roleObj = UNIT_ROLES.find(r => r.value === role);
    return roleObj ? roleObj.label : role;
  };

  const getRoleColor = (role: string) => {
    const roleObj = UNIT_ROLES.find(r => r.value === role);
    return roleObj ? roleObj.color : 'bg-gray-100 text-gray-700';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Home className="w-5 h-5" />
            Personen zuweisen
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {unitPeople.length} Person{unitPeople.length !== 1 ? 'en' : ''} zugeordnet
          </p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)} 
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {showAddForm ? 'Abbrechen' : 'Person zuweisen'}
        </Button>
      </div>

      {/* Add Person Form */}
      {showAddForm && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Person zur Einheit zuweisen
            </CardTitle>
            <p className="text-sm text-gray-600">
              Wähle eine bestehende Person aus, um sie dieser Einheit zuzuweisen. 
              Neue Personen können auf der <a href="/people" className="text-blue-600 hover:underline">Personen-Seite</a> erstellt werden.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddPerson} className="space-y-4">
              {/* Person Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Person auswählen
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Personen suchen..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>
                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md bg-white">
                  {getAvailablePeople().length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      {searchTerm ? 'Keine Personen gefunden' : 'Keine verfügbaren Personen'}
                      <br />
                      <a href="/people" className="text-blue-600 hover:underline text-sm">
                        Neue Person erstellen
                      </a>
                    </div>
                  ) : (
                    getAvailablePeople().map((person) => (
                      <div
                        key={person.id}
                        onClick={() => setSelectedPerson(person.id)}
                        className={`p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                          selectedPerson === person.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-xs">
                            {getInitials(person.firstName, person.lastName)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {person.firstName} {person.lastName}
                            </div>
                            {person.email && (
                              <div className="text-sm text-gray-500">{person.email}</div>
                            )}
                          </div>
                          {selectedPerson === person.id && (
                            <UserCheck className="w-4 h-4 text-blue-600" />
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rolle
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {UNIT_ROLES.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => setSelectedRole(role.value)}
                      className={`p-3 text-left rounded-lg border-2 transition-colors ${
                        selectedRole === role.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-1 ${role.color}`}>
                        {role.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={!selectedPerson || !selectedRole}>
                  Zuweisen
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setShowAddForm(false);
                    setSelectedPerson('');
                    setSelectedRole('');
                    setSearchTerm('');
                  }}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* People List */}
      {unitPeople.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500 mb-2">Keine Personen dieser Einheit zugewiesen</p>
            <p className="text-sm text-gray-400">
              Klicke auf &quot;Person zuweisen&quot; um Personen hinzuzufügen
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {unitPeople.map((unitPerson) => (
            <Card key={unitPerson.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                      {getInitials(unitPerson.person.firstName, unitPerson.person.lastName)}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {unitPerson.person.firstName} {unitPerson.person.lastName}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${getRoleColor(unitPerson.role)}`}>
                          {getRoleLabel(unitPerson.role)}
                        </span>
                        {unitPerson.person.email && (
                          <span className="flex items-center gap-1">
                            <span className="text-gray-400">•</span>
                            {unitPerson.person.email}
                          </span>
                        )}
                        {unitPerson.person.phone && (
                          <span className="flex items-center gap-1">
                            <span className="text-gray-400">•</span>
                            {unitPerson.person.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemovePerson(unitPerson)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
