/**
 * Hook for handling scan-related SSE events
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { sseManager } from '@/lib/sseManager';
import type { ContactInfo } from '@/api/scan';

export interface ScanContact extends ContactInfo {
  firstDetectedAt: number;
  lastSeenAt: number;
}

export interface ScanContactEvent {
  scanner_id: string;
  contact: {
    entity_id: string;
    entity_type: string;
    position: [number, number, number];
    position_accuracy: number;
    signal_strength: number;
    classification: string;
  };
}

export interface ScanLostEvent {
  scanner_id: string;
  contact_id: string;
  reason: 'out_of_range' | 'cloaked' | 'destroyed';
}

interface UseScanEventsOptions {
  shipId: string;
  onContactDetected?: (contact: ScanContact) => void;
  onContactLost?: (contactId: string, reason: string) => void;
}

export function useScanEvents(options: UseScanEventsOptions) {
  const { shipId, onContactDetected, onContactLost } = options;
  const [contacts, setContacts] = useState<Map<string, ScanContact>>(new Map());
  const [connected, setConnected] = useState(false);
  const contactsRef = useRef(contacts);

  // Keep ref updated
  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  // Handle scan contact event
  const handleScanContact = useCallback((event: ScanContactEvent) => {
    if (event.scanner_id !== shipId) return;

    const now = Date.now();
    const existingContact = contactsRef.current.get(event.contact.entity_id);

    const contact: ScanContact = {
      entity_id: event.contact.entity_id,
      entity_type: event.contact.entity_type as ContactInfo['entity_type'],
      position: event.contact.position,
      position_accuracy: event.contact.position_accuracy,
      distance: 0, // Will be calculated locally if needed
      signal_strength: event.contact.signal_strength,
      classification: event.contact.classification as ContactInfo['classification'],
      firstDetectedAt: existingContact?.firstDetectedAt ?? now,
      lastSeenAt: now,
    };

    setContacts(prev => {
      const next = new Map(prev);
      next.set(contact.entity_id, contact);
      return next;
    });

    onContactDetected?.(contact);
  }, [shipId, onContactDetected]);

  // Handle scan lost event
  const handleScanLost = useCallback((event: ScanLostEvent) => {
    if (event.scanner_id !== shipId) return;

    setContacts(prev => {
      const next = new Map(prev);
      next.delete(event.contact_id);
      return next;
    });

    onContactLost?.(event.contact_id, event.reason);
  }, [shipId, onContactLost]);

  // Subscribe to SSE events
  useEffect(() => {
    // Track connection status
    setConnected(sseManager.isStreamConnected());

    // Subscribe to scan events
    const cleanupContact = sseManager.addEventListener('game.scan.contact', (data: ScanContactEvent) => {
      handleScanContact(data);
    });

    const cleanupLost = sseManager.addEventListener('game.scan.lost', (data: ScanLostEvent) => {
      handleScanLost(data);
    });

    return () => {
      cleanupContact();
      cleanupLost();
    };
  }, [handleScanContact, handleScanLost]);

  // Update contacts from a scan result
  const updateFromScan = useCallback((scanContacts: ContactInfo[]) => {
    const now = Date.now();

    setContacts(prev => {
      const next = new Map(prev);

      // Update or add contacts from scan
      for (const contact of scanContacts) {
        const existing = prev.get(contact.entity_id);
        next.set(contact.entity_id, {
          ...contact,
          firstDetectedAt: existing?.firstDetectedAt ?? now,
          lastSeenAt: now,
        });
      }

      // Remove contacts not in scan (they're out of range)
      const scanIds = new Set(scanContacts.map(c => c.entity_id));
      for (const [id] of prev) {
        if (!scanIds.has(id)) {
          next.delete(id);
        }
      }

      return next;
    });
  }, []);

  // Clear all contacts
  const clearContacts = useCallback(() => {
    setContacts(new Map());
  }, []);

  // Get contacts as array sorted by distance
  const contactsList = Array.from(contacts.values()).sort((a, b) => a.distance - b.distance);

  // Get contacts by classification
  const hostileContacts = contactsList.filter(c => c.classification === 'hostile');
  const friendlyContacts = contactsList.filter(c => c.classification === 'friendly');
  const neutralContacts = contactsList.filter(c => c.classification === 'neutral');
  const unknownContacts = contactsList.filter(c => c.classification === 'unknown');

  return {
    contacts,
    contactsList,
    hostileContacts,
    friendlyContacts,
    neutralContacts,
    unknownContacts,
    updateFromScan,
    clearContacts,
    connected,
  };
}
