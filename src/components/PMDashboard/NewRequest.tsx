import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { PMProperty, ServiceType, createServiceRequest } from '../../lib/pmDashboard';
import ChatRequest from './ChatRequest';

interface Props {
  userId: string;
  properties: PMProperty[];
}

export default function NewRequest({ userId, properties }: Props) {
  const navigate = useNavigate();
  const [selectedPropertyId, setSelectedPropertyId] = useState(
    properties.length === 1 ? properties[0].id : ''
  );
  const [success, setSuccess] = useState(false);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  async function handleChatComplete(data: {
    serviceType?: ServiceType;
    unitNumber?: string;
    scheduledDate?: string;
    notes?: string;
  }) {
    if (!selectedPropertyId || !data.serviceType) return;
    await createServiceRequest(userId, {
      property_id: selectedPropertyId,
      unit_number: data.unitNumber || null,
      service_type: data.serviceType,
      status: 'pending',
      scheduled_date: data.scheduledDate || null,
      notes: data.notes || null,
    });
    setSuccess(true);
    setTimeout(() => navigate('/dashboard/requests'), 2500);
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto pt-20 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle size={28} className="text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Request submitted!</h2>
        <p className="text-slate-500 text-sm mt-2">
          We'll be in touch to confirm your scheduled date.
        </p>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="max-w-lg mx-auto pt-20 text-center">
        <p className="text-slate-500 text-sm">No properties assigned to your account yet.</p>
        <p className="text-slate-400 text-xs mt-1">Contact your Castle Companies administrator.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">New request</h1>
        <p className="text-slate-500 text-sm mt-1">Book a service for your property.</p>
      </div>

      {/* Property selector — only shown when user manages multiple */}
      {properties.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Which property?
          </label>
          <div className="grid gap-2">
            {properties.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPropertyId(p.id)}
                className={`text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ${
                  selectedPropertyId === p.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-700 hover:border-slate-300 bg-white'
                }`}
              >
                <p className="font-semibold">{p.property_name}</p>
                <p className="text-xs text-slate-400 mt-0.5">{p.address}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat — appears once a property is selected */}
      {selectedProperty && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Castle Services</p>
              <p className="text-xs text-green-500 font-medium">● Online</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs font-medium text-slate-700">{selectedProperty.property_name}</p>
              <p className="text-xs text-slate-400 truncate max-w-[140px]">{selectedProperty.address}</p>
            </div>
          </div>
          <ChatRequest
            propertyName={selectedProperty.property_name}
            propertyAddress={selectedProperty.address}
            onComplete={handleChatComplete}
          />
        </div>
      )}
    </div>
  );
}
