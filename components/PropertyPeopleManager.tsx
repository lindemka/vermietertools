'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building, Home, Trash2, Mail, Phone } from 'lucide-react';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  notes?: string;
  propertyRoles: PropertyRole[];
  unitRoles: UnitRole[];
}

interface PropertyRole {
  id: string;
  role: string;
  property: {
    id: string;
    name: string;
  };
}

interface UnitRole {
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
}

interface PropertyPeopleManagerProps {
  propertyId: string;
}

export default function PropertyPeopleManager({ propertyId }: PropertyPeopleManagerProps) {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPeople();
  }, [propertyId]);

  const fetchPeople = async () => {
    try {
      // Get all people with their assignments
      const response = await fetch('/api/people');
      if (response.ok) {
        const data = await response.json();
        
        // Filter people who have assignments to this property
        const filteredPeople = data.people.filter((person: Person) => {
          const hasPropertyRole = person.propertyRoles.some(role => role.property.id === propertyId);
          const hasUnitRole = person.unitRoles.some(role => role.unit.property.id === propertyId);
          return hasPropertyRole || hasUnitRole;
        });
        
        // For each filtered person, ensure we have the complete assignment data
        const enrichedPeople = filteredPeople.map((person: Person) => {
          // Filter property roles to only show assignments for this property
          const propertyRolesForThisProperty = person.propertyRoles.filter((role: PropertyRole) => role.property.id === propertyId);
          
          // Filter unit roles to only show assignments for units in this property
          const unitRolesForThisProperty = person.unitRoles.filter((role: UnitRole) => role.unit.property.id === propertyId);
          
          return {
            ...person,
            propertyRoles: propertyRolesForThisProperty,
            unitRoles: unitRolesForThisProperty
          };
        });
        
        setPeople(enrichedPeople);
      }
    } catch (error) {
      console.error('Error fetching people:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Building className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-2">Keine Personen diesem Objekt zugewiesen</p>
          <p className="text-sm text-gray-400">
            Personen können über das Personenverzeichnis zugewiesen werden
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {people.map((person) => (
        <Card key={person.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                  {getInitials(person.firstName, person.lastName)}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    <button
                      onClick={() => window.location.href = `/people?search=${encodeURIComponent(person.firstName + ' ' + person.lastName)}`}
                      className="hover:text-blue-600 hover:underline transition-colors"
                    >
                      {person.firstName} {person.lastName}
                    </button>
                  </h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    {person.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {person.email}
                      </span>
                    )}
                    {person.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {person.phone}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {/* Property roles */}
                    {person.propertyRoles
                      .filter(role => role.property.id === propertyId)
                      .map((role) => (
                      <span key={role.id} className="text-sm text-blue-700 bg-blue-100 px-2 py-1 rounded capitalize">
                        {role.role}
                      </span>
                    ))}
                    {/* Unit roles */}
                    {person.unitRoles
                      .filter(role => role.unit.property.id === propertyId)
                      .map((role) => (
                      <span key={role.id} className="text-sm text-green-700 bg-green-100 px-2 py-1 rounded capitalize">
                        {role.role} in {role.unit.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                {/* Delete buttons for all assignments */}
                {person.propertyRoles
                  .filter(role => role.property.id === propertyId)
                  .map((role) => (
                  <Button
                    key={role.id}
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (confirm(`Möchten Sie ${person.firstName} ${person.lastName} als ${role.role} entfernen?`)) {
                        try {
                          const response = await fetch(`/api/properties/${role.property.id}/people?personId=${person.id}`, {
                            method: 'DELETE',
                            credentials: 'include',
                          });
                          
                          if (response.ok) {
                            fetchPeople();
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
                ))}
                {person.unitRoles
                  .filter(role => role.unit.property.id === propertyId)
                  .map((role) => (
                  <Button
                    key={role.id}
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (confirm(`Möchten Sie ${person.firstName} ${person.lastName} als ${role.role} aus ${role.unit.name} entfernen?`)) {
                        try {
                          const response = await fetch(`/api/units/${role.unit.id}/people?personId=${person.id}`, {
                            method: 'DELETE',
                            credentials: 'include',
                          });
                          
                          if (response.ok) {
                            fetchPeople();
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
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
