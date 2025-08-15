'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
// Navigation is provided by the root layout
import { Search, User, Mail, Phone, MapPin, Building, Home, Plus, Edit, Trash2, X, Save, X as XIcon } from 'lucide-react';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
  propertyRoles: Array<{
    id: string;
    role: string;
    property: {
      id: string;
      name: string;
    };
  }>;
  unitRoles: Array<{
    id: string;
    role: string;
    unit: {
      id: string;
      name: string;
      property: {
        id: string;
        name: string;
      };
    };
  }>;
}

interface PeopleResponse {
  people: Person[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [newPerson, setNewPerson] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [newAssignment, setNewAssignment] = useState({
    propertyId: '',
    unitId: '',
    role: '',
  });
  const [properties, setProperties] = useState<Array<{
    id: string;
    name: string;
    units: Array<{
      id: string;
      name: string;
    }>;
  }>>([]);
  const router = useRouter();

  const fetchPeople = async (search = '', page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: '50', // Increased for better browsing
      });
      
      const response = await fetch(`/api/people?${params}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch people: ${response.status} ${errorText}`);
      }
      
      const data: PeopleResponse = await response.json();
      
      setPeople(data.people);
      setTotalPages(data.pagination.pages);
      setCurrentPage(data.pagination.page);
      
      // If we have a search term and found exactly one person, select them automatically
      if (search && data.people.length === 1) {
        setSelectedPerson(data.people[0]);
      }
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Check for search parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    
    if (searchParam) {
      setSearchTerm(searchParam);
      fetchPeople(searchParam, 1);
    } else {
      fetchPeople();
    }
    
    fetchProperties();
  }, []);



  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPeople(searchTerm, 1);
  };

  // Also search when searchTerm changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== '') {
        fetchPeople(searchTerm, 1);
      } else {
        fetchPeople('', 1);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPerson.firstName || !newPerson.lastName) {
      alert('Vorname und Nachname sind erforderlich');
      return;
    }

    try {
      const response = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newPerson),
      });

      if (!response.ok) throw new Error('Fehler beim Erstellen der Person');

      const createdPerson = await response.json();
      
      // If there's an assignment to add, do it now
      if (showAssignmentModal && newAssignment.propertyId && newAssignment.role) {
        try {
          if (newAssignment.unitId) {
            // Unit assignment - add to both property and unit
            // First, add the person to the property
            await fetch(`/api/properties/${newAssignment.propertyId}/people`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                personId: createdPerson.id,
                role: 'tenant', // Default role for property when assigned to unit
              }),
            });

            // Then add to the specific unit
            await fetch(`/api/units/${newAssignment.unitId}/people`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                personId: createdPerson.id,
                role: newAssignment.role,
              }),
            });
          } else {
            // Property assignment only
            await fetch(`/api/properties/${newAssignment.propertyId}/people`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                personId: createdPerson.id,
                role: newAssignment.role,
              }),
            });
          }
        } catch (assignmentError) {
          console.error('Error adding assignment:', assignmentError);
          // Don't fail the person creation if assignment fails
        }
      }

      setNewPerson({ firstName: '', lastName: '', email: '', phone: '', notes: '' });
      setNewAssignment({ propertyId: '', unitId: '', role: '' });
      setShowAssignmentModal(false);
      setShowAddForm(false);
      fetchPeople(searchTerm, currentPage);
    } catch (error) {
      console.error('Error creating person:', error);
      alert('Fehler beim Erstellen der Person');
    }
  };

  const handleDeletePerson = async (personId: string) => {
    if (!confirm('Möchten Sie diese Person wirklich löschen?')) return;

    try {
      const response = await fetch(`/api/people/${personId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Fehler beim Löschen der Person');

      if (selectedPerson?.id === personId) {
        setSelectedPerson(null);
        setEditingField(null);
        setEditingValue('');
      }
      fetchPeople(searchTerm, currentPage);
    } catch (error) {
      console.error('Error deleting person:', error);
      alert('Fehler beim Löschen der Person');
    }
  };

  const startEditingField = (field: string, currentValue: string) => {
    setEditingField(field);
    setEditingValue(currentValue || '');
  };

  const saveField = async () => {
    if (!selectedPerson || !editingField) return;

    setSaving(true);
    try {
      const updatedPerson = { ...selectedPerson, [editingField]: editingValue };
      
      const response = await fetch(`/api/people/${selectedPerson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          firstName: updatedPerson.firstName,
          lastName: updatedPerson.lastName,
          email: updatedPerson.email,
          phone: updatedPerson.phone,
          notes: updatedPerson.notes,
        }),
      });

      if (response.ok) {
        setSelectedPerson(updatedPerson);
        setEditingField(null);
        setEditingValue('');
        fetchPeople(searchTerm, currentPage);
      } else {
        alert('Fehler beim Speichern');
      }
    } catch (error) {
      console.error('Error saving field:', error);
      alert('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditingValue('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveField();
    } else if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  const getRoleDisplay = (person: Person) => {
    const roles = [];
    
    if (person.propertyRoles.length > 0) {
      const propertyRoles = person.propertyRoles.map(pr => `${pr.role} (${pr.property.name})`);
      roles.push(...propertyRoles);
    }
    
    if (person.unitRoles.length > 0) {
      const unitRoles = person.unitRoles.map(ur => `${ur.role} (${ur.unit.name} - ${ur.unit.property.name})`);
      roles.push(...unitRoles);
    }
    
    return roles.length > 0 ? roles.join(', ') : 'Keine Zuordnungen';
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Remove local filtering since we're now using API search
  const filteredPeople = people;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Personenverzeichnis</h1>
            <p className="text-gray-600 mt-1">Verwalten Sie alle Personen und ihre Zuordnungen</p>
          </div>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)} 
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {showAddForm ? 'Abbrechen' : 'Person hinzufügen'}
          </Button>
        </div>

        {/* Add Person Form */}
        {showAddForm && (
          <Card className="mb-6 border-2 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Neue Person hinzufügen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddPerson} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="text"
                    placeholder="Vorname *"
                    value={newPerson.firstName}
                    onChange={(e) => setNewPerson({ ...newPerson, firstName: e.target.value })}
                    required
                  />
                  <Input
                    type="text"
                    placeholder="Nachname *"
                    value={newPerson.lastName}
                    onChange={(e) => setNewPerson({ ...newPerson, lastName: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    type="email"
                    placeholder="E-Mail"
                    value={newPerson.email}
                    onChange={(e) => setNewPerson({ ...newPerson, email: e.target.value })}
                  />
                  <Input
                    type="tel"
                    placeholder="Telefon"
                    value={newPerson.phone}
                    onChange={(e) => setNewPerson({ ...newPerson, phone: e.target.value })}
                  />
                </div>
                <Input
                  type="text"
                  placeholder="Notizen"
                  value={newPerson.notes}
                  onChange={(e) => setNewPerson({ ...newPerson, notes: e.target.value })}
                />

                {/* Assignment Section */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Zuordnung hinzufügen (optional)</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAssignmentModal(!showAssignmentModal)}
                    >
                      {showAssignmentModal ? 'Abbrechen' : 'Zuordnung hinzufügen'}
                    </Button>
                  </div>
                  
                  {showAssignmentModal && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white rounded-lg border">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Objekt</label>
                        <select
                          value={newAssignment.propertyId}
                          onChange={(e) => {
                            setNewAssignment({ 
                              ...newAssignment, 
                              propertyId: e.target.value,
                              unitId: '' 
                            });
                          }}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Objekt auswählen</option>
                          {properties.map((property) => (
                            <option key={property.id} value={property.id}>
                              {property.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Einheit (optional)</label>
                        <select
                          value={newAssignment.unitId}
                          onChange={(e) => setNewAssignment({ ...newAssignment, unitId: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md"
                          disabled={!newAssignment.propertyId}
                        >
                          <option value="">Keine Einheit</option>
                          {properties
                            .find(p => p.id === newAssignment.propertyId)
                            ?.units.map((unit) => (
                              <option key={unit.id} value={unit.id}>
                                {unit.name}
                              </option>
                            ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rolle</label>
                        <select
                          value={newAssignment.role}
                          onChange={(e) => setNewAssignment({ ...newAssignment, role: e.target.value })}
                          className="w-full p-2 border border-gray-300 rounded-md"
                        >
                          <option value="">Rolle auswählen</option>
                          {newAssignment.unitId ? 
                            ['mieter', 'mitmieter', 'untermieter', 'bürge', 'notfallkontakt', 'sonstiges'].map((role) => (
                              <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                              </option>
                            )) : 
                            ['hausmeister', 'hausverwaltung', 'eigentümer', 'objektverwalter', 'wartung', 'sicherheit', 'other'].map((role) => (
                              <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit">Person erstellen</Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setNewPerson({ firstName: '', lastName: '', email: '', phone: '', notes: '' });
                      setNewAssignment({ propertyId: '', unitId: '', role: '' });
                      setShowAssignmentModal(false);
                    }}
                  >
                    Abbrechen
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* People Directory */}
          <div className="lg:col-span-1">
            <Card className="h-[calc(100vh-200px)]">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Personen</CardTitle>
                {/* Search */}
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
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredPeople.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p>Keine Personen gefunden</p>
                  </div>
                ) : (
                  <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
                    {filteredPeople.map((person) => (
                      <div
                        key={person.id}
                        onClick={() => {
                          setSelectedPerson(person);
                          setEditingField(null);
                          setEditingValue('');
                        }}
                        className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedPerson?.id === person.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {getInitials(person.firstName, person.lastName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 truncate">
                              {person.firstName} {person.lastName}
                            </h3>
                            {person.email && (
                              <p className="text-sm text-gray-500 truncate">{person.email}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Person Details */}
          <div className="lg:col-span-2">
            {selectedPerson ? (
              <Card className="h-[calc(100vh-200px)]">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-lg">
                        {getInitials(selectedPerson.firstName, selectedPerson.lastName)}
                      </div>
                      <div>
                        <CardTitle className="text-xl">
                          {selectedPerson.firstName} {selectedPerson.lastName}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          {selectedPerson.propertyRoles.length + selectedPerson.unitRoles.length} Zuordnung{selectedPerson.propertyRoles.length + selectedPerson.unitRoles.length !== 1 ? 'en' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePerson(selectedPerson.id)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                        Löschen
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 overflow-y-auto max-h-[calc(100vh-300px)]">
                  {/* Contact Information */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Kontaktdaten
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          E-Mail
                        </label>
                        {editingField === 'email' ? (
                          <div className="flex gap-2">
                            <Input
                              type="email"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleKeyPress}
                              onBlur={saveField}
                              autoFocus
                              placeholder="E-Mail eingeben"
                            />
                            {saving && <span className="text-sm text-gray-500">Speichern...</span>}
                          </div>
                        ) : (
                          <div 
                            className="flex items-center gap-2 text-gray-700 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => startEditingField('email', selectedPerson.email || '')}
                          >
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{selectedPerson.email || 'Keine E-Mail angegeben'}</span>
                            <Edit className="w-3 h-3 text-gray-400 ml-auto" />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefon
                        </label>
                        {editingField === 'phone' ? (
                          <div className="flex gap-2">
                            <Input
                              type="tel"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleKeyPress}
                              onBlur={saveField}
                              autoFocus
                              placeholder="Telefonnummer eingeben"
                            />
                            {saving && <span className="text-sm text-gray-500">Speichern...</span>}
                          </div>
                        ) : (
                          <div 
                            className="flex items-center gap-2 text-gray-700 p-2 bg-gray-50 rounded cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => startEditingField('phone', selectedPerson.phone || '')}
                          >
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{selectedPerson.phone || 'Keine Telefonnummer angegeben'}</span>
                            <Edit className="w-3 h-3 text-gray-400 ml-auto" />
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notizen
                        </label>
                        {editingField === 'notes' ? (
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={handleKeyPress}
                              onBlur={saveField}
                              autoFocus
                              placeholder="Notizen eingeben"
                            />
                            {saving && <span className="text-sm text-gray-500">Speichern...</span>}
                          </div>
                        ) : (
                          <div 
                            className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                            onClick={() => startEditingField('notes', selectedPerson.notes || '')}
                          >
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-600">
                                {selectedPerson.notes || 'Keine Notizen vorhanden'}
                              </p>
                              <Edit className="w-3 h-3 text-gray-400" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* All Assignments - Editable */}
                  {(selectedPerson.propertyRoles.length > 0 || selectedPerson.unitRoles.length > 0) && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                          <Building className="w-5 h-5" />
                          Zuordnungen
                        </h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowAssignmentModal(true)}
                          className="text-gray-500 hover:text-gray-700 p-1"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {/* Property assignments */}
                        {selectedPerson.propertyRoles.map((role) => (
                          <div key={role.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Building className="w-4 h-4 text-blue-600" />
                              <div>
                                <div className="font-medium text-blue-900">
                                  <button
                                    onClick={() => router.push(`/properties/${role.property.id}`)}
                                    className="hover:text-blue-700 hover:underline transition-colors"
                                  >
                                    {role.property.name}
                                  </button>
                                </div>
                                <select
                                  value={role.role}
                                  onChange={async (e) => {
                                    try {
                                      const response = await fetch(`/api/properties/${role.property.id}/people/${role.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        credentials: 'include',
                                        body: JSON.stringify({ role: e.target.value }),
                                      });
                                      if (response.ok) {
                                        fetchPeople(searchTerm, currentPage);
                                      } else {
                                        alert('Fehler beim Aktualisieren der Rolle');
                                      }
                                    } catch (error) {
                                      console.error('Error updating role:', error);
                                      alert('Fehler beim Aktualisieren der Rolle');
                                    }
                                  }}
                                  className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded border-0 focus:ring-2 focus:ring-blue-500 capitalize"
                                >
                                  <option value="hausmeister">Hausmeister</option>
                                  <option value="hausverwaltung">Hausverwaltung</option>
                                  <option value="eigentümer">Eigentümer</option>
                                  <option value="objektverwalter">Objektverwalter</option>
                                  <option value="wartung">Wartung</option>
                                  <option value="sicherheit">Sicherheit</option>
                                  <option value="tenant">Mieter</option>
                                  <option value="sonstiges">Sonstiges</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (confirm(`Möchten Sie die Zuordnung zu "${role.property.name}" wirklich entfernen?`)) {
                                    try {
                                      const response = await fetch(`/api/properties/${role.property.id}/people?personId=${selectedPerson.id}`, {
                                        method: 'DELETE',
                                        credentials: 'include',
                                      });
                                      
                                      if (response.ok) {
                                        // Refresh the people data and update selected person
                                        await fetchPeople(searchTerm, currentPage);
                                        
                                        // Update the selected person with fresh data
                                        const updatedPeople = await fetch(`/api/people?search=${encodeURIComponent(selectedPerson.firstName + ' ' + selectedPerson.lastName)}`, {
                                          credentials: 'include'
                                        }).then(res => res.json());
                                        
                                        const updatedPerson = updatedPeople.people.find((p: Person) => p.id === selectedPerson.id);
                                        if (updatedPerson) {
                                          setSelectedPerson(updatedPerson);
                                        }
                                      } else {
                                        alert('Fehler beim Entfernen der Zuordnung');
                                      }
                                    } catch (error) {
                                      console.error('Error:', error);
                                      alert('Fehler beim Entfernen der Zuordnung');
                                    }
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}

                        {/* Unit assignments */}
                        {selectedPerson.unitRoles.map((role) => (
                          <div key={role.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <Home className="w-4 h-4 text-green-600" />
                              <div>
                                <div className="font-medium text-green-900">{role.unit.name}</div>
                                <div className="text-sm text-green-700 mb-1">
                                  <button
                                    onClick={() => router.push(`/properties/${role.unit.property.id}`)}
                                    className="hover:text-green-700 hover:underline transition-colors"
                                  >
                                    {role.unit.property.name}
                                  </button>
                                </div>
                                <select
                                  value={role.role}
                                  onChange={async (e) => {
                                    try {
                                      const response = await fetch(`/api/units/${role.unit.id}/people/${role.id}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        credentials: 'include',
                                        body: JSON.stringify({ role: e.target.value }),
                                      });
                                      if (response.ok) {
                                        fetchPeople(searchTerm, currentPage);
                                      } else {
                                        alert('Fehler beim Aktualisieren der Rolle');
                                      }
                                    } catch (error) {
                                      console.error('Error updating role:', error);
                                      alert('Fehler beim Aktualisieren der Rolle');
                                    }
                                  }}
                                  className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded border-0 focus:ring-2 focus:ring-green-500 capitalize"
                                >
                                  <option value="mieter">Mieter</option>
                                  <option value="mitmieter">Mitmieter</option>
                                  <option value="untermieter">Untermieter</option>
                                  <option value="bürge">Bürge</option>
                                  <option value="notfallkontakt">Notfallkontakt</option>
                                  <option value="sonstiges">Sonstiges</option>
                                </select>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  if (confirm(`Möchten Sie die Zuordnung zu "${role.unit.name}" wirklich entfernen?`)) {
                                    try {
                                      const response = await fetch(`/api/units/${role.unit.id}/people?personId=${selectedPerson.id}`, {
                                        method: 'DELETE',
                                        credentials: 'include',
                                      });
                                      
                                      if (response.ok) {
                                        // Refresh the people data and update selected person
                                        await fetchPeople(searchTerm, currentPage);
                                        
                                        // Update the selected person with fresh data
                                        const updatedPeople = await fetch(`/api/people?search=${encodeURIComponent(selectedPerson.firstName + ' ' + selectedPerson.lastName)}`, {
                                          credentials: 'include'
                                        }).then(res => res.json());
                                        
                                        const updatedPerson = updatedPeople.people.find((p: Person) => p.id === selectedPerson.id);
                                        if (updatedPerson) {
                                          setSelectedPerson(updatedPerson);
                                        }
                                      } else {
                                        alert('Fehler beim Entfernen der Zuordnung');
                                      }
                                    } catch (error) {
                                      console.error('Error:', error);
                                      alert('Fehler beim Entfernen der Zuordnung');
                                    }
                                  }
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show message when no assignments */}
                  {(selectedPerson.propertyRoles.length === 0 && selectedPerson.unitRoles.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      <Building className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                      <p>Keine Zuordnungen vorhanden</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAssignmentModal(true)}
                        className="mt-2"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Zuordnung hinzufügen
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[calc(100vh-200px)]">
                <CardContent className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <User className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg">Wählen Sie eine Person aus</p>
                    <p className="text-sm">Klicken Sie auf eine Person in der Liste, um Details anzuzeigen</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Neue Zuordnung hinzufügen</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAssignmentModal(false);
                  setNewAssignment({ propertyId: '', unitId: '', role: '' });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Objekt</label>
                <select
                  value={newAssignment.propertyId}
                  onChange={(e) => {
                    setNewAssignment({ 
                      ...newAssignment, 
                      propertyId: e.target.value,
                      unitId: '' 
                    });
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Objekt wählen</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Einheit (optional)</label>
                <select
                  value={newAssignment.unitId}
                  onChange={(e) => setNewAssignment({ ...newAssignment, unitId: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                  disabled={!newAssignment.propertyId}
                >
                  <option value="">Keine Einheit</option>
                  {properties
                    .find(p => p.id === newAssignment.propertyId)
                    ?.units.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name}
                      </option>
                    ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rolle</label>
                <select
                  value={newAssignment.role}
                  onChange={(e) => setNewAssignment({ ...newAssignment, role: e.target.value })}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Rolle wählen</option>
                  {newAssignment.unitId ? 
                    ['mieter', 'mitmieter', 'untermieter', 'bürge', 'notfallkontakt', 'sonstiges'].map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    )) : 
                    ['hausmeister', 'hausverwaltung', 'eigentümer', 'objektverwalter', 'wartung', 'sicherheit', 'mieter', 'sonstiges'].map((role) => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))
                  }
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAssignmentModal(false);
                  setNewAssignment({ propertyId: '', unitId: '', role: '' });
                }}
              >
                Abbrechen
              </Button>
              <Button
                onClick={async () => {
                  if (!newAssignment.propertyId || !newAssignment.role) {
                    alert('Bitte wählen Sie ein Objekt und eine Rolle aus');
                    return;
                  }

                  if (!selectedPerson) {
                    alert('Keine Person ausgewählt');
                    return;
                  }

                  try {
                    if (newAssignment.unitId) {
                      // Unit assignment
                      await fetch(`/api/units/${newAssignment.unitId}/people`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          personId: selectedPerson.id,
                          role: newAssignment.role,
                        }),
                      });
                    } else {
                      // Property assignment
                      await fetch(`/api/properties/${newAssignment.propertyId}/people`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                          personId: selectedPerson.id,
                          role: newAssignment.role,
                        }),
                      });
                    }

                    setNewAssignment({ propertyId: '', unitId: '', role: '' });
                    setShowAssignmentModal(false);
                    
                    // Refresh the people data and update selected person
                    await fetchPeople(searchTerm, currentPage);
                    
                    // Update the selected person with fresh data
                    if (selectedPerson) {
                      const updatedPeople = await fetch(`/api/people?search=${encodeURIComponent(selectedPerson.firstName + ' ' + selectedPerson.lastName)}`, {
                        credentials: 'include'
                      }).then(res => res.json());
                      
                      const updatedPerson = updatedPeople.people.find((p: Person) => p.id === selectedPerson.id);
                      if (updatedPerson) {
                        setSelectedPerson(updatedPerson);
                      }
                    }
                  } catch (error) {
                    console.error('Error adding assignment:', error);
                    alert('Fehler beim Hinzufügen der Zuordnung');
                  }
                }}
                disabled={!newAssignment.propertyId || !newAssignment.role}
              >
                Zuordnung hinzufügen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
