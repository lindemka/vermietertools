'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface Property {
  id: string;
  name: string;
  units: Array<{
    id: string;
    name: string;
  }>;
}

interface Assignment {
  id: string;
  type: 'property' | 'unit';
  propertyId: string;
  propertyName: string;
  unitId?: string;
  unitName?: string;
  assignment: string;
  person: Person;
}

interface PersonAssignmentManagerProps {
  personId?: string; // Optional: if provided, shows assignments for specific person
}

const PROPERTY_ASSIGNMENTS = [
  'hausmeister',
  'hausverwaltung',
  'owner',
  'property_manager',
  'maintenance',
  'security',
  'other'
];

const UNIT_ASSIGNMENTS = [
  'tenant',
  'co_tenant',
  'subtenant',
  'guarantor',
  'emergency_contact',
  'other'
];

export default function PersonAssignmentManager({ personId }: PersonAssignmentManagerProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [assignmentType, setAssignmentType] = useState<'property' | 'unit'>('property');

  useEffect(() => {
    fetchAssignments();
    fetchAllPeople();
    fetchProperties();
  }, [personId]);

  const fetchAssignments = async () => {
    try {
      if (personId) {
        // Fetch assignments for specific person
        const [propertyResponse, unitResponse] = await Promise.all([
          fetch(`/api/people/${personId}/property-assignments`),
          fetch(`/api/people/${personId}/unit-assignments`)
        ]);
        
        const propertyAssignments = propertyResponse.ok ? await propertyResponse.json() : [];
        const unitAssignments = unitResponse.ok ? await unitResponse.json() : [];
        
        setAssignments([...propertyAssignments, ...unitAssignments]);
      } else {
        // Fetch all assignments
        const [propertyResponse, unitResponse] = await Promise.all([
          fetch('/api/assignments/properties'),
          fetch('/api/assignments/units')
        ]);
        
        const propertyAssignments = propertyResponse.ok ? await propertyResponse.json() : [];
        const unitAssignments = unitResponse.ok ? await unitResponse.json() : [];
        
        setAssignments([...propertyAssignments, ...unitAssignments]);
      }
    } catch (error) {
      console.error('Error fetching assignments:', error);
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

  const fetchProperties = async () => {
    try {
      const response = await fetch('/api/properties');
      if (response.ok) {
        const data = await response.json();
        setProperties(data.properties || []);
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPerson || !selectedAssignment || !selectedProperty) {
      alert('Bitte wählen Sie eine Person, eine Zuordnung und ein Objekt aus');
      return;
    }

    if (assignmentType === 'unit' && !selectedUnit) {
      alert('Bitte wählen Sie eine Einheit aus');
      return;
    }

    try {
      let response;
      if (assignmentType === 'property') {
        response = await fetch(`/api/properties/${selectedProperty}/people`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personId: selectedPerson,
            role: selectedAssignment,
          }),
        });
      } else {
        response = await fetch(`/api/units/${selectedUnit}/people`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            personId: selectedPerson,
            role: selectedAssignment,
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add assignment');
      }

      setSelectedPerson('');
      setSelectedAssignment('');
      setSelectedProperty('');
      setSelectedUnit('');
      setAssignmentType('property');
      setShowAddForm(false);
      fetchAssignments();
    } catch (error) {
      console.error('Error adding assignment:', error);
      alert(error instanceof Error ? error.message : 'Failed to add assignment');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string, type: 'property' | 'unit') => {
    if (!confirm('Sind Sie sicher, dass Sie diese Zuordnung entfernen möchten?')) return;

    try {
      let response;
      if (type === 'property') {
        response = await fetch(`/api/properties/${selectedProperty}/people/${assignmentId}`, {
          method: 'DELETE',
        });
      } else {
        response = await fetch(`/api/units/${selectedUnit}/people/${assignmentId}`, {
          method: 'DELETE',
        });
      }

      if (!response.ok) throw new Error('Failed to remove assignment');

      fetchAssignments();
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert('Failed to remove assignment');
    }
  };

  const getAvailablePeople = () => {
    const assignedPersonIds = assignments.map(a => a.person.id);
    return allPeople.filter(person => !assignedPersonIds.includes(person.id));
  };

  const getAvailableAssignments = () => {
    return assignmentType === 'property' ? PROPERTY_ASSIGNMENTS : UNIT_ASSIGNMENTS;
  };

  if (loading) {
    return <div className="text-center py-4">Laden...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Zuordnungen</h3>
        <Button onClick={() => setShowAddForm(!showAddForm)} size="sm">
          {showAddForm ? 'Abbrechen' : 'Zuordnung hinzufügen'}
        </Button>
      </div>

      {/* Add Assignment Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Neue Zuordnung</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddAssignment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Person
                </label>
                <select
                  value={selectedPerson}
                  onChange={(e) => setSelectedPerson(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Person auswählen</option>
                  {getAvailablePeople().map((person) => (
                    <option key={person.id} value={person.id}>
                      {person.firstName} {person.lastName}
                      {person.email && ` (${person.email})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zuordnungstyp
                </label>
                <select
                  value={assignmentType}
                  onChange={(e) => {
                    setAssignmentType(e.target.value as 'property' | 'unit');
                    setSelectedUnit('');
                    setSelectedAssignment('');
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="property">Objekt</option>
                  <option value="unit">Einheit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Objekt
                </label>
                <select
                  value={selectedProperty}
                  onChange={(e) => {
                    setSelectedProperty(e.target.value);
                    setSelectedUnit('');
                  }}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Objekt auswählen</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              </div>

              {assignmentType === 'unit' && selectedProperty && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Einheit
                  </label>
                  <select
                    value={selectedUnit}
                    onChange={(e) => setSelectedUnit(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    <option value="">Einheit auswählen</option>
                    {properties
                      .find(p => p.id === selectedProperty)
                      ?.units.map((unit) => (
                        <option key={unit.id} value={unit.id}>
                          {unit.name}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zuordnung
                </label>
                <select
                  value={selectedAssignment}
                  onChange={(e) => setSelectedAssignment(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Zuordnung auswählen</option>
                  {getAvailableAssignments().map((assignment) => (
                    <option key={assignment} value={assignment}>
                      {assignment.charAt(0).toUpperCase() + assignment.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2">
                <Button type="submit" size="sm">Zuordnung hinzufügen</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowAddForm(false)}
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Assignments List */}
      {assignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Keine Zuordnungen vorhanden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <Card key={assignment.id}>
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium">
                      {assignment.person.firstName} {assignment.person.lastName}
                    </h4>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Zuordnung:</span> {assignment.assignment}
                      <span className="ml-4">
                        <span className="font-medium">Objekt:</span> {assignment.propertyName}
                      </span>
                      {assignment.unitName && (
                        <span className="ml-4">
                          <span className="font-medium">Einheit:</span> {assignment.unitName}
                        </span>
                      )}
                      {assignment.person.email && (
                        <span className="ml-4">
                          <span className="font-medium">Email:</span> {assignment.person.email}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveAssignment(assignment.id, assignment.type)}
                  >
                    Entfernen
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
